"""
Shor's Algorithm (쇼어 알고리즘) — 간소화 버전
=================================================
소인수분해를 다항 시간에 수행합니다 (RSA 위협).
Simplified demonstration of Shor's algorithm for factoring N=15.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator
import math
from fractions import Fraction

N = 15  # 소인수분해할 수 / Number to factor
a = 7   # 밑 (gcd(a,N)=1) / Base coprime to N

# 간소화된 주기 찾기 회로 / Simplified period-finding circuit
# N=15, a=7 → 주기 r=4
n_count = 4  # 카운팅 큐빗 / counting qubits
n_work = 4   # 작업 큐빗 / work qubits

qc = QuantumCircuit(n_count + n_work, n_count)

# 카운팅 레지스터 초기화 / Initialize counting register
qc.h(range(n_count))

# 작업 레지스터 |1⟩ / Work register to |1⟩
qc.x(n_count)

# 제어 모듈러 거듭제곱 (간소화) / Controlled modular exponentiation (simplified for a=7, N=15)
# a^1 mod 15 = 7, a^2 mod 15 = 4, a^4 mod 15 = 1
qc.cx(0, n_count + 1)
qc.cx(0, n_count + 2)
qc.barrier()

# 역 QFT / Inverse QFT on counting register
for i in range(n_count // 2):
    qc.swap(i, n_count - 1 - i)
for i in range(n_count):
    for j in range(i):
        qc.cp(-math.pi / 2 ** (i - j), j, i)
    qc.h(i)

qc.measure(range(n_count), range(n_count))

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n측정 결과 (Results): {counts}")
print(f"\nN = {N}, a = {a}")
print("측정값으로부터 주기 r을 추출한 뒤 gcd(a^(r/2)±1, N)으로 인수를 구합니다.")
print("Extract period r from measurements, then compute factors via gcd(a^(r/2)±1, N).")

# 고전적 후처리 / Classical post-processing
r = 4  # 기대되는 주기 / expected period for a=7, N=15
factor1 = math.gcd(a ** (r // 2) - 1, N)
factor2 = math.gcd(a ** (r // 2) + 1, N)
print(f"인수 (Factors): {factor1} × {factor2} = {N}")
