# QSim Studio

VS Code Extension for quantum circuit development with [qsim-cluster](https://github.com/blocks0707/qsim-cluster) backend.

## Features

- 🔬 **Quantum Circuit Visualization** — Real-time circuit diagram rendering from Qiskit/QASM code
- 📊 **Result Visualization** — Histogram, Bloch sphere, state vector charts
- 🤖 **AI Assistant** — Quantum computing concepts, code generation, algorithm recommendations
- 📚 **Algorithm Registry** — Built-in quantum algorithm templates (Grover, Shor, VQE, etc.)
- ⚡ **Simulation Execution** — Submit jobs to qsim-cluster with one command
- 🔤 **Language Support** — OpenQASM syntax highlighting, Qiskit snippets

## Supported Languages

| Language | Features |
|----------|----------|
| Qiskit (Python) | Snippets, auto-completion |
| OpenQASM (.qasm) | Syntax highlighting, snippets |

## Quick Start

1. Install the extension
2. Configure backend: `Cmd+Shift+P` → `QSim: Configure Backend`
3. Write quantum code (`.py` or `.qasm`)
4. Run simulation: `Cmd+Shift+R`

## Commands

| Command | Shortcut | Description |
|---------|----------|-------------|
| QSim: Run Simulation | `Cmd+Shift+R` | Submit current code to qsim-cluster |
| QSim: Open Circuit Viewer | — | Visualize quantum circuit |
| QSim: Open Result Viewer | — | View simulation results |
| QSim: Open AI Assistant | — | Chat with AI for help |
| QSim: Browse Algorithms | — | Explore algorithm templates |
| QSim: Configure Backend | — | Set API URL and token |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `qsim.apiUrl` | `http://localhost:8080` | qsim-cluster API URL |
| `qsim.apiToken` | — | Bearer token |
| `qsim.aiProvider` | `openclaw` | AI backend (`openclaw` / `none`) |
| `qsim.openclawUrl` | `http://localhost:18789` | OpenClaw gateway URL |
| `qsim.autoVisualize` | `true` | Auto-open circuit viewer |

## Development

```bash
npm install
npm run compile
# Press F5 in VS Code to launch Extension Development Host
```

## Architecture

See [docs/DESIGN.md](docs/DESIGN.md) for detailed design document.

## License

MIT
