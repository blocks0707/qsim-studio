import * as vscode from "vscode";
import { SimulationResult } from "../../providers/types";
import { getResultRendererHtml } from "./resultRendererHtml";

export class ResultViewerPanel {
  public static readonly viewType = "qsim.resultViewer";
  private static instance: ResultViewerPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];
  private currentResult: SimulationResult | undefined;

  private constructor(
    panel: vscode.WebviewPanel,
    _extensionUri: vscode.Uri
  ) {
    this.panel = panel;

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.type) {
          case "exportCsv":
            await this.handleExportCsv(msg.data);
            break;
          case "exportPng":
            await this.handleExportPng(msg.data);
            break;
        }
      },
      null,
      this.disposables
    );
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    result: SimulationResult
  ): ResultViewerPanel {
    const column = vscode.ViewColumn.Beside;

    if (ResultViewerPanel.instance) {
      ResultViewerPanel.instance.panel.reveal(column);
      ResultViewerPanel.instance.update(result);
      return ResultViewerPanel.instance;
    }

    const panel = vscode.window.createWebviewPanel(
      ResultViewerPanel.viewType,
      "Simulation Results",
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [extensionUri],
      }
    );

    ResultViewerPanel.instance = new ResultViewerPanel(panel, extensionUri);
    ResultViewerPanel.instance.update(result);
    return ResultViewerPanel.instance;
  }

  public update(result: SimulationResult): void {
    this.currentResult = result;
    this.panel.webview.html = getResultRendererHtml(this.panel.webview, result);
  }

  private async handleExportCsv(csvContent: string): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(
        `qsim-result-${this.currentResult?.jobId ?? "unknown"}.csv`
      ),
      filters: { CSV: ["csv"] },
    });
    if (uri) {
      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(csvContent, "utf-8")
      );
      vscode.window.showInformationMessage(`Results exported to ${uri.fsPath}`);
    }
  }

  private async handleExportPng(dataUrl: string): Promise<void> {
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(
        `qsim-result-${this.currentResult?.jobId ?? "unknown"}.png`
      ),
      filters: { PNG: ["png"] },
    });
    if (uri) {
      const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
      await vscode.workspace.fs.writeFile(uri, Buffer.from(base64, "base64"));
      vscode.window.showInformationMessage(`Chart exported to ${uri.fsPath}`);
    }
  }

  private dispose(): void {
    ResultViewerPanel.instance = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const d = this.disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
