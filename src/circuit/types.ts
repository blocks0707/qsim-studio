export interface CircuitModel {
  qubits: number;
  classicalBits: number;
  gates: GateOperation[];
}

export interface GateOperation {
  name: string;
  qubits: number[];
  classicalBits?: number[];
  params?: number[];
  label?: string;
}
