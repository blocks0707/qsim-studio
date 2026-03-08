"""
Simon's Algorithm (사이먼 알고리즘)
=====================================
2-to-1 함수의 숨겨진 주기 s를 찾습니다 (지수적 속도 향상).
Finds hidden period s of a 2-to-1 function with exponential speedup.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import numpy as np

n = 2  # 입력 비트 수 / input bits
secret = "11"  # 숨겨진 주기 / hidden period

qc = QuantumCircuit(2 * n, n)

# 하다마드 / Hadamard on input register
qc.h(range(n))
qc.barrier()

# 오라클: f(x) = f(x ⊕ s) / Oracle
# 간단한 예: CNOT 복사 + secret 적용
for i in range(n):
    qc.cx(i, i + n)
# secret 비트가 1인 위치에 CNOT 추가
for i, bit in enumerate(reversed(secret)):
    if bit == "1":
        qc.cx(0, i + n)
qc.barrier()

# 하다마드 / Hadamard on input register
qc.h(range(n))
qc.measure(range(n), range(n))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n숨겨진 주기 (Hidden period): {secret}")
print(f"측정 결과 (Results): {counts}")
print("결과 y는 s·y = 0 (mod 2)를 만족 / Results y satisfy s·y = 0 mod 2")
