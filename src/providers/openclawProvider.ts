import * as vscode from "vscode";
import { AIProvider, AIResponse, CodeContext } from "./types";

export class OpenClawProvider implements AIProvider {
  id = "openclaw";
  name = "OpenClaw AI";

  private sessionKey = "qsim-studio";

  private getBaseUrl(): string {
    return vscode.workspace
      .getConfiguration("qsim")
      .get<string>("openclawUrl", "http://localhost:18789");
  }

  async sendMessage(message: string, context?: CodeContext): Promise<AIResponse> {
    const baseUrl = this.getBaseUrl();

    let fullMessage = message;
    if (context) {
      const parts: string[] = [];
      if (context.selection) {
        parts.push(`Selected code (${context.language}, ${context.fileName}):\n\`\`\`${context.language}\n${context.selection}\n\`\`\``);
      } else if (context.code) {
        parts.push(`Current file (${context.language}, ${context.fileName}):\n\`\`\`${context.language}\n${context.code}\n\`\`\``);
      }
      parts.push(message);
      fullMessage = parts.join("\n\n");
    }

    const systemPrompt =
      "You are a quantum computing assistant integrated into QSim Studio (a VS Code extension). " +
      "Help with Qiskit/QASM code, quantum concepts, and algorithm design. " +
      "When providing code, use appropriate language markers in code blocks.";

    const url = `${baseUrl}/api/sessions/${encodeURIComponent(this.sessionKey)}/message`;

    const body = {
      message: fullMessage,
      systemPrompt,
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      throw new Error(`OpenClaw request failed (${resp.status}): ${text}`);
    }

    const data = (await resp.json()) as { reply?: string; content?: string; message?: string };
    const content = data.reply || data.content || data.message || JSON.stringify(data);

    // Extract code blocks from markdown
    const codeBlocks: Array<{ language: string; code: string }> = [];
    const codeBlockRe = /```(\w*)\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    while ((m = codeBlockRe.exec(content)) !== null) {
      codeBlocks.push({ language: m[1] || "text", code: m[2].trimEnd() });
    }

    return { content, codeBlocks: codeBlocks.length > 0 ? codeBlocks : undefined };
  }
}
