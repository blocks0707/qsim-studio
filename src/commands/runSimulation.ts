import * as vscode from "vscode";
import { QSimProvider } from "../providers/qsimProvider";
import { QSimStatusBar } from "../statusBar";
import { JobsTreeProvider } from "../views/jobsTreeProvider";
import { SimulationOptions } from "../providers/types";

const POLL_INTERVAL_MS = 2000;

export function registerRunSimulation(
  context: vscode.ExtensionContext,
  provider: QSimProvider,
  statusBar: QSimStatusBar,
  jobsTree: JobsTreeProvider,
  outputChannel: vscode.OutputChannel
) {
  const disposable = vscode.commands.registerCommand(
    "qsim.runSimulation",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage("No active editor found.");
        return;
      }

      const code = editor.document.getText();
      if (!code.trim()) {
        vscode.window.showWarningMessage("Editor is empty.");
        return;
      }

      // Detect language
      const langId = editor.document.languageId;
      let language: SimulationOptions["language"];
      if (langId === "qasm") {
        language = "qasm";
      } else if (langId === "python") {
        language = "python";
      } else {
        const pick = await vscode.window.showQuickPick(["python", "qasm"], {
          placeHolder: "Select simulation language",
        });
        if (!pick) {return;}
        language = pick as SimulationOptions["language"];
      }

      // Check API config
      const config = vscode.workspace.getConfiguration("qsim");
      const apiUrl = config.get<string>("apiUrl", "");
      if (!apiUrl) {
        const action = await vscode.window.showWarningMessage(
          "QSim API URL is not configured.",
          "Configure"
        );
        if (action === "Configure") {
          vscode.commands.executeCommand("qsim.configureBackend");
        }
        return;
      }

      // Run with progress
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "QSim Simulation",
          cancellable: true,
        },
        async (progress, token) => {
          try {
            // Submit
            progress.report({ message: "Submitting job..." });
            statusBar.running();
            outputChannel.appendLine(
              `[${new Date().toLocaleTimeString()}] Submitting ${language} job...`
            );

            const handle = await provider.submitJob(code, { language });
            const jobId = handle.jobId;

            outputChannel.appendLine(
              `[${new Date().toLocaleTimeString()}] Job submitted: ${jobId}`
            );
            jobsTree.addJob(jobId, language);

            // Poll
            progress.report({ message: `Job ${jobId.substring(0, 8)}... polling` });

            while (true) {
              if (token.isCancellationRequested) {
                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Cancelling job ${jobId}...`
                );
                try {
                  await provider.cancelJob(jobId);
                } catch {
                  // best effort
                }
                jobsTree.updateJobStatus(jobId, "cancelled");
                statusBar.reset();
                vscode.window.showInformationMessage("Simulation cancelled.");
                return;
              }

              const status = await provider.getJobStatus(jobId);
              jobsTree.updateJobStatus(jobId, status.status);

              if (status.progress !== undefined) {
                progress.report({
                  message: `${status.status} (${status.progress}%)`,
                });
              } else {
                progress.report({ message: status.status });
              }

              if (status.status === "completed") {
                const result = await provider.getJobResult(jobId);
                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Job ${jobId} completed`
                );
                outputChannel.appendLine(
                  `Results: ${JSON.stringify(result.counts, null, 2)}`
                );
                outputChannel.appendLine(`Shots: ${result.shots}`);
                if (result.metadata) {
                  outputChannel.appendLine(
                    `Metadata: ${JSON.stringify(result.metadata, null, 2)}`
                  );
                }
                outputChannel.show(true);
                statusBar.completed();
                vscode.window.showInformationMessage(
                  `Simulation completed! (${result.shots} shots)`
                );
                return;
              }

              if (status.status === "failed") {
                const errMsg = status.error || "Unknown error";
                outputChannel.appendLine(
                  `[${new Date().toLocaleTimeString()}] Job ${jobId} failed: ${errMsg}`
                );
                statusBar.failed();
                vscode.window.showErrorMessage(
                  `Simulation failed: ${errMsg}`
                );
                return;
              }

              if (status.status === "cancelled") {
                statusBar.reset();
                return;
              }

              // Wait before next poll
              await new Promise<void>((resolve) => {
                const timer = setTimeout(resolve, POLL_INTERVAL_MS);
                token.onCancellationRequested(() => {
                  clearTimeout(timer);
                  resolve();
                });
              });
            }
          } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            outputChannel.appendLine(
              `[${new Date().toLocaleTimeString()}] Error: ${msg}`
            );
            statusBar.failed();
            vscode.window.showErrorMessage(`Simulation error: ${msg}`);
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}
