import * as vscode from "vscode";
import { QSimProvider } from "../providers/qsimProvider";
import { JobStatus } from "../providers/types";

interface JobRecord {
  jobId: string;
  status: JobStatus["status"];
  language: string;
  submittedAt: Date;
}

export class JobsTreeProvider implements vscode.TreeDataProvider<JobRecord> {
  private _onDidChangeTreeData = new vscode.EventEmitter<
    JobRecord | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private jobs: JobRecord[] = [];
  private provider: QSimProvider;
  private outputChannel: vscode.OutputChannel;

  constructor(provider: QSimProvider, outputChannel: vscode.OutputChannel) {
    this.provider = provider;
    this.outputChannel = outputChannel;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  addJob(jobId: string, language: string) {
    this.jobs.unshift({
      jobId,
      status: "pending",
      language,
      submittedAt: new Date(),
    });
    if (this.jobs.length > 50) {
      this.jobs.pop();
    }
    this.refresh();
  }

  updateJobStatus(jobId: string, status: JobStatus["status"]) {
    const job = this.jobs.find((j) => j.jobId === jobId);
    if (job) {
      job.status = status;
      this.refresh();
    }
  }

  getTreeItem(element: JobRecord): vscode.TreeItem {
    const icon = statusIcon(element.status);
    const shortId = element.jobId.substring(0, 8);
    const time = formatTime(element.submittedAt);
    const item = new vscode.TreeItem(
      `${icon} ${shortId} — ${time}`,
      vscode.TreeItemCollapsibleState.None
    );
    item.tooltip = `Job: ${element.jobId}\nStatus: ${element.status}\nLanguage: ${element.language}\nSubmitted: ${element.submittedAt.toLocaleString()}`;
    item.contextValue = element.status;
    item.command = {
      command: "qsim.showJobDetail",
      title: "Show Job Detail",
      arguments: [element],
    };
    return item;
  }

  getChildren(): JobRecord[] {
    return this.jobs;
  }

  async showJobDetail(record: JobRecord) {
    this.outputChannel.show(true);
    this.outputChannel.appendLine(`\n${"=".repeat(50)}`);
    this.outputChannel.appendLine(`Job: ${record.jobId}`);
    this.outputChannel.appendLine(`Status: ${record.status}`);
    this.outputChannel.appendLine(`Language: ${record.language}`);
    this.outputChannel.appendLine(
      `Submitted: ${record.submittedAt.toLocaleString()}`
    );

    try {
      const status = await this.provider.getJobStatus(record.jobId);
      this.outputChannel.appendLine(`Current Status: ${status.status}`);
      if (status.progress !== undefined) {
        this.outputChannel.appendLine(`Progress: ${status.progress}%`);
      }
      if (status.error) {
        this.outputChannel.appendLine(`Error: ${status.error}`);
      }
    } catch {
      this.outputChannel.appendLine(`(Could not fetch latest status)`);
    }
    this.outputChannel.appendLine("=".repeat(50));
  }
}

function statusIcon(status: JobStatus["status"]): string {
  switch (status) {
    case "pending":
    case "analyzing":
    case "submitted":
      return "⏳";
    case "running":
      return "🔄";
    case "completed":
      return "✅";
    case "failed":
      return "❌";
    case "cancelled":
      return "⛔";
    default:
      return "❓";
  }
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
