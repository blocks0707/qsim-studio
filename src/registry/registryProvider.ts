import * as vscode from "vscode";
import * as path from "path";

export interface AlgorithmMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  qubits: number;
  difficulty: string;
  tags: string[];
}

const CATEGORY_ICONS: Record<string, string> = {
  fundamentals: "beaker",
  search: "search",
  transforms: "graph",
  cryptography: "key",
  optimization: "zap",
};

export class AlgorithmRegistryProvider
  implements vscode.TreeDataProvider<AlgorithmTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    AlgorithmTreeItem | undefined
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private algorithms: AlgorithmMeta[];

  constructor(private extensionUri: vscode.Uri) {
    this.algorithms = require("./algorithms.json") as AlgorithmMeta[];
  }

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: AlgorithmTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: AlgorithmTreeItem): AlgorithmTreeItem[] {
    if (!element) {
      // Root: categories
      const categories = [...new Set(this.algorithms.map((a) => a.category))];
      return categories.map((cat) => {
        const icon = CATEGORY_ICONS[cat] || "folder";
        const item = new AlgorithmTreeItem(
          cat.charAt(0).toUpperCase() + cat.slice(1),
          vscode.TreeItemCollapsibleState.Expanded
        );
        item.iconPath = new vscode.ThemeIcon(icon);
        item.contextValue = "category";
        item.categoryId = cat;
        return item;
      });
    }

    if (element.categoryId) {
      return this.algorithms
        .filter((a) => a.category === element.categoryId)
        .map((a) => {
          const item = new AlgorithmTreeItem(
            a.name,
            vscode.TreeItemCollapsibleState.None
          );
          item.description = `${a.qubits}q · ${a.difficulty}`;
          item.tooltip = `${a.description}\nTags: ${a.tags.join(", ")}`;
          item.iconPath = new vscode.ThemeIcon("circuit-board");
          item.contextValue = "algorithm";
          item.algorithmMeta = a;
          item.command = {
            command: "qsim.openAlgorithmFile",
            title: "Open Algorithm",
            arguments: [a],
          };
          return item;
        });
    }

    return [];
  }
}

export class AlgorithmTreeItem extends vscode.TreeItem {
  categoryId?: string;
  algorithmMeta?: AlgorithmMeta;
}

/** Map algorithm id → code file path (relative to extension root) */
const CODE_FILES: Record<string, string> = {
  "bell-state": "algorithms/bell-state/bell_state.py",
  teleportation: "algorithms/teleportation/teleportation.py",
  ghz: "algorithms/ghz/ghz_state.py",
  "superdense-coding": "algorithms/superdense-coding/superdense_coding.py",
  "deutsch-jozsa": "algorithms/deutsch-jozsa/deutsch_jozsa.py",
  "bernstein-vazirani": "algorithms/bernstein-vazirani/bernstein_vazirani.py",
  simon: "algorithms/simon/simon.py",
  grover: "algorithms/grover/grover.py",
  qft: "algorithms/qft/qft.py",
  shor: "algorithms/shor/shor.py",
  vqe: "algorithms/vqe/vqe.py",
  qaoa: "algorithms/qaoa/qaoa.py",
};

export function getAlgorithmCodeUri(
  extensionUri: vscode.Uri,
  algorithmId: string
): vscode.Uri | undefined {
  const rel = CODE_FILES[algorithmId];
  if (!rel) return undefined;
  return vscode.Uri.joinPath(extensionUri, rel);
}
