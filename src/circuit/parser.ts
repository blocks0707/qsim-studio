import { CircuitModel, GateOperation } from "./types";

export function parseQASM(code: string): CircuitModel {
  let qubits = 0;
  let classicalBits = 0;
  const gates: GateOperation[] = [];

  const lines = code.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//") && !l.startsWith("OPENQASM") && !l.startsWith("include"));

  for (const line of lines) {
    // qreg q[n];
    const qregMatch = line.match(/^qreg\s+\w+\[(\d+)\]\s*;/);
    if (qregMatch) {
      qubits = Math.max(qubits, parseInt(qregMatch[1], 10));
      continue;
    }

    // creg c[n];
    const cregMatch = line.match(/^creg\s+\w+\[(\d+)\]\s*;/);
    if (cregMatch) {
      classicalBits = Math.max(classicalBits, parseInt(cregMatch[1], 10));
      continue;
    }

    // measure q[0] -> c[0];
    const measureMatch = line.match(/^measure\s+\w+\[(\d+)\]\s*->\s*\w+\[(\d+)\]\s*;/);
    if (measureMatch) {
      gates.push({
        name: "measure",
        qubits: [parseInt(measureMatch[1], 10)],
        classicalBits: [parseInt(measureMatch[2], 10)],
      });
      continue;
    }

    // barrier q[0], q[1]; or barrier;
    if (line.match(/^barrier/)) {
      const idxMatches = [...line.matchAll(/\w+\[(\d+)\]/g)];
      const qubitsArr = idxMatches.length > 0
        ? idxMatches.map((m) => parseInt(m[1], 10))
        : Array.from({ length: qubits }, (_, i) => i);
      gates.push({ name: "barrier", qubits: qubitsArr });
      continue;
    }

    // Parameterized gate: rx(0.5) q[0];
    const paramGateMatch = line.match(/^(\w+)\(([^)]+)\)\s+(.+);/);
    if (paramGateMatch) {
      const name = paramGateMatch[1].toLowerCase();
      const params = paramGateMatch[2].split(",").map((p) => {
        const v = parseFloat(p.trim());
        return isNaN(v) ? 0 : v;
      });
      const idxMatches = [...paramGateMatch[3].matchAll(/\w+\[(\d+)\]/g)];
      const qubitsArr = idxMatches.map((m) => parseInt(m[1], 10));
      gates.push({ name, qubits: qubitsArr, params });
      continue;
    }

    // Simple gate: h q[0]; cx q[0], q[1];
    const gateMatch = line.match(/^(\w+)\s+(.+);/);
    if (gateMatch) {
      const name = gateMatch[1].toLowerCase();
      const idxMatches = [...gateMatch[2].matchAll(/\w+\[(\d+)\]/g)];
      const qubitsArr = idxMatches.map((m) => parseInt(m[1], 10));
      if (qubitsArr.length > 0) {
        gates.push({ name, qubits: qubitsArr });
      }
    }
  }

  return { qubits, classicalBits, gates };
}

export function parseQiskit(code: string): CircuitModel {
  let qubits = 0;
  let classicalBits = 0;
  const gates: GateOperation[] = [];

  // Find variable name and circuit size
  // QuantumCircuit(n) or QuantumCircuit(n, m)
  const circuitMatch = code.match(/(\w+)\s*=\s*QuantumCircuit\((\d+)(?:\s*,\s*(\d+))?\)/);
  let varName = "qc";
  if (circuitMatch) {
    varName = circuitMatch[1];
    qubits = parseInt(circuitMatch[2], 10);
    classicalBits = circuitMatch[3] ? parseInt(circuitMatch[3], 10) : 0;
  }

  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const lines = code.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  for (const line of lines) {
    // measure_all()
    const measureAllMatch = line.match(new RegExp(`^${escaped}\\.measure_all\\(`));
    if (measureAllMatch) {
      if (classicalBits === 0) { classicalBits = qubits; }
      for (let i = 0; i < qubits; i++) {
        gates.push({ name: "measure", qubits: [i], classicalBits: [i] });
      }
      continue;
    }

    // measure([0,1], [0,1]) or measure(0, 0)
    const measureMatch = line.match(new RegExp(`^${escaped}\\.measure\\((.+)\\)`));
    if (measureMatch) {
      const args = measureMatch[1];
      const listMatch = args.match(/\[([^\]]*)\]\s*,\s*\[([^\]]*)\]/);
      if (listMatch) {
        const qs = listMatch[1].split(",").map((s) => parseInt(s.trim(), 10));
        const cs = listMatch[2].split(",").map((s) => parseInt(s.trim(), 10));
        for (let i = 0; i < qs.length; i++) {
          gates.push({ name: "measure", qubits: [qs[i]], classicalBits: [cs[i]] });
        }
      } else {
        const nums = args.split(",").map((s) => parseInt(s.trim(), 10));
        if (nums.length >= 2) {
          gates.push({ name: "measure", qubits: [nums[0]], classicalBits: [nums[1]] });
        }
      }
      continue;
    }

    // barrier()
    const barrierMatch = line.match(new RegExp(`^${escaped}\\.barrier\\(`));
    if (barrierMatch) {
      gates.push({ name: "barrier", qubits: Array.from({ length: qubits }, (_, i) => i) });
      continue;
    }

    // Parameterized gate: qc.rx(0.5, 0)
    const paramMatch = line.match(new RegExp(`^${escaped}\\.(\\w+)\\(([^)]+)\\)`));
    if (paramMatch) {
      const name = paramMatch[1].toLowerCase();
      if (name === "measure" || name === "measure_all" || name === "barrier") { continue; }
      const args = paramMatch[2].split(",").map((s) => s.trim());
      // Heuristic: last args that are integers are qubit indices
      const nums: number[] = [];
      const params: number[] = [];
      for (const a of args) {
        const v = parseFloat(a);
        if (!isNaN(v)) { nums.push(v); }
      }
      // For gates like rx(theta, qubit), separate params from qubits
      // Single-qubit gates with params: rx, ry, rz, p, u1, u2, u3
      const paramGates = ["rx", "ry", "rz", "p", "u1", "u2", "u3", "rxx", "rzz"];
      if (paramGates.includes(name) && nums.length >= 2) {
        const qubitsArr = nums.slice(-1).map((n) => Math.floor(n));
        const gateParams = nums.slice(0, -1);
        // Multi-qubit param gates
        if (["rxx", "rzz"].includes(name) && nums.length >= 3) {
          gates.push({ name, qubits: nums.slice(-2).map((n) => Math.floor(n)), params: nums.slice(0, -2) });
        } else {
          gates.push({ name, qubits: qubitsArr, params: gateParams });
        }
      } else {
        // All args are qubit indices
        gates.push({ name, qubits: nums.map((n) => Math.floor(n)) });
      }
    }
  }

  return { qubits, classicalBits, gates };
}

export function parseCode(code: string, languageId: string): CircuitModel {
  if (languageId === "qasm") {
    return parseQASM(code);
  }
  return parseQiskit(code);
}
