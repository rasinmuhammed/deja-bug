# Changelog

All notable changes to Deja-Bug will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.1.0] - 2026-01-25

### 🎉 Initial Release

#### Added
- **Smart Capture System**
  - Automatic error detection in terminal (Python, JavaScript, TypeScript)
  - Time-based filtering: only captures bugs that took >2 minutes to fix
  - Manual capture command (`Cmd+Shift+D`) to force-save any bug
  - Four capture modes: `off`, `manual`, `smart`, `everything`

- **MCP Integration**
  - Model Context Protocol (MCP) for extension-server communication
  - FastMCP server with JSON-RPC 2.0 over stdio
  - Proper initialization handshake and response handling

- **Terminal Monitoring**
  - Circular buffer (200 lines) for efficient context capture
  - Pattern-based error detection with regex
  - Terminal lifecycle tracking (open/close/switch)

- **Git Integration**
  - Capture current commit SHA
  - Git diff detection for modified files
  - File path extraction from stack traces

- **Incident Tracking**
  - Unique incident IDs with timestamps
  - Active incident state management
  - Confidence scoring based on file overlap
  - Resolution time tracking

#### Technical
- TypeScript extension with esbuild bundling
- Python MCP server with FastMCP framework
- VS Code API integration (proposed API: terminalDataWriteEvent)
- Comprehensive error pattern matching

### Configuration Options
- `deja-bug.captureMode`: Control capture behavior
- `deja-bug.minResolutionTime`: Minimum time threshold (default: 120s)
- `deja-bug.confidenceThreshold`: Minimum confidence for auto-capture (default: 0.5)
- `deja-bug.bufferSize`: Terminal buffer size (default: 200 lines)

---

## [Unreleased]

### Planned for Phase 3 (LLM Integration)
- Ollama integration with qwen2.5-coder:7b
- AI-powered bug summarization
- LanceDB vector storage
- Semantic search with nomic-embed-text embeddings
- Markdown report generation

### Planned for Phase 4 (UI)
- Webview timeline visualization
- Search interface
- Bug pattern analysis
- Statistics dashboard
