"""
GHZ State (GHZ 상태)
=====================
N큐빗 GHZ 상태: (|000...0⟩ + |111...1⟩) / √2
N-qubit Greenberger-Horne-Zeilinger state — multipartite entanglement.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

n = 3  # 큐빗 수 / number of qubits

qc = QuantumCircuit(n, n)
qc.h(0)  # 첫 큐빗에 하다마드 / Hadamard on first qubit
for i in range(n - 1):
    qc.cx(i, i + 1)  # 연쇄 CNOT / cascading CNOT
qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Results): {counts}")
# 예상: |000⟩ 과 |111⟩ 만 출현 / Expected: only |000⟩ and |111⟩
