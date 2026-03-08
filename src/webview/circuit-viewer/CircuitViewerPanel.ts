import * as vscode from "vscode";
import { CircuitModel } from "../../circuit/types";
import { getCircuitRendererHtml } from "./circuitRendererHtml";

export class CircuitViewerPanel {
  public static readonly viewType = "qsim.circuitViewer";
  private static instance: CircuitViewerPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this.panel = panel;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public static createOrShow(extensionUri: vscode.Uri, circuitModel: CircuitModel): CircuitViewerPanel {
    const column = vscode.ViewColumn.Beside;

    if (CircuitViewerPanel.instance) {
      CircuitViewerPanel.instance.panel.reveal(column);
      CircuitViewerPanel.instance.update(circuitModel);
      return CircuitViewerPanel.instance;
    }

    const panel = vscode.window.createWebviewPanel(
      CircuitViewerPanel.viewType,
      "Circuit Viewer",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    CircuitViewerPanel.instance = new CircuitViewerPanel(panel, extensionUri);
    CircuitViewerPanel.instance.update(circuitModel);
    return CircuitViewerPanel.instance;
  }

  public update(model: CircuitModel): void {
    this.panel.webview.html = getCircuitRendererHtml(this.panel.webview, model);
  }

  private dispose(): void {
    CircuitViewerPanel.instance = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) { d.dispose(); }
    }
  }
}
