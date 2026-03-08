import * as vscode from "vscode";

const KNOWN_GATES = new Set([
  "h", "x", "y", "z", "s", "t", "sdg", "tdg", "sx",
  "cx", "cz", "ccx", "swap",
  "rx", "ry", "rz", "p", "cp",
  "u1", "u2", "u3",
  "id", "rxx", "ryy", "rzz", "ecr", "cswap",
]);

const KNOWN_KEYWORDS = new Set([
  "OPENQASM", "include", "qreg", "creg", "qubit", "bit",
  "gate", "measure", "barrier", "reset", "if", "opaque",
]);

export function createQasmDiagnostics(
  context: vscode.ExtensionContext
): vscode.DiagnosticCollection {
  const collection = vscode.languages.createDiagnosticCollection("qasm");
  context.subscriptions.push(collection);

  // Diagnose on open and change
  if (vscode.window.activeTextEditor?.document.languageId === "qasm") {
    updateDiagnostics(vscode.window.activeTextEditor.document, collection);
  }

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === "qasm") {
        updateDiagnostics(e.document, collection);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (doc.languageId === "qasm") {
        updateDiagnostics(doc, collection);
      }
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      collection.delete(doc.uri);
    })
  );

  return collection;
}

function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
): void {
  const diagnostics: vscode.Diagnostic[] = [];
  const text = document.getText();
  const lines = text.split("\n");

  // Track declared registers
  const declaredQregs = new Set<string>();
  const declaredCregs = new Set<string>();
  const declaredGates = new Set<string>();
  let hasVersionDecl = false;
  let isInsideGateDef = false;
  let gateParams: Set<string> = new Set();
  let braceDepth = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.replace(/\/\/.*$/, "").trim();
    if (!trimmed) {
      continue;
    }

    // Check OPENQASM declaration
    const versionMatch = trimmed.match(/^OPENQASM\s+([\d.]+)\s*;/);
    if (versionMatch) {
      hasVersionDecl = true;
      const version = versionMatch[1];
      if (version !== "2.0" && version !== "3.0" && version !== "3") {
        const col = line.indexOf(version);
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, col, i, col + version.length),
            `Unusual OpenQASM version "${version}". Expected 2.0 or 3.0.`,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
      continue;
    }

    // Check include
    if (trimmed.startsWith("include")) {
      const includeMatch = trimmed.match(/^include\s+"([^"]+)"\s*;/);
      if (!includeMatch) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(i, 0, i, line.length),
            'Invalid include syntax. Expected: include "filename";',
            vscode.DiagnosticSeverity.Error
          )
        );
      }
      continue;
    }

    // Track gate definitions
    const gateDefMatch = trimmed.match(/^gate\s+(\w+)/);
    if (gateDefMatch) {
      declaredGates.add(gateDefMatch[1]);
      isInsideGateDef = true;
      // Collect gate parameter names
      const paramPart = trimmed.replace(/^gate\s+\w+/, "").replace(/\{.*$/, "").trim();
      gateParams = new Set<string>();
      const parts = paramPart.split(/[,\s()]+/).filter(Boolean);
      for (const p of parts) {
        gateParams.add(p);
      }
    }

    // Track brace depth for gate definitions
    for (const ch of trimmed) {
      if (ch === "{") { braceDepth++; }
      if (ch === "}") {
        braceDepth--;
        if (braceDepth <= 0 && isInsideGateDef) {
          isInsideGateDef = false;
          gateParams.clear();
          braceDepth = 0;
        }
      }
    }

    // Track qreg/creg declarations
    const qregMatch = trimmed.match(/^qreg\s+(\w+)\s*\[/);
    if (qregMatch) {
      declaredQregs.add(qregMatch[1]);
      continue;
    }
    const cregMatch = trimmed.match(/^creg\s+(\w+)\s*\[/);
    if (cregMatch) {
      declaredCregs.add(cregMatch[1]);
      continue;
    }

    // OpenQASM 3.0 style: qubit[n] name; / bit[n] name;
    const qubitMatch = trimmed.match(/^qubit(\[\d+\])?\s+(\w+)/);
    if (qubitMatch) {
      declaredQregs.add(qubitMatch[2]);
      continue;
    }
    const bitMatch = trimmed.match(/^bit(\[\d+\])?\s+(\w+)/);
    if (bitMatch) {
      declaredCregs.add(bitMatch[2]);
      continue;
    }

    // Skip non-gate lines
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("OPENQASM") ||
      trimmed === "}" ||
      trimmed === "{" ||
      KNOWN_KEYWORDS.has(trimmed.split(/[\s(]/)[0])
    ) {
      continue;
    }

    // Check register usage in gate applications (outside gate definitions)
    if (!isInsideGateDef && declaredQregs.size > 0) {
      const regUsages = trimmed.matchAll(/\b([a-zA-Z_]\w*)\s*\[/g);
      for (const m of regUsages) {
        const regName = m[1];
        if (
          !declaredQregs.has(regName) &&
          !declaredCregs.has(regName) &&
          !KNOWN_GATES.has(regName) &&
          !KNOWN_KEYWORDS.has(regName) &&
          !declaredGates.has(regName)
        ) {
          const col = line.indexOf(regName, m.index);
          diagnostics.push(
            new vscode.Diagnostic(
              new vscode.Range(i, col, i, col + regName.length),
              `Register "${regName}" is not declared. Did you forget qreg/creg?`,
              vscode.DiagnosticSeverity.Warning
            )
          );
        }
      }
    }
  }

  // Warn if no version declaration and file has content
  if (!hasVersionDecl && lines.some((l) => l.trim() && !l.trim().startsWith("//"))) {
    diagnostics.push(
      new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        "Missing OPENQASM version declaration. Consider adding: OPENQASM 2.0;",
        vscode.DiagnosticSeverity.Information
      )
    );
  }

  collection.set(document.uri, diagnostics);
}
