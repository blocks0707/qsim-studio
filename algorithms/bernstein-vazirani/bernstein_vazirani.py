"""
Bernstein-Vazirani Algorithm (번스타인-바지라니 알고리즘)
=========================================================
숨겨진 비트열 s를 단 한 번의 쿼리로 찾습니다.
Finds hidden bit string s in a single query where f(x) = s·x mod 2.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# 숨겨진 비트열 / Hidden bit string
secret = "101"
n = len(secret)

qc = QuantumCircuit(n + 1, n)

# 보조 큐빗 |1⟩ / Ancilla to |1⟩
qc.x(n)
qc.h(range(n + 1))
qc.barrier()

# 오라클: s·x mod 2 / Oracle for inner product
for i, bit in enumerate(reversed(secret)):
    if bit == "1":
        qc.cx(i, n)
qc.barrier()

qc.h(range(n))
qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n숨겨진 비트열 (Hidden string): {secret}")
print(f"측정 결과 (Results): {counts}")
