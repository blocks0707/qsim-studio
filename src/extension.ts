import * as vscode from "vscode";
import { QasmCompletionProvider } from "./language/qasmCompletionProvider";
import { QasmHoverProvider } from "./language/qasmHoverProvider";
import { createQasmDiagnostics } from "./language/qasmDiagnostics";

export function activate(context: vscode.ExtensionContext) {
  console.log("QSim Studio is now active!");

  // OpenQASM Language Support
  const qasmSelector: vscode.DocumentSelector = { language: "qasm" };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      qasmSelector,
      new QasmCompletionProvider()
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(qasmSelector, new QasmHoverProvider())
  );

  createQasmDiagnostics(context);

  // Circuit Viewer
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openCircuitViewer", () => {
      vscode.window.showInformationMessage("QSim: Circuit Viewer coming soon!");
    })
  );

  // Result Viewer
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openResultViewer", () => {
      vscode.window.showInformationMessage("QSim: Result Viewer coming soon!");
    })
  );

  // AI Chat
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openAIChat", () => {
      vscode.window.showInformationMessage(
        "QSim: AI Assistant coming soon!"
      );
    })
  );

  // Run Simulation
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.runSimulation", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found.");
        return;
      }
      const code = editor.document.getText();
      const lang = editor.document.languageId;
      vscode.window.showInformationMessage(
        `QSim: Simulation submission coming soon! (${lang}, ${code.length} chars)`
      );
    })
  );

  // Algorithm Registry
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openAlgorithmRegistry", () => {
      vscode.window.showInformationMessage(
        "QSim: Algorithm Registry coming soon!"
      );
    })
  );

  // Configure Backend
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.configureBackend", async () => {
      const config = vscode.workspace.getConfiguration("qsim");
      const url = await vscode.window.showInputBox({
        prompt: "Enter qsim-cluster API URL",
        value: config.get<string>("apiUrl", "http://localhost:8080"),
      });
      if (url) {
        await config.update("apiUrl", url, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`QSim: API URL set to ${url}`);
      }
    })
  );

  // Status bar
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.text = "$(atom) QSim";
  statusBar.tooltip = "QSim Studio";
  statusBar.command = "qsim.runSimulation";
  statusBar.show();
  context.subscriptions.push(statusBar);
}

export function deactivate() {
  console.log("QSim Studio deactivated.");
}
