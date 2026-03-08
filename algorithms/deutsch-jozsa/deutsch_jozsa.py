"""
Deutsch-Jozsa Algorithm (도이치-조사 알고리즘)
================================================
함수 f(x)가 constant인지 balanced인지 단 한 번의 쿼리로 판별합니다.
Determines whether f(x) is constant or balanced with a single query.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

n = 2  # 입력 큐빗 수 / number of input qubits

qc = QuantumCircuit(n + 1, n)

# 보조 큐빗을 |1⟩로 초기화 / Initialize ancilla to |1⟩
qc.x(n)

# 모든 큐빗에 하다마드 / Hadamard on all qubits
qc.h(range(n + 1))
qc.barrier()

# 오라클: balanced 함수 예시 (f(x) = x_0 XOR x_1)
# Oracle: example balanced function
qc.cx(0, n)
qc.cx(1, n)
qc.barrier()

# 입력 큐빗에 하다마드 / Hadamard on input qubits
qc.h(range(n))
qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Results): {counts}")
print("모두 0 → constant / 그 외 → balanced")
print("All zeros → constant / otherwise → balanced")
