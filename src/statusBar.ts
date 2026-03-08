import * as vscode from "vscode";

export class QSimStatusBar {
  private item: vscode.StatusBarItem;
  private resetTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.item = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      100
    );
    this.item.command = "qsim.runSimulation";
    this.reset();
    this.item.show();
  }

  reset() {
    this.clearTimer();
    this.item.text = "$(atom) QSim";
    this.item.tooltip = "QSim Studio — Click to run simulation";
    this.item.backgroundColor = undefined;
  }

  running() {
    this.clearTimer();
    this.item.text = "$(loading~spin) QSim: Running...";
    this.item.tooltip = "Simulation in progress";
    this.item.backgroundColor = undefined;
  }

  completed() {
    this.clearTimer();
    this.item.text = "$(check) QSim: Completed";
    this.item.tooltip = "Simulation completed";
    this.item.backgroundColor = undefined;
    this.resetTimer = setTimeout(() => this.reset(), 3000);
  }

  failed() {
    this.clearTimer();
    this.item.text = "$(error) QSim: Failed";
    this.item.tooltip = "Simulation failed";
    this.item.backgroundColor = new vscode.ThemeColor(
      "statusBarItem.errorBackground"
    );
    this.resetTimer = setTimeout(() => this.reset(), 5000);
  }

  dispose() {
    this.clearTimer();
    this.item.dispose();
  }

  private clearTimer() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }
}
