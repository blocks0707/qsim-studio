import * as vscode from "vscode";
import { parseCode } from "../circuit/parser";
import { CircuitViewerPanel } from "../webview/circuit-viewer/CircuitViewerPanel";

let debounceTimer: ReturnType<typeof setTimeout> | undefined;

export function registerOpenCircuitViewer(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openCircuitViewer", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found.");
        return;
      }

      const code = editor.document.getText();
      const lang = editor.document.languageId;
      const model = parseCode(code, lang);

      const panel = CircuitViewerPanel.createOrShow(context.extensionUri, model);

      // Subscribe to editor changes with debounce
      const changeDisposable = vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document === editor.document) {
          if (debounceTimer) { clearTimeout(debounceTimer); }
          debounceTimer = setTimeout(() => {
            const updatedModel = parseCode(e.document.getText(), e.document.languageId);
            panel.update(updatedModel);
          }, 500);
        }
      });

      context.subscriptions.push(changeDisposable);
    })
  );
}
