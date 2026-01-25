# Deja-Bug: Documentation Index

Welcome to the Deja-Bug documentation. This index will guide you to the right resources.

---

## 📚 Documentation Structure

```
docs/
├── setup.md                    # Developer setup guide
├── api-specification.md        # MCP protocol API contracts
└── adr/                        # Architecture Decision Records
    ├── 001-mcp-protocol.md     # Why we chose MCP
    ├── 002-lancedb-choice.md   # Why we chose LanceDB
    └── 003-local-llm-strategy.md # Why we use local LLMs
```

---

## 🚀 Quick Links

### For Users
- **[README](../README.md)** - Project overview and quick start
- **Installation Guide** - Coming soon

### For Contributors
- **[Setup Guide](./setup.md)** - How to set up development environment
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute
- **[API Specification](./api-specification.md)** - MCP protocol details

### For Architects
- **[Implementation Plan](https://github.com/yourusername/deja-bug/blob/main/docs/implementation_plan.md)** - System architecture and roadmap
- **[ADR 001: MCP Protocol](./adr/001-mcp-protocol.md)** - Communication architecture
- **[ADR 002: LanceDB](./adr/002-lancedb-choice.md)** - Vector database selection
- **[ADR 003: Local LLMs](./adr/003-local-llm-strategy.md)** - AI strategy

---

## 💡 Common Tasks

### I want to...

**...understand the architecture**
→ Read [Implementation Plan](https://github.com/yourusername/deja-bug/blob/main/docs/implementation_plan.md) and Architecture Diagrams

**...set up my development environment**
→ Follow [Setup Guide](./setup.md)

**...understand the MCP protocol**
→ Read [API Specification](./api-specification.md)

**...contribute a feature**
→ Check [Contributing Guidelines](../CONTRIBUTING.md) and [Task List](https://github.com/yourusername/deja-bug/blob/main/task.md)

**...understand technical decisions**
→ Browse [Architecture Decision Records](./adr/)

---

## 🔍 Key Concepts

### Incident
An error detected in the terminal (non-zero exit code, stack trace, etc.)

### Resolution
A successful terminal execution after a previous incident, with code changes

### Heuristic
The algorithm that matches incidents to resolutions based on file paths and timing

### MCP (Model Context Protocol)
The communication protocol between VS Code extension and Python server

### RAG (Retrieval Augmented Generation)
The pattern where we retrieve similar past bugs to provide context for AI

---

## 📖 Learning Path

### Beginner (Using Deja-Bug)
1. Read [README](../README.md)
2. Install and test basic features
3. Browse your `.deja-bug/` folder

### Intermediate (Contributing)
1. Complete [Setup Guide](./setup.md)
2. Read [ADR 001](./adr/001-mcp-protocol.md) to understand architecture
3. Pick a good-first-issue from GitHub

### Advanced (Architecture)
1. Study [Implementation Plan](https://github.com/yourusername/deja-bug/blob/main/docs/implementation_plan.md)
2. Review all ADRs in [adr/](./adr/)
3. Understand the MCP protocol via [API Spec](./api-specification.md)

---

## 🆘 Need Help?

- **Questions**: [GitHub Discussions](https://github.com/yourusername/deja-bug/discussions)
- **Bugs**: [GitHub Issues](https://github.com/yourusername/deja-bug/issues)
- **Security**: Email security@yourproject.com

---

Last updated: 2026-01-24
