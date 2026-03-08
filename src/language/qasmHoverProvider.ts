import * as vscode from "vscode";

const HOVER_DOCS: Record<string, string> = {
  // Gates
  h: "**Hadamard gate**\n\nCreates superposition. H|0⟩ = (|0⟩+|1⟩)/√2\n\n```\n     1  [ 1  1 ]\nH = ── │       │\n    √2  [ 1 -1 ]\n```",
  x: "**Pauli-X gate (NOT)**\n\nBit-flip gate. X|0⟩ = |1⟩, X|1⟩ = |0⟩",
  y: "**Pauli-Y gate**\n\nY = iXZ. Combines bit-flip and phase-flip.\n\nY|0⟩ = i|1⟩, Y|1⟩ = -i|0⟩",
  z: "**Pauli-Z gate**\n\nPhase-flip gate. Z|0⟩ = |0⟩, Z|1⟩ = -|1⟩",
  s: "**S gate (√Z)**\n\nPhase gate. Rotates by π/2 around Z-axis.\n\nS = P(π/2)",
  t: "**T gate (√S)**\n\nπ/8 gate. Rotates by π/4 around Z-axis.\n\nT = P(π/4)",
  sdg: "**S† (S-dagger) gate**\n\nInverse of S gate. Rotates by -π/2 around Z-axis.",
  tdg: "**T† (T-dagger) gate**\n\nInverse of T gate. Rotates by -π/4 around Z-axis.",
  sx: "**√X gate**\n\nSquare root of X gate. (√X)² = X",
  cx: "**CNOT (Controlled-NOT) gate**\n\nFlips target qubit if control qubit is |1⟩.\n\n```qasm\ncx control, target;\n```",
  cz: "**Controlled-Z gate**\n\nApplies Z to target qubit if control qubit is |1⟩.\n\n```qasm\ncz q[0], q[1];\n```",
  ccx: "**Toffoli (CCX) gate**\n\nControlled-controlled-NOT. Flips target if both controls are |1⟩.\n\n```qasm\nccx c0, c1, target;\n```",
  swap: "**SWAP gate**\n\nSwaps the quantum states of two qubits.\n\n```qasm\nswap q[0], q[1];\n```",
  rx: "**Rx(θ) — X-axis rotation**\n\nRotation around X-axis by angle θ.\n\n```qasm\nrx(pi/2) q[0];\n```",
  ry: "**Ry(θ) — Y-axis rotation**\n\nRotation around Y-axis by angle θ.\n\n```qasm\nry(pi/2) q[0];\n```",
  rz: "**Rz(θ) — Z-axis rotation**\n\nRotation around Z-axis by angle θ.\n\n```qasm\nrz(pi/4) q[0];\n```",
  p: "**Phase gate P(λ)**\n\nApplies a phase shift of λ to |1⟩.\n\n```qasm\np(pi/4) q[0];\n```",
  cp: "**Controlled-Phase gate**\n\nApplies phase λ to target if control is |1⟩.\n\n```qasm\ncp(pi/2) q[0], q[1];\n```",
  u1: "**U1(λ) gate**\n\nSingle-parameter gate. Equivalent to P(λ).\n\n```qasm\nu1(pi/4) q[0];\n```",
  u2: "**U2(φ, λ) gate**\n\nTwo-parameter single-qubit gate.\n\nU2(φ,λ) = U3(π/2, φ, λ)\n\n```qasm\nu2(0, pi) q[0];\n```",
  u3: "**U3(θ, φ, λ) gate**\n\nGeneral single-qubit rotation with 3 Euler angles.\n\n```qasm\nu3(pi/2, 0, pi) q[0];\n```",
  // Keywords
  OPENQASM: "**OPENQASM version declaration**\n\nDeclares the OpenQASM version for the file.\n\n```qasm\nOPENQASM 2.0;\nOPENQASM 3.0;\n```",
  include: "**include directive**\n\nIncludes an external QASM library file.\n\n```qasm\ninclude \"qelib1.inc\";\n```",
  qreg: "**Quantum register declaration**\n\nDeclares a quantum register with specified size.\n\n```qasm\nqreg q[5];\n```",
  creg: "**Classical register declaration**\n\nDeclares a classical register for measurement results.\n\n```qasm\ncreg c[5];\n```",
  qubit: "**Qubit declaration (OpenQASM 3.0)**\n\nDeclares qubits using OpenQASM 3.0 syntax.\n\n```qasm\nqubit[2] q;\n```",
  bit: "**Bit declaration (OpenQASM 3.0)**\n\nDeclares classical bits using OpenQASM 3.0 syntax.\n\n```qasm\nbit[2] c;\n```",
  gate: "**Custom gate definition**\n\nDefines a new gate from existing gates.\n\n```qasm\ngate bell q0, q1 {\n  h q0;\n  cx q0, q1;\n}\n```",
  measure: "**Measurement**\n\nMeasures a qubit and stores the result in a classical bit.\n\n```qasm\nmeasure q[0] -> c[0];\n```",
  barrier: "**Barrier**\n\nPrevents gate optimizations/reordering across this point.\n\n```qasm\nbarrier q;\n```",
  reset: "**Reset**\n\nResets a qubit to the |0⟩ state.\n\n```qasm\nreset q[0];\n```",
  if: "**Conditional execution**\n\nApplies a gate conditionally based on classical register value.\n\n```qasm\nif(c==1) x q[0];\n```",
};

export class QasmHoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_]\w*/);
    if (!wordRange) {
      return undefined;
    }

    const word = document.getText(wordRange);
    const doc = HOVER_DOCS[word];
    if (!doc) {
      return undefined;
    }

    return new vscode.Hover(new vscode.MarkdownString(doc), wordRange);
  }
}
