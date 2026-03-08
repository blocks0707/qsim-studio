"""
Superdense Coding (초밀집 부호화)
==================================
1큐빗 전송으로 2비트 고전 정보를 보냅니다.
Send 2 classical bits by transmitting only 1 qubit, using shared entanglement.
"""

from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# 보낼 메시지 / Message to send (2 classical bits)
message = "10"

qc = QuantumCircuit(2, 2)

# 얽힘 쌍 생성 / Create EPR pair
qc.h(0)
qc.cx(0, 1)
qc.barrier()

# Alice 인코딩 / Alice encodes message on qubit 0
if message[1] == "1":
    qc.x(0)
if message[0] == "1":
    qc.z(0)
qc.barrier()

# Bob 디코딩 / Bob decodes
qc.cx(0, 1)
qc.h(0)
qc.measure([0, 1], [0, 1])

print(qc.draw())

simulator = AerSimulator()
result = simulator.run(qc, shots=1024).result()
counts = result.get_counts()
print(f"\n보낸 메시지 (Sent): {message}")
print(f"측정 결과 (Results): {counts}")
