import * as vscode from "vscode";

interface CompletionEntry {
  label: string;
  kind: vscode.CompletionItemKind;
  detail: string;
  documentation: string;
}

const GATE_ENTRIES: CompletionEntry[] = [
  { label: "h", kind: vscode.CompletionItemKind.Function, detail: "Hadamard gate", documentation: "Creates superposition. H|0⟩ = (|0⟩+|1⟩)/√2" },
  { label: "x", kind: vscode.CompletionItemKind.Function, detail: "Pauli-X gate", documentation: "Bit-flip gate (NOT). X|0⟩ = |1⟩" },
  { label: "y", kind: vscode.CompletionItemKind.Function, detail: "Pauli-Y gate", documentation: "Y = iXZ. Combines bit-flip and phase-flip." },
  { label: "z", kind: vscode.CompletionItemKind.Function, detail: "Pauli-Z gate", documentation: "Phase-flip gate. Z|1⟩ = -|1⟩" },
  { label: "s", kind: vscode.CompletionItemKind.Function, detail: "S gate (√Z)", documentation: "Phase gate. Rotates by π/2 around Z-axis." },
  { label: "t", kind: vscode.CompletionItemKind.Function, detail: "T gate (√S)", documentation: "π/8 gate. Rotates by π/4 around Z-axis." },
  { label: "sdg", kind: vscode.CompletionItemKind.Function, detail: "S† gate", documentation: "Inverse of S gate. Rotates by -π/2 around Z-axis." },
  { label: "tdg", kind: vscode.CompletionItemKind.Function, detail: "T† gate", documentation: "Inverse of T gate. Rotates by -π/4 around Z-axis." },
  { label: "sx", kind: vscode.CompletionItemKind.Function, detail: "√X gate", documentation: "Square root of X gate." },
  { label: "cx", kind: vscode.CompletionItemKind.Function, detail: "CNOT gate", documentation: "Controlled-NOT. Flips target qubit if control is |1⟩. cx control, target;" },
  { label: "cz", kind: vscode.CompletionItemKind.Function, detail: "Controlled-Z gate", documentation: "Applies Z to target if control is |1⟩. cz q0, q1;" },
  { label: "ccx", kind: vscode.CompletionItemKind.Function, detail: "Toffoli gate", documentation: "Controlled-controlled-NOT. ccx c0, c1, target;" },
  { label: "swap", kind: vscode.CompletionItemKind.Function, detail: "SWAP gate", documentation: "Swaps the states of two qubits. swap q0, q1;" },
  { label: "rx", kind: vscode.CompletionItemKind.Function, detail: "Rx(θ) rotation", documentation: "Rotation around X-axis by angle θ. rx(theta) q;" },
  { label: "ry", kind: vscode.CompletionItemKind.Function, detail: "Ry(θ) rotation", documentation: "Rotation around Y-axis by angle θ. ry(theta) q;" },
  { label: "rz", kind: vscode.CompletionItemKind.Function, detail: "Rz(θ) rotation", documentation: "Rotation around Z-axis by angle θ. rz(theta) q;" },
  { label: "p", kind: vscode.CompletionItemKind.Function, detail: "Phase gate P(λ)", documentation: "Phase gate with parameter λ. p(lambda) q;" },
  { label: "cp", kind: vscode.CompletionItemKind.Function, detail: "Controlled-Phase", documentation: "Controlled phase gate. cp(lambda) c, t;" },
  { label: "u1", kind: vscode.CompletionItemKind.Function, detail: "U1(λ) gate", documentation: "Single-parameter single-qubit gate. u1(lambda) q;" },
  { label: "u2", kind: vscode.CompletionItemKind.Function, detail: "U2(φ,λ) gate", documentation: "Two-parameter single-qubit gate. u2(phi, lambda) q;" },
  { label: "u3", kind: vscode.CompletionItemKind.Function, detail: "U3(θ,φ,λ) gate", documentation: "General single-qubit rotation. u3(theta, phi, lambda) q;" },
];

const KEYWORD_ENTRIES: CompletionEntry[] = [
  { label: "OPENQASM", kind: vscode.CompletionItemKind.Keyword, detail: "Version declaration", documentation: "Declares the OpenQASM version. Example: OPENQASM 2.0;" },
  { label: "include", kind: vscode.CompletionItemKind.Keyword, detail: "Include file", documentation: 'Includes a QASM library file. Example: include "qelib1.inc";' },
  { label: "qreg", kind: vscode.CompletionItemKind.Keyword, detail: "Quantum register", documentation: "Declares a quantum register. Example: qreg q[2];" },
  { label: "creg", kind: vscode.CompletionItemKind.Keyword, detail: "Classical register", documentation: "Declares a classical register. Example: creg c[2];" },
  { label: "qubit", kind: vscode.CompletionItemKind.Keyword, detail: "Qubit declaration (3.0)", documentation: "Declares qubits (OpenQASM 3.0). Example: qubit[2] q;" },
  { label: "bit", kind: vscode.CompletionItemKind.Keyword, detail: "Bit declaration (3.0)", documentation: "Declares classical bits (OpenQASM 3.0). Example: bit[2] c;" },
  { label: "gate", kind: vscode.CompletionItemKind.Keyword, detail: "Gate definition", documentation: "Defines a custom gate. Example: gate mygate q { h q; }" },
  { label: "measure", kind: vscode.CompletionItemKind.Keyword, detail: "Measurement", documentation: "Measures a qubit into a classical bit. Example: measure q -> c;" },
  { label: "barrier", kind: vscode.CompletionItemKind.Keyword, detail: "Barrier", documentation: "Prevents gate optimizations across this point. Example: barrier q;" },
  { label: "reset", kind: vscode.CompletionItemKind.Keyword, detail: "Reset qubit", documentation: "Resets a qubit to |0⟩. Example: reset q[0];" },
  { label: "if", kind: vscode.CompletionItemKind.Keyword, detail: "Conditional", documentation: "Conditionally applies a gate. Example: if(c==1) x q[0];" },
];

export class QasmCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    _document: vscode.TextDocument,
    _position: vscode.Position
  ): vscode.CompletionItem[] {
    const items: vscode.CompletionItem[] = [];

    for (const entry of [...GATE_ENTRIES, ...KEYWORD_ENTRIES]) {
      const item = new vscode.CompletionItem(entry.label, entry.kind);
      item.detail = entry.detail;
      item.documentation = new vscode.MarkdownString(entry.documentation);
      items.push(item);
    }

    return items;
  }
}
