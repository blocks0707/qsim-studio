"""
Quantum Teleportation (양자 텔레포테이션)
==========================================
임의의 양자 상태를 얽힘과 고전 통신을 이용해 전송합니다.
Teleports an arbitrary quantum state using entanglement and classical communication.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

qc = QuantumCircuit(3, 3)

# 전송할 상태 준비 / Prepare state to teleport
qc.rx(1.2, 0)   # 임의 상태 / arbitrary state on qubit 0

# 얽힘 쌍 생성 (큐빗 1,2) / Create EPR pair between qubits 1 and 2
qc.h(1)
qc.cx(1, 2)

# 벨 측정 / Bell measurement on qubits 0 and 1
qc.cx(0, 1)
qc.h(0)
qc.measure(0, 0)
qc.measure(1, 1)

# 조건부 보정 / Conditional corrections
qc.cx(1, 2)   # X correction
qc.cz(0, 2)   # Z correction

qc.measure(2, 2)

print(qc.draw())

# 시뮬레이션 / Simulate
simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Results): {counts}")
