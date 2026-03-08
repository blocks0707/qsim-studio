import * as vscode from "vscode";
import * as crypto from "crypto";
import { getAIChatHtml } from "./aiChatHtml";
import { OpenClawProvider } from "../../providers/openclawProvider";
import { CodeContext } from "../../providers/types";

export class AIChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "qsim.aiChat";

  private view?: vscode.WebviewView;
  private provider = new OpenClawProvider();

  constructor(private readonly extensionUri: vscode.Uri) {}

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _ctx: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    const nonce = crypto.randomBytes(16).toString("hex");
    webviewView.webview.html = getAIChatHtml(
      nonce,
      webviewView.webview.cspSource
    );

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === "send") {
        await this.handleSend(msg.text);
      } else if (msg.type === "insertCode") {
        this.insertCodeToEditor(msg.code);
      }
    });
  }

  /** Called from context menu command to pre-fill input with selection context */
  public askAboutSelection(text: string) {
    if (this.view) {
      this.view.show(true);
      this.view.webview.postMessage({ type: "setInput", text });
    }
  }

  private getEditorContext(): CodeContext | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return undefined;
    const doc = editor.document;
    const selection = editor.selection;
    const selectedText = doc.getText(selection);
    return {
      code: doc.getText(),
      language: doc.languageId,
      fileName: doc.fileName.split(/[\\/]/).pop() || doc.fileName,
      selection: selectedText || undefined,
    };
  }

  private async handleSend(text: string): Promise<void> {
    try {
      const ctx = this.getEditorContext();
      const response = await this.provider.sendMessage(text, ctx);
      this.view?.webview.postMessage({
        type: "response",
        text: response.content,
      });
    } catch (err: any) {
      this.view?.webview.postMessage({
        type: "error",
        text: err.message || String(err),
      });
    }
  }

  private insertCodeToEditor(code: string): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage("No active editor to insert code into.");
      return;
    }
    editor.edit((b) => {
      if (editor.selection.isEmpty) {
        b.insert(editor.selection.active, code);
      } else {
        b.replace(editor.selection, code);
      }
    });
  }
}
