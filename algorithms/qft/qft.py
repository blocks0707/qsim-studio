"""
Quantum Fourier Transform (양자 푸리에 변환)
==============================================
양자 푸리에 변환을 구현합니다 — Shor 알고리즘의 핵심 서브루틴.
Implements QFT, a key subroutine in Shor's algorithm and phase estimation.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import math

n = 4  # 큐빗 수 / number of qubits

def qft_circuit(n: int) -> QuantumCircuit:
    """n큐빗 QFT 회로 생성 / Build n-qubit QFT circuit"""
    qc = QuantumCircuit(n, n)

    for i in range(n):
        qc.h(i)
        for j in range(i + 1, n):
            # 제어 위상 회전 / Controlled phase rotation
            qc.cp(math.pi / 2 ** (j - i), j, i)
        qc.barrier()

    # 큐빗 순서 반전 / Swap qubit order
    for i in range(n // 2):
        qc.swap(i, n - 1 - i)

    return qc

# 입력 상태 준비 (예: |5⟩ = |0101⟩) / Prepare input state
qc = QuantumCircuit(n, n)
qc.x(0)  # |1⟩
qc.x(2)  # |1⟩ → |0101⟩ = |5⟩
qc.barrier()

# QFT 적용 / Apply QFT
qft = qft_circuit(n)
qc = qc.compose(qft)
qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Results): {counts}")
