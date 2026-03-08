import * as vscode from "vscode";
import { QasmCompletionProvider } from "./language/qasmCompletionProvider";
import { QasmHoverProvider } from "./language/qasmHoverProvider";
import { createQasmDiagnostics } from "./language/qasmDiagnostics";
import { QiskitCompletionProvider } from "./language/qiskitCompletionProvider";
import { QiskitHoverProvider } from "./language/qiskitHoverProvider";
import { registerOpenCircuitViewer } from "./commands/openCircuitViewer";
import { QSimProvider } from "./providers/qsimProvider";
import { QSimStatusBar } from "./statusBar";
import { JobsTreeProvider } from "./views/jobsTreeProvider";
import { registerRunSimulation } from "./commands/runSimulation";
import { ResultViewerPanel } from "./webview/result-viewer/ResultViewerPanel";

export function activate(context: vscode.ExtensionContext) {
  console.log("QSim Studio is now active!");

  // Output Channel
  const outputChannel = vscode.window.createOutputChannel("QSim Studio");
  context.subscriptions.push(outputChannel);

  // Simulation Provider
  const qsimProvider = new QSimProvider();

  // Status Bar
  const statusBar = new QSimStatusBar();
  context.subscriptions.push({ dispose: () => statusBar.dispose() });

  // Jobs TreeView
  const jobsTree = new JobsTreeProvider(qsimProvider, outputChannel);
  const treeView = vscode.window.createTreeView("qsim.jobs", {
    treeDataProvider: jobsTree,
  });
  context.subscriptions.push(treeView);

  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.refreshJobs", () =>
      jobsTree.refresh()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.showJobDetail", (record) =>
      jobsTree.showJobDetail(record)
    )
  );

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

  // Qiskit Python Language Support
  const pythonSelector: vscode.DocumentSelector = { language: "python" };

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      pythonSelector,
      new QiskitCompletionProvider(),
      "."
    )
  );

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(pythonSelector, new QiskitHoverProvider())
  );

  // Circuit Viewer
  registerOpenCircuitViewer(context);

  // Run Simulation
  registerRunSimulation(context, qsimProvider, statusBar, jobsTree, outputChannel);

  // Result Viewer (manual open with sample data for testing)
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openResultViewer", () => {
      ResultViewerPanel.createOrShow(context.extensionUri, {
        jobId: "sample-000",
        counts: { "00": 500, "01": 120, "10": 130, "11": 250 },
        shots: 1000,
        metadata: { qubits: 2, depth: 4, gateCount: 6, executionTimeMs: 42 },
      });
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
}

export function deactivate() {
  console.log("QSim Studio deactivated.");
}
