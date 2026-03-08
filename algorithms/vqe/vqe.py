"""
VQE — Variational Quantum Eigensolver
=======================================
변분 양자 고유값 솔버: 해밀토니안의 바닥 상태 에너지를 근사합니다.
Approximates the ground state energy of a Hamiltonian using a classical-quantum hybrid loop.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

simulator = AerSimulator()

def ansatz(theta: float) -> QuantumCircuit:
    """간단한 2큐빗 변분 회로 / Simple 2-qubit variational ansatz"""
    qc = QuantumCircuit(2, 2)
    qc.ry(theta, 0)
    qc.cx(0, 1)
    return qc

def measure_zz(theta: float) -> float:
    """⟨ZZ⟩ 기대값 측정 / Measure expectation value of ZZ"""
    qc = ansatz(theta)
    qc.measure([0, 1], [0, 1])
    result = simulator.run(qc, shots=1024).result()
    counts = result.get_counts()
    total = sum(counts.values())
    exp = 0.0
    for bitstring, count in counts.items():
        parity = (-1) ** bitstring.count("1")
        exp += parity * count / total
    return exp

# 간단한 그래디언트-프리 최적화 / Simple gradient-free optimization
best_theta = 0.0
best_energy = float("inf")

print("VQE 최적화 시작 / Starting VQE optimization")
print("-" * 40)

for theta in np.linspace(0, 2 * np.pi, 50):
    energy = measure_zz(theta)
    if energy < best_energy:
        best_energy = energy
        best_theta = theta
    print(f"θ = {theta:.3f}, ⟨ZZ⟩ = {energy:.4f}")

print("-" * 40)
print(f"최적 파라미터 (Optimal θ): {best_theta:.4f}")
print(f"바닥 상태 에너지 근사 (Ground state energy): {best_energy:.4f}")
print(f"이론값 (Exact): -1.0")
