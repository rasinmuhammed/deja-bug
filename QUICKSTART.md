# Quick Start Guide

## First Time Setup

### 1. Install Prerequisites
```bash
# Node.js 20+ and pnpm
node --version  # Should be 20+
pnpm --version  # Install with: npm install -g pnpm

# Python 3.11+ and uv
python3 --version  # Should be 3.11+
uv --version       # Install with: curl -LsSf https://astral.sh/uv/install.sh | sh

# Ollama (for Phase 3)
ollama --version   # Install from: https://ollama.com
```

### 2. Install Dependencies
```bash
# Extension dependencies (already done if you see this)
cd extension
pnpm install

# Server dependencies (already done if you see this)
cd ../server
uv sync
```

### 3. Compile Extension
```bash
cd extension
pnpm run compile  # Or pnpm run watch for auto-recompile
```

---

## Running the Extension

### Method 1: VS Code Extension Development Host (Recommended)

1. **Open the project** in VS Code:
   ```bash
   code /Users/muhammedrasin/deja-bug
   ```

2. **Press `F5`** to launch the Extension Development Host

3. **Open a test project** in the new VS Code window

4. **Trigger an error** in the terminal and verify it's captured

### Method 2: Manual Testing

1. **Start the MCP server manually**:
   ```bash
   cd server
   uv run python -m deja_bug.server
   ```

2. **Test the server** with MCP Inspector:
   ```bash
   npx @modelcontextprotocol/inspector uv run python -m deja_bug.server
   ```
   This opens a web UI to interact with MCP tools.

---

## Testing the Capture Flow

### Test Scenario: Intentional Error

1. Create a test file `test.py`:
   ```python
   def broken():
       x = None
       print(x.data)  # This will fail
   
   broken()
   ```

2. Run it in VS Code terminal:
   ```bash
   python test.py
   ```

3. **Expected**: You should see error detected in the Deja-Bug Output channel

4. **Fix the code**:
   ```python
   def fixed():
       x = {"data": "hello"}
       print(x.get("data"))  # This works
   
   fixed()
   ```

5. Run again:
   ```bash
   python test.py
   ```

6. **Expected**: Success detected, resolution captured (if files match)

---

## Checking Output

### View Logs

- **Extension logs**: View → Output → Select "Deja-Bug Monitor"
- **Server logs**: View → Output → Select "Deja-Bug Server"

### Check Captured Bugs

```bash
ls -la .deja-bug/bugs/
# Currently empty (storage not implemented yet)
```

---

## Development Workflow

### Watch Mode (Auto-recompile)
```bash
cd extension
pnpm run watch
```

### Linting
```bash
cd extension
pnpm run lint

cd ../server
uv run ruff check src/
```

### Testing
```bash
cd extension
pnpm test

cd ../server
uv run pytest
```

---

## Current Status

✅ **Phase 1 Complete**: Silent Scribe
- Terminal output capture with circular buffer
- Error pattern detection (JS, Python, generic)
- Success detection
- MCP client-server communication (stdio)
- Basic heuristic matching (file paths)

⏳ **Phase 2**: Git diff integration (mostly done, needs testing)
⏳ **Phase 3**: LLM integration (Ollama + LanceDB) - Coming next
⏳ **Phase 4**: AI agent integration
⏳ **Phase 5**: Viral features (Wrapped)

---

## Troubleshooting

### Extension not activating
- Check: Command Palette → "Developer: Show Running Extensions"
- Look for "Deja-Bug" in the list

### MCP Server not responding
- Check "Deja-Bug Server" output channel
- Restart: Command Palette → "Deja-Bug: Restart MCP Server"

### Dependencies not found
```bash
cd extension && pnpm install
cd server && uv sync
```

---

## Next Steps

1. **Test the basic flow** with intentional errors
2. **Move to Phase 3**: Add Ollama LLM integration
3. **Implement storage**: Markdown files + LanceDB
4. **Build UI**: Webview for bug timeline

---

Happy debugging! 🐛✨
