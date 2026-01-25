# Developer Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js**: v20+ (LTS recommended)
- **pnpm**: v9+ (`npm install -g pnpm`)
- **Python**: 3.11+
- **uv**: Latest (`curl -LsSf https://astral.sh/uv/install.sh | sh`)
- **Ollama**: Latest ([ollama.com](https://ollama.com))
- **VS Code**: 1.85+ or Cursor IDE
- **Git**: 2.40+

---

## Quick Start (5 minutes)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/deja-bug.git
cd deja-bug
```

### 2. Set Up the Extension
```bash
cd extension
pnpm install
pnpm run compile
```

### 3. Set Up the MCP Server
```bash
cd ../server
uv sync  # Creates virtual environment and installs dependencies
```

### 4. Pull Required Ollama Models
```bash
ollama pull qwen2.5-coder:7b
ollama pull nomic-embed-text
```

### 5. Launch Extension in Development Mode
- Open `extension/` folder in VS Code
- Press `F5` to launch Extension Development Host
- Open a test project in the new window
- Open the terminal and run a command that fails

---

## Detailed Setup

### Extension Development

#### Project Structure
```
extension/
├── src/
│   ├── extension.ts          # Entry point (activate/deactivate)
│   ├── monitors/
│   ├── mcp/
│   └── ui/
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript config
└── esbuild.config.js         # Build configuration
```

#### Development Workflow

**1. Install Dependencies**
```bash
cd extension
pnpm install
```

**2. Compile TypeScript**
```bash
pnpm run compile       # One-time build
pnpm run watch         # Auto-recompile on changes
```

**3. Run Tests**
```bash
pnpm test              # Unit tests with Vitest
```

**4. Debug**
- Set breakpoints in VS Code
- Press `F5` to launch Extension Development Host
- Debugging console will show logs

**5. Package Extension**
```bash
pnpm run package       # Creates .vsix file
```

#### Key VS Code Extension Concepts

**Activation Events** (`package.json`):
```json
{
  "activationEvents": [
    "onStartupFinished"  // Load after VS Code starts
  ]
}
```

**Contribution Points**:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "deja-bug.showTimeline",
        "title": "Deja-Bug: Show Bug Timeline"
      }
    ],
    "configuration": {
      "title": "Deja-Bug",
      "properties": {
        "deja-bug.autoCapture": {
          "type": "boolean",
          "default": true,
          "description": "Automatically capture terminal errors"
        }
      }
    }
  }
}
```

---

### MCP Server Development

#### Project Structure
```
server/
├── pyproject.toml            # uv project config
├── src/
│   └── deja_bug/
│       ├── server.py         # Main fastmcp app
│       ├── heuristics/
│       ├── llm/
│       └── storage/
└── tests/
```

#### Development Workflow

**1. Initialize Project with uv**
```bash
cd server
uv sync  # Creates .venv and installs all dependencies
```

**2. Activate Virtual Environment**
```bash
source .venv/bin/activate  # On macOS/Linux
# or
.venv\Scripts\activate     # On Windows
```

**3. Run MCP Server Locally (for testing)**
```bash
uv run python -m deja_bug.server
```

This starts the MCP server in stdio mode. It will wait for JSON-RPC messages on stdin.

**4. Run Tests**
```bash
uv run pytest
uv run pytest -v          # Verbose output
uv run pytest -k "test_heuristic"  # Run specific test
```

**5. Type Checking**
```bash
uv run mypy src/
```

**6. Linting**
```bash
uv run ruff check src/
uv run ruff format src/   # Auto-format code
```

#### Testing MCP Server with Inspector

The MCP Inspector is a web-based tool to test your MCP server interactively:

```bash
npx @modelcontextprotocol/inspector uv run python -m deja_bug.server
```

This opens a web UI where you can:
- Call tools manually
- Inspect request/response payloads
- Debug protocol issues

---

### Ollama Setup

#### Installation
- **macOS**: `brew install ollama`
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`
- **Windows**: Download from [ollama.com](https://ollama.com/download)

#### Pull Required Models
```bash
# Code understanding LLM (7B parameters, ~4.7GB)
ollama pull qwen2.5-coder:7b

# Embedding model for semantic search (128-dim, ~274MB)
ollama pull nomic-embed-text
```

#### Verify Installation
```bash
ollama list  # Should show downloaded models
ollama run qwen2.5-coder:7b "Hello!"  # Test inference
```

#### Configure Ollama (Optional)
Edit `~/.ollama/config.json`:
```json
{
  "num_parallel": 2,      # Run 2 models concurrently
  "num_gpu": 1            # Use GPU acceleration
}
```

---

## Repository Initialization

### Create Project Structure in deja-bug/
```bash
cd /Users/muhammedrasin/deja-bug

# Create extension scaffold
mkdir -p extension/src/{monitors,mcp,ui,utils}

# Create server scaffold
mkdir -p server/src/deja_bug/{heuristics,llm,storage}
mkdir -p server/tests

# Create docs structure
mkdir -p docs/adr

# Create data storage directory (gitignored)
mkdir -p .deja-bug/{bugs,vector.db}
```

### Initialize Extension
```bash
cd extension
pnpm init

# package.json will be created
# Add VS Code extension fields manually or use:
pnpm add -D @types/vscode @types/node typescript esbuild vit vitest
```

**Minimal `package.json`**:
```json
{
  "name": "deja-bug",
  "displayName": "Deja-Bug",
  "description": "Agentic AI-powered debugging journal",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.85.0"
  },
  "main": "./dist/extension.js",
  "activationEvents": ["onStartupFinished"],
  "contributes": {},
  "scripts": {
    "compile": "esbuild src/extension.ts --bundle --outfile=dist/extension.js --external:vscode --format=cjs --platform=node",
    "watch": "npm run compile -- --watch",
    "test": "vitest"
  },
  "devDependencies": {
    "@types/node": "^20.11.5",
    "@types/vscode": "^1.85.0",
    "esbuild": "^0.20.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  }
}
```

### Initialize Python Project
```bash
cd ../server

# Create pyproject.toml
cat <<EOF > pyproject.toml
[project]
name = "deja-bug-server"
version = "0.1.0"
description = "MCP server for Deja-Bug VS Code extension"
requires-python = ">=3.11"
dependencies = [
    "fastmcp>=0.2.0",
    "pydantic>=2.6.0",
    "ollama>=0.1.6",
    "lancedb>=0.5.0",
    "gitpython>=3.1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "mypy>=1.8.0",
    "ruff>=0.2.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.mypy]
python_version = "3.11"
strict = true
EOF

# Initialize uv project
uv sync
```

---

## VS Code Configuration

### Workspace Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "extension/node_modules/typescript/lib",
  "python.defaultInterpreterPath": "server/.venv/bin/python",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff"
  }
}
```

### Recommended Extensions (`.vscode/extensions.json`)
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "charliermarsh.ruff",
    "ms-python.python"
  ]
}
```

### Launch Configuration (`.vscode/launch.json`)
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}/extension"
      ],
      "outFiles": [
        "${workspaceFolder}/extension/dist/**/*.js"
      ],
      "preLaunchTask": "npm: compile"
    },
    {
      "name": "Debug MCP Server",
      "type": "python",
      "request": "launch",
      "module": "deja_bug.server",
      "cwd": "${workspaceFolder}/server",
      "justMyCode": false
    }
  ]
}
```

---

## Troubleshooting

### Extension Not Activating
- **Check**: Open Command Palette (`Cmd+Shift+P`) → "Developer: Show Running Extensions"
- **Fix**: Ensure `activationEvents` in `package.json` is correct

### MCP Server Not Responding
- **Check**: Look at VS Code Output panel → "Deja-Bug Server" channel
- **Fix**: Restart server using "Deja-Bug: Restart Server" command

### Ollama Connection Errors
- **Check**: `ollama list` in terminal
- **Fix**: `ollama serve` to start Ollama daemon

### LanceDB Import Errors
- **Check**: Python version >= 3.11
- **Fix**: `uv add lancedb --upgrade`

---

## Next Steps

1. Read [`architecture.md`](./architecture.md) for system design
2. Review Architecture Decision Records in [`adr/`](./adr/)
3. Start with Phase 1 implementation (Silent Scribe)
4. Join our Discord for support: [link]

Happy debugging! 🐛✨
