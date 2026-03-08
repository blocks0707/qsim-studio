import * as vscode from "vscode";
import type { AlgorithmMeta } from "../registry/registryProvider";
import { getAlgorithmCodeUri } from "../registry/registryProvider";

export function registerAlgorithmCommands(
  context: vscode.ExtensionContext,
  algorithms: AlgorithmMeta[]
) {
  // Quick Pick 검색
  context.subscriptions.push(
    vscode.commands.registerCommand("qsim.openAlgorithmRegistry", async () => {
      const items = algorithms.map((a) => ({
        label: `$(circuit-board) ${a.name}`,
        description: a.category,
        detail: `${a.description} · ${a.qubits} qubits · ${a.difficulty}`,
        meta: a,
      }));

      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Search quantum algorithms...",
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (picked) {
        openAlgorithmCode(context.extensionUri, picked.meta);
      }
    })
  );

  // 파일 열기
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "qsim.openAlgorithmFile",
      (meta: AlgorithmMeta) => {
        openAlgorithmCode(context.extensionUri, meta);
      }
    )
  );

  // Insert to Editor
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "qsim.insertAlgorithm",
      async (item: any) => {
        const meta: AlgorithmMeta | undefined = item?.algorithmMeta;
        if (!meta) return;
        const uri = getAlgorithmCodeUri(context.extensionUri, meta.id);
        if (!uri) return;
        try {
          const content = await vscode.workspace.fs.readFile(uri);
          const text = Buffer.from(content).toString("utf-8");
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit((edit) => {
              edit.insert(editor.selection.active, text);
            });
          } else {
            const doc = await vscode.workspace.openTextDocument({
              content: text,
              language: "python",
            });
            await vscode.window.showTextDocument(doc);
          }
        } catch {
          vscode.window.showErrorMessage(
            `Could not read algorithm file for ${meta.name}`
          );
        }
      }
    )
  );
}

async function openAlgorithmCode(
  extensionUri: vscode.Uri,
  meta: AlgorithmMeta
) {
  const uri = getAlgorithmCodeUri(extensionUri, meta.id);
  if (!uri) {
    vscode.window.showWarningMessage(`No code file for ${meta.name}`);
    return;
  }
  try {
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
  } catch {
    vscode.window.showErrorMessage(
      `Could not open algorithm file for ${meta.name}`
    );
  }
}
