import * as vscode from "vscode";

const hoverDocs: Record<string, string> = {
  h: "**Hadamard Gate** `h(qubit)`\n\nCreates equal superposition: |0⟩ → (|0⟩+|1⟩)/√2, |1⟩ → (|0⟩−|1⟩)/√2\n\nMatrix: `1/√2 [[1,1],[1,-1]]`",
  x: "**Pauli-X Gate** `x(qubit)`\n\nQuantum NOT gate. Flips |0⟩ ↔ |1⟩\n\nMatrix: `[[0,1],[1,0]]`",
  y: "**Pauli-Y Gate** `y(qubit)`\n\nRotation of π around Y-axis.\n\nMatrix: `[[0,-i],[i,0]]`",
  z: "**Pauli-Z Gate** `z(qubit)`\n\nPhase flip gate. |0⟩ → |0⟩, |1⟩ → −|1⟩\n\nMatrix: `[[1,0],[0,-1]]`",
  s: "**S Gate** `s(qubit)`\n\n√Z gate, phase gate with π/2 phase shift.",
  t: "**T Gate** `t(qubit)`\n\n√S gate, phase gate with π/4 phase shift.",
  cx: "**CNOT Gate** `cx(control, target)`\n\nControlled-X: Flips target qubit if control is |1⟩. Fundamental entangling gate.",
  cz: "**Controlled-Z Gate** `cz(control, target)`\n\nApplies Z gate to target if control is |1⟩.",
  ccx: "**Toffoli Gate** `ccx(ctrl1, ctrl2, target)`\n\nDouble-controlled X: Flips target if both controls are |1⟩. Universal for classical computation.",
  swap: "**SWAP Gate** `swap(qubit1, qubit2)`\n\nExchanges the quantum states of two qubits.",
  rx: "**RX Gate** `rx(θ, qubit)`\n\nRotation around X-axis by angle θ (radians).",
  ry: "**RY Gate** `ry(θ, qubit)`\n\nRotation around Y-axis by angle θ (radians).",
  rz: "**RZ Gate** `rz(φ, qubit)`\n\nRotation around Z-axis by angle φ (radians).",
  cp: "**Controlled Phase Gate** `cp(θ, control, target)`\n\nApplies a phase shift of θ to target, controlled by control qubit.",
  measure: "**Measure** `measure(qubit, cbit)`\n\nMeasures a qubit in the computational basis and stores result in a classical bit.",
  measure_all: "**Measure All** `measure_all()`\n\nMeasures all qubits, automatically adding classical bits if needed.",
  barrier: "**Barrier** `barrier(*qubits)`\n\nInserts a barrier for circuit visualization and prevents gate optimizations across it.",
  reset: "**Reset** `reset(qubit)`\n\nResets qubit to the |0⟩ state (non-unitary operation).",
  draw: "**Draw** `draw(output='mpl')`\n\nVisualizes the circuit. Outputs: `'text'`, `'mpl'` (matplotlib), `'latex'`.",
  depth: "**Depth** `depth()`\n\nReturns the circuit depth (length of the critical path).",
  size: "**Size** `size()`\n\nReturns total number of gate operations in the circuit.",
  inverse: "**Inverse** `inverse()`\n\nReturns the inverse (adjoint †) of the circuit.",
  decompose: "**Decompose** `decompose()`\n\nDecomposes circuit gates into lower-level basis gates.",
  compose: "**Compose** `compose(other)`\n\nAppends another circuit onto this one.",
  append: "**Append** `append(instruction, qargs, cargs)`\n\nAppends a gate or instruction to the circuit.",
};

export class QiskitHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    const text = document.getText();
    if (!/from\s+qiskit\s+import|import\s+qiskit|QuantumCircuit/.test(text)) {
      return undefined;
    }

    const range = document.getWordRangeAtPosition(position, /\.\w+/);
    if (!range) {
      return undefined;
    }

    const word = document.getText(range).replace(/^\./, "");
    const doc = hoverDocs[word];
    if (!doc) {
      return undefined;
    }

    return new vscode.Hover(new vscode.MarkdownString(doc), range);
  }
}
