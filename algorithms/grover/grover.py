"""
Grover's Search Algorithm (그로버 검색 알고리즘)
==================================================
비정렬 데이터에서 O(√N)에 원하는 항목을 찾습니다.
Searches an unsorted database in O(√N) time.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import math

n = 2  # 큐빗 수 (N=4 항목) / qubits (N=4 items)
target = "11"  # 찾을 상태 / target state

qc = QuantumCircuit(n, n)

# 초기 중첩 / Initial superposition
qc.h(range(n))

# 그로버 반복 횟수 / Number of Grover iterations
iterations = int(math.pi / 4 * math.sqrt(2**n))

for _ in range(iterations):
    # 오라클: 타겟 상태에 위상 반전 / Oracle: phase flip on target
    # |11⟩ 마킹 / Mark |11⟩
    qc.cz(0, 1)
    qc.barrier()

    # 확산 연산자 / Diffusion operator
    qc.h(range(n))
    qc.x(range(n))
    qc.cz(0, 1)
    qc.x(range(n))
    qc.h(range(n))
    qc.barrier()

qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n타겟 상태 (Target): {target}")
print(f"측정 결과 (Results): {counts}")
