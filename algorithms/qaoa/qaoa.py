"""
QAOA — Quantum Approximate Optimization Algorithm
====================================================
조합 최적화 문제를 양자 근사 최적화로 풉니다.
Solves combinatorial optimization problems (MaxCut example).
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

simulator = AerSimulator()
n = 4  # 노드 수 / number of nodes

# 그래프 간선 (MaxCut 문제) / Graph edges for MaxCut
edges = [(0, 1), (1, 2), (2, 3), (3, 0)]

def qaoa_circuit(gamma: float, beta: float) -> QuantumCircuit:
    """1-layer QAOA 회로 / Single-layer QAOA circuit"""
    qc = QuantumCircuit(n, n)

    # 초기 중첩 / Initial superposition
    qc.h(range(n))

    # 문제 해밀토니안 (Cost layer) / Problem Hamiltonian
    for i, j in edges:
        qc.cx(i, j)
        qc.rz(gamma, j)
        qc.cx(i, j)

    # 믹서 (Mixer layer)
    qc.rx(2 * beta, range(n))

    qc.measure(range(n), range(n))
    return qc

def evaluate_cut(bitstring: str) -> int:
    """컷 값 계산 / Compute cut value"""
    return sum(1 for i, j in edges if bitstring[i] != bitstring[j])

def run_qaoa(gamma: float, beta: float) -> float:
    """QAOA 실행 및 기대값 반환 / Run QAOA and return expected cut value"""
    qc = qaoa_circuit(gamma, beta)
    result = simulator.run(qc, shots=1024).result()
    counts = result.get_counts()
    total = sum(counts.values())
    exp = sum(evaluate_cut(bs.zfill(n)) * cnt for bs, cnt in counts.items()) / total
    return exp

# 파라미터 스캔 / Parameter scan
best_val = 0.0
best_params = (0.0, 0.0)

print("QAOA MaxCut 최적화 / QAOA MaxCut optimization")
print(f"그래프 간선 (Edges): {edges}")
print("-" * 40)

for gamma in np.linspace(0, np.pi, 10):
    for beta in np.linspace(0, np.pi, 10):
        val = run_qaoa(gamma, beta)
        if val > best_val:
            best_val = val
            best_params = (gamma, beta)

print(f"최적 파라미터 (Best params): γ={best_params[0]:.3f}, β={best_params[1]:.3f}")
print(f"최대 컷 기대값 (Expected max cut): {best_val:.3f}")
print(f"이론적 최대 (Theoretical max): {len(edges)}")
