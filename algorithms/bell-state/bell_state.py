"""
Bell State (벨 상태) - EPR Pair
================================
2큐빗 최대 얽힘 상태 |Φ+⟩ = (|00⟩ + |11⟩) / √2 를 생성합니다.
Creates a maximally entangled Bell state using Hadamard + CNOT.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# 회로 구성 / Build circuit
qc = QuantumCircuit(2, 2)
qc.h(0)        # 하다마드 게이트: 중첩 생성 / Hadamard: create superposition
qc.cx(0, 1)    # CNOT: 얽힘 생성 / CNOT: entangle qubits
qc.measure([0, 1], [0, 1])

print(qc.draw())

# 시뮬레이션 / Simulate
simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Measurement results): {counts}")
# 예상: |00⟩ 과 |11⟩ 이 약 50:50 / Expected: ~50% |00⟩ and ~50% |11⟩
