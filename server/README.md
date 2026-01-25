# Deja-Bug Server

Python MCP server for the Deja-Bug VS Code extension.

## Quick Start

```bash
# Install dependencies
uv sync

# Run server (stdio mode)
uv run python -m deja_bug.server

# Run tests
uv run pytest
```

## Development

```bash
# Type checking
uv run mypy src/

# Linting
uv run ruff check src/
uv run ruff format src/
```
