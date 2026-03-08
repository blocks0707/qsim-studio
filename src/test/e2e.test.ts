/**
 * E2E Integration Tests for QSim Studio ↔ qsim-cluster
 *
 * Prerequisites:
 *   - qsim-cluster running (minikube)
 *   - kubectl port-forward svc/api-server -n quantum-system 8080:8080
 *
 * Run: QSIM_API_URL=http://localhost:8080 QSIM_API_TOKEN=test-token npx jest src/test/e2e.test.ts
 */

const API_URL = process.env.QSIM_API_URL || 'http://localhost:8080';
const API_TOKEN = process.env.QSIM_API_TOKEN || 'test-token';
const TIMEOUT = 120_000; // 2 min per test

// Direct HTTP helper (no vscode dependency)
async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_TOKEN}`,
  };
  const resp = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`${method} ${path} → ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json() as Promise<T>;
}

async function waitForJob(
  jobId: string,
  targetStatuses: string[],
  timeoutMs = 90_000,
  pollMs = 3_000
): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const job = await api<any>('GET', `/api/v1/jobs/${jobId}`);
    if (targetStatuses.includes(job.status)) return job;
    if (['failed', 'cancelled'].includes(job.status) && !targetStatuses.includes(job.status)) {
      throw new Error(`Job ${jobId} ended with status: ${job.status}`);
    }
    await new Promise((r) => setTimeout(r, pollMs));
  }
  throw new Error(`Job ${jobId} did not reach ${targetStatuses} within ${timeoutMs}ms`);
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('E2E: qsim-cluster API health', () => {
  test('health endpoint responds', async () => {
    const res = await api<any>('GET', '/health');
    expect(res.status).toBe('ok');
  });
});

describe('E2E: Bell State circuit (2 qubits)', () => {
  let jobId: string;

  test(
    'submit Bell State job',
    async () => {
      const code = `
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
`;
      const res = await api<any>('POST', '/api/v1/jobs', {
        code,
        language: 'qiskit',
        shots: 1024,
      });
      expect(res.job_id || res.jobId).toBeTruthy();
      jobId = res.job_id || res.jobId;
    },
    TIMEOUT
  );

  test(
    'job completes successfully',
    async () => {
      const job = await waitForJob(jobId, ['completed']);
      expect(job.status).toBe('completed');
    },
    TIMEOUT
  );

  test(
    'result has correlated counts (|00⟩ and |11⟩)',
    async () => {
      const result = await api<any>('GET', `/api/v1/jobs/${jobId}/result`);
      const counts = result.result?.counts || result.counts || {};
      const states = Object.keys(counts);
      // Bell state should produce predominantly |00⟩ and |11⟩
      const bellCounts = (counts['00'] || 0) + (counts['11'] || 0);
      const total = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);
      expect(total).toBeGreaterThan(0);
      // At least 90% should be |00⟩ or |11⟩
      expect(bellCounts / total).toBeGreaterThan(0.9);
    },
    TIMEOUT
  );
});

describe('E2E: GHZ State circuit (3 qubits)', () => {
  let jobId: string;

  test(
    'submit GHZ job',
    async () => {
      const code = `
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(3, 3)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.measure([0, 1, 2], [0, 1, 2])

simulator = AerSimulator()
result = simulator.run(qc, shots=2048).result()
counts = result.get_counts()
`;
      const res = await api<any>('POST', '/api/v1/jobs', {
        code,
        language: 'qiskit',
        shots: 2048,
      });
      jobId = res.job_id || res.jobId;
      expect(jobId).toBeTruthy();
    },
    TIMEOUT
  );

  test(
    'job completes and result shows |000⟩ and |111⟩',
    async () => {
      await waitForJob(jobId, ['completed']);
      const result = await api<any>('GET', `/api/v1/jobs/${jobId}/result`);
      const counts = result.result?.counts || result.counts || {};
      // GHZ: predominantly |000⟩ and |111⟩
      const ghzCounts = (counts['000'] || 0) + (counts['111'] || 0);
      const total = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);
      expect(total).toBeGreaterThan(0);
      expect(ghzCounts / total).toBeGreaterThan(0.9);
    },
    TIMEOUT
  );
});

describe('E2E: QFT circuit (4 qubits)', () => {
  let jobId: string;

  test(
    'submit QFT job',
    async () => {
      const code = `
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

qc = QuantumCircuit(4, 4)
# Initialize |1010⟩
qc.x(1)
qc.x(3)
# QFT
for i in range(4):
    qc.h(i)
    for j in range(i + 1, 4):
        qc.cp(np.pi / (2 ** (j - i)), j, i)
# Swap
qc.swap(0, 3)
qc.swap(1, 2)
qc.measure([0, 1, 2, 3], [0, 1, 2, 3])

simulator = AerSimulator()
result = simulator.run(qc, shots=4096).result()
counts = result.get_counts()
`;
      const res = await api<any>('POST', '/api/v1/jobs', {
        code,
        language: 'qiskit',
        shots: 4096,
      });
      jobId = res.job_id || res.jobId;
      expect(jobId).toBeTruthy();
    },
    TIMEOUT
  );

  test(
    'job completes with multiple output states (QFT distributes)',
    async () => {
      await waitForJob(jobId, ['completed']);
      const result = await api<any>('GET', `/api/v1/jobs/${jobId}/result`);
      const counts = result.result?.counts || result.counts || {};
      const states = Object.keys(counts);
      // QFT should produce many states (not just 1 or 2)
      expect(states.length).toBeGreaterThan(2);
      const total = Object.values(counts).reduce((a: number, b: any) => a + Number(b), 0);
      expect(total).toBeGreaterThan(0);
    },
    TIMEOUT
  );
});

describe('E2E: Job lifecycle (cancel)', () => {
  test(
    'submit and cancel a job',
    async () => {
      const code = `
from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(2, 2)
qc.h(0)
qc.cx(0, 1)
qc.measure([0, 1], [0, 1])

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
`;
      const res = await api<any>('POST', '/api/v1/jobs', {
        code,
        language: 'qiskit',
        shots: 1024,
      });
      const jobId = res.job_id || res.jobId;

      // Try to cancel immediately
      try {
        await api<void>('DELETE', `/api/v1/jobs/${jobId}`);
      } catch {
        // Job might already be completed — that's OK
      }

      const job = await api<any>('GET', `/api/v1/jobs/${jobId}`);
      expect(['cancelled', 'completed']).toContain(job.status);
    },
    TIMEOUT
  );
});

describe('E2E: Job list and filtering', () => {
  test('list jobs returns array', async () => {
    const res = await api<any>('GET', '/api/v1/jobs');
    const jobs = res.jobs || res;
    expect(Array.isArray(jobs)).toBe(true);
  });

  test('list with status filter works', async () => {
    const res = await api<any>('GET', '/api/v1/jobs?status=completed');
    const jobs = res.jobs || res;
    expect(Array.isArray(jobs)).toBe(true);
    jobs.forEach((j: any) => {
      expect(j.status).toBe('completed');
    });
  });
});

describe('E2E: Cluster info', () => {
  test('nodes endpoint returns data', async () => {
    const res = await api<any>('GET', '/api/v1/cluster/nodes');
    const nodes = res.nodes || res;
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThan(0);
  });

  test('metrics endpoint returns data', async () => {
    const res = await api<any>('GET', '/api/v1/cluster/metrics');
    expect(res).toBeTruthy();
  });
});

describe('E2E: OpenQASM submission', () => {
  let jobId: string;

  test(
    'submit QASM code',
    async () => {
      const code = `OPENQASM 2.0;
include "qelib1.inc";
qreg q[2];
creg c[2];
h q[0];
cx q[0], q[1];
measure q -> c;
`;
      const res = await api<any>('POST', '/api/v1/jobs', {
        code,
        language: 'qasm',
        shots: 1024,
      });
      jobId = res.job_id || res.jobId;
      expect(jobId).toBeTruthy();
    },
    TIMEOUT
  );

  test(
    'QASM job completes',
    async () => {
      const job = await waitForJob(jobId, ['completed']);
      expect(job.status).toBe('completed');
    },
    TIMEOUT
  );
});
