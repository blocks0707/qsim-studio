import { parseQASM, parseQiskit, parseCode } from '../circuit/parser';

describe('parseQASM', () => {
  test('extracts qreg and creg', () => {
    const code = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[3];\ncreg c[3];`;
    const result = parseQASM(code);
    expect(result.qubits).toBe(3);
    expect(result.classicalBits).toBe(3);
    expect(result.gates).toHaveLength(0);
  });

  test('parses single-qubit gates', () => {
    const code = `qreg q[2];\nh q[0];\nx q[1];`;
    const result = parseQASM(code);
    expect(result.gates).toHaveLength(2);
    expect(result.gates[0]).toEqual({ name: 'h', qubits: [0] });
    expect(result.gates[1]).toEqual({ name: 'x', qubits: [1] });
  });

  test('parses multi-qubit gates', () => {
    const code = `qreg q[3];\ncx q[0], q[1];\nccx q[0], q[1], q[2];`;
    const result = parseQASM(code);
    expect(result.gates).toHaveLength(2);
    expect(result.gates[0]).toEqual({ name: 'cx', qubits: [0, 1] });
    expect(result.gates[1]).toEqual({ name: 'ccx', qubits: [0, 1, 2] });
  });

  test('parses parameterized gates', () => {
    const code = `qreg q[1];\nrx(1.5708) q[0];\nrz(3.14159) q[0];`;
    const result = parseQASM(code);
    expect(result.gates).toHaveLength(2);
    expect(result.gates[0].name).toBe('rx');
    expect(result.gates[0].params).toEqual([1.5708]);
    expect(result.gates[0].qubits).toEqual([0]);
  });

  test('parses measure', () => {
    const code = `qreg q[2];\ncreg c[2];\nmeasure q[0] -> c[0];\nmeasure q[1] -> c[1];`;
    const result = parseQASM(code);
    expect(result.gates).toHaveLength(2);
    expect(result.gates[0]).toEqual({ name: 'measure', qubits: [0], classicalBits: [0] });
  });

  test('parses barrier', () => {
    const code = `qreg q[3];\nbarrier q[0], q[1];`;
    const result = parseQASM(code);
    expect(result.gates).toHaveLength(1);
    expect(result.gates[0]).toEqual({ name: 'barrier', qubits: [0, 1] });
  });

  test('barrier without args applies to all qubits', () => {
    const code = `qreg q[3];\nbarrier;`;
    const result = parseQASM(code);
    expect(result.gates[0].qubits).toEqual([0, 1, 2]);
  });

  test('empty code returns empty model', () => {
    const result = parseQASM('');
    expect(result).toEqual({ qubits: 0, classicalBits: 0, gates: [] });
  });

  test('comments only returns empty model', () => {
    const result = parseQASM('// comment\n// another');
    expect(result).toEqual({ qubits: 0, classicalBits: 0, gates: [] });
  });

  test('ignores OPENQASM and include lines', () => {
    const code = `OPENQASM 2.0;\ninclude "qelib1.inc";\nqreg q[1];`;
    const result = parseQASM(code);
    expect(result.qubits).toBe(1);
    expect(result.gates).toHaveLength(0);
  });
});

describe('parseQiskit', () => {
  test('parses QuantumCircuit creation', () => {
    const code = `qc = QuantumCircuit(3, 3)`;
    const result = parseQiskit(code);
    expect(result.qubits).toBe(3);
    expect(result.classicalBits).toBe(3);
  });

  test('parses QuantumCircuit with qubits only', () => {
    const code = `qc = QuantumCircuit(2)`;
    const result = parseQiskit(code);
    expect(result.qubits).toBe(2);
    expect(result.classicalBits).toBe(0);
  });

  test('parses .h() gate', () => {
    const code = `qc = QuantumCircuit(2)\nqc.h(0)`;
    const result = parseQiskit(code);
    expect(result.gates).toContainEqual({ name: 'h', qubits: [0] });
  });

  test('parses .cx() gate', () => {
    const code = `qc = QuantumCircuit(2)\nqc.cx(0, 1)`;
    const result = parseQiskit(code);
    expect(result.gates).toContainEqual({ name: 'cx', qubits: [0, 1] });
  });

  test('parses .measure_all()', () => {
    const code = `qc = QuantumCircuit(2)\nqc.measure_all()`;
    const result = parseQiskit(code);
    expect(result.classicalBits).toBe(2);
    expect(result.gates).toHaveLength(2);
    expect(result.gates[0]).toEqual({ name: 'measure', qubits: [0], classicalBits: [0] });
  });

  test('parses .measure()', () => {
    const code = `qc = QuantumCircuit(2, 2)\nqc.measure(0, 0)`;
    const result = parseQiskit(code);
    expect(result.gates).toContainEqual({ name: 'measure', qubits: [0], classicalBits: [0] });
  });

  test('parses parameterized gates', () => {
    const code = `qc = QuantumCircuit(1)\nqc.rx(1.5708, 0)`;
    const result = parseQiskit(code);
    expect(result.gates[0].name).toBe('rx');
    expect(result.gates[0].params).toEqual([1.5708]);
    expect(result.gates[0].qubits).toEqual([0]);
  });

  test('parses barrier', () => {
    const code = `qc = QuantumCircuit(3)\nqc.barrier()`;
    const result = parseQiskit(code);
    expect(result.gates).toContainEqual({ name: 'barrier', qubits: [0, 1, 2] });
  });

  test('empty code', () => {
    const result = parseQiskit('');
    expect(result).toEqual({ qubits: 0, classicalBits: 0, gates: [] });
  });

  test('comments only', () => {
    const result = parseQiskit('# comment\n# another');
    expect(result).toEqual({ qubits: 0, classicalBits: 0, gates: [] });
  });
});

describe('parseCode', () => {
  test('dispatches to QASM parser', () => {
    const result = parseCode('qreg q[2];', 'qasm');
    expect(result.qubits).toBe(2);
  });

  test('dispatches to Qiskit parser for python', () => {
    const result = parseCode('qc = QuantumCircuit(2)', 'python');
    expect(result.qubits).toBe(2);
  });
});
