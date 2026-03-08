// Minimal vscode API mock for testing

export const workspace = {
  getConfiguration: jest.fn(() => ({
    get: jest.fn((key: string, defaultValue?: any) => defaultValue),
  })),
};

export const Uri = {
  joinPath: jest.fn((...args: any[]) => ({ fsPath: args.join('/') })),
  file: jest.fn((p: string) => ({ fsPath: p })),
};

export const TreeItem = class {
  label: string;
  collapsibleState: number;
  constructor(label: string, collapsibleState?: number) {
    this.label = label;
    this.collapsibleState = collapsibleState ?? 0;
  }
};

export const TreeItemCollapsibleState = {
  None: 0,
  Collapsed: 1,
  Expanded: 2,
};

export const ThemeIcon = class {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
};

export const EventEmitter = class {
  event = jest.fn();
  fire = jest.fn();
  dispose = jest.fn();
};

export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
  showWarningMessage: jest.fn(),
};

export const commands = {
  registerCommand: jest.fn(),
  executeCommand: jest.fn(),
};
