import * as vscode from "vscode";

interface QiskitMethod {
  label: string;
  detail: string;
  documentation: string;
  insertText?: string;
}

const quantumCircuitMethods: QiskitMethod[] = [
  { label: "h", detail: "(qubit)", documentation: "Hadamard gate: Creates equal superposition |0⟩→(|0⟩+|1⟩)/√2" },
  { label: "x", detail: "(qubit)", documentation: "Pauli-X (NOT) gate: Flips |0⟩↔|1⟩" },
  { label: "y", detail: "(qubit)", documentation: "Pauli-Y gate: Rotates π around Y-axis" },
  { label: "z", detail: "(qubit)", documentation: "Pauli-Z gate: Phase flip, |1⟩→-|1⟩" },
  { label: "s", detail: "(qubit)", documentation: "S gate (√Z): Phase gate with π/2 phase" },
  { label: "t", detail: "(qubit)", documentation: "T gate (√S): Phase gate with π/4 phase" },
  { label: "cx", detail: "(control, target)", documentation: "CNOT gate: Flips target qubit if control is |1⟩" },
  { label: "cz", detail: "(control, target)", documentation: "Controlled-Z gate: Applies Z to target if control is |1⟩" },
  { label: "ccx", detail: "(control1, control2, target)", documentation: "Toffoli (CCX) gate: Flips target if both controls are |1⟩" },
  { label: "swap", detail: "(qubit1, qubit2)", documentation: "SWAP gate: Exchanges the states of two qubits" },
  { label: "rx", detail: "(theta, qubit)", documentation: "Rotation around X-axis by angle theta (radians)", insertText: "rx(${1:theta}, ${2:qubit})" },
  { label: "ry", detail: "(theta, qubit)", documentation: "Rotation around Y-axis by angle theta (radians)", insertText: "ry(${1:theta}, ${2:qubit})" },
  { label: "rz", detail: "(phi, qubit)", documentation: "Rotation around Z-axis by angle phi (radians)", insertText: "rz(${1:phi}, ${2:qubit})" },
  { label: "cp", detail: "(theta, control, target)", documentation: "Controlled phase gate", insertText: "cp(${1:theta}, ${2:control}, ${3:target})" },
  { label: "measure", detail: "(qubit, cbit)", documentation: "Measure a qubit into a classical bit", insertText: "measure(${1:qubit}, ${2:cbit})" },
  { label: "measure_all", detail: "()", documentation: "Measure all qubits, adding classical bits automatically" },
  { label: "barrier", detail: "(*qubits)", documentation: "Insert a barrier for visualization and optimization separation" },
  { label: "reset", detail: "(qubit)", documentation: "Reset qubit to |0⟩ state" },
  { label: "draw", detail: "(output='mpl')", documentation: "Draw the circuit. output: 'text', 'mpl', 'latex'", insertText: "draw(output='${1|text,mpl,latex|}')" },
  { label: "depth", detail: "()", documentation: "Return the circuit depth (longest path)" },
  { label: "size", detail: "()", documentation: "Return total number of gate operations" },
  { label: "num_qubits", detail: "(property)", documentation: "Number of qubits in the circuit" },
  { label: "num_clbits", detail: "(property)", documentation: "Number of classical bits in the circuit" },
  { label: "append", detail: "(instruction, qargs, cargs)", documentation: "Append an instruction to the circuit" },
  { label: "compose", detail: "(other)", documentation: "Compose with another circuit" },
  { label: "inverse", detail: "()", documentation: "Return the inverse (adjoint) of the circuit" },
  { label: "decompose", detail: "()", documentation: "Decompose the circuit into lower-level gates" },
];

const qiskitImports: QiskitMethod[] = [
  { label: "QuantumCircuit", detail: "class", documentation: "Main class for creating quantum circuits" },
  { label: "QuantumRegister", detail: "class", documentation: "A register of qubits" },
  { label: "ClassicalRegister", detail: "class", documentation: "A register of classical bits" },
  { label: "transpile", detail: "function", documentation: "Transpile circuits for a backend, optimizing gates" },
];

const qiskitAerImports: QiskitMethod[] = [
  { label: "AerSimulator", detail: "class", documentation: "High-performance circuit simulator from qiskit-aer" },
];

export class QiskitCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);

    // from qiskit import ...
    if (linePrefix.match(/from\s+qiskit\s+import\s+/)) {
      return qiskitImports.map((m) => this.makeItem(m, vscode.CompletionItemKind.Class));
    }

    // from qiskit_aer import ...
    if (linePrefix.match(/from\s+qiskit_aer\s+import\s+/)) {
      return qiskitAerImports.map((m) => this.makeItem(m, vscode.CompletionItemKind.Class));
    }

    // Dot completion: detect variable.method pattern
    if (linePrefix.match(/\w+\.$/)) {
      const text = document.getText();
      const hasQiskit = /from\s+qiskit\s+import|import\s+qiskit|QuantumCircuit/.test(text);
      if (hasQiskit) {
        return quantumCircuitMethods.map((m) =>
          this.makeItem(m, vscode.CompletionItemKind.Method)
        );
      }
    }

    return undefined;
  }

  private makeItem(m: QiskitMethod, kind: vscode.CompletionItemKind): vscode.CompletionItem {
    const item = new vscode.CompletionItem(m.label, kind);
    item.detail = m.detail;
    item.documentation = new vscode.MarkdownString(m.documentation);
    if (m.insertText) {
      item.insertText = new vscode.SnippetString(m.insertText);
    }
    return item;
  }
}
