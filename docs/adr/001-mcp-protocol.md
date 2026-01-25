# ADR 001: Model Context Protocol (MCP) for Extension-Server Communication

**Date**: 2026-01-24  
**Status**: Accepted  
**Deciders**: Architecture Team

---

## Context

The Deja-Bug system requires communication between a TypeScript VS Code extension (frontend) and a Python-based AI/storage backend. We need a protocol that is:

1. **Standardized**: Avoids bespoke API design
2. **Type-safe**: Clear contracts for tools and resources
3. **Future-proof**: Works across multiple IDEs and AI clients
4. **Local-first**: Supports stdio transport for privacy

---

## Decision

We will use the **Model Context Protocol (MCP)** as the communication layer between the VS Code extension and the Python backend.

**Implementation**:
- **Transport**: stdio (standard input/output via spawned child process)
- **Protocol**: JSON-RPC 2.0
- **Client**: VS Code extension (TypeScript)
- **Server**: Python with `fastmcp` framework

---

## Rationale

### Why MCP Over HTTP REST API?

| Aspect | MCP (stdio) | HTTP REST |
|--------|-------------|-----------|
| **Setup** | No port management | Requires port allocation, firewall rules |
| **Security** | Process-local, no network | Network exposure risk |
| **Type Safety** | Schema-enforced via protocol | Requires OpenAPI + codegen |
| **Latency** | ~10-50ms | ~50-200ms (network overhead) |
| **Standard** | Anthropic-backed, growing ecosystem | Custom implementation |

### Why MCP Over Direct Library Calls?

While we could import Python logic directly via `pyodide` or RPC libraries, MCP provides:
- **Decoupling**: Server can be developed/tested independently
- **Portability**: Can work with Cursor, Claude Desktop, or future IDEs
- **Process Isolation**: Python crashes don't affect VS Code
- **Ease of Testing**: MCP Inspector tool for manual testing

### Why `fastmcp` Over Custom JSON-RPC?

- **Developer Experience**: Decorator-based API (`@mcp.tool()`) reduces boilerplate
- **Official SDK**: Maintained by Anthropic, best practices built-in
- **Automatic Schema Generation**: Pydantic models → MCP tool schemas
- **Community**: Active development, examples, and support

---

## Consequences

### Positive
- **Interoperability**: The backend can plug into any MCP-compatible client (Cursor, Claude Desktop, future tools)
- **Simplified Architecture**: No need for HTTP server, CORS, authentication
- **Better DX**: MCP Inspector makes debugging protocol issues trivial
- **Portfolio Signal**: Demonstrates knowledge of cutting-edge AI infra standards

### Negative
- **Learning Curve**: MCP is newer than HTTP/REST; fewer resources
- **Debugging**: stdio-based debugging requires specific tools (MCP Inspector)
- **Single-Process Limitation**: stdio ties server to client process lifecycle

### Mitigation Strategies
- **Documentation**: Include MCP protocol examples in `/docs`
- **Logging**: Comprehensive logging to VS Code Output channel
- **Fallback**: If stdio fails, design allows future HTTP/SSE transport

---

## Alternatives Considered

### 1. HTTP REST API (Rejected)
**Pros**: Familiar, tooling-rich  
**Cons**: Requires port management, security overhead, slower  
**Why rejected**: Unnecessary complexity for local communication

### 2. Language Server Protocol (LSP) (Rejected)
**Pros**: VS Code has built-in LSP client  
**Cons**: Designed for code intelligence (hover, autocomplete), not general tools  
**Why rejected**: Mis-match of purpose; MCP is purpose-built for AI agents

### 3. Shared SQLite Database (Rejected)
**Pros**: Simple, no protocol needed  
**Cons**: No real-time communication, race conditions, limited functionality  
**Why rejected**: Cannot support interactive LLM pipeline

---

## Related Decisions
- [ADR 002: LanceDB for Vector Storage](./002-lancedb-choice.md)
- [ADR 003: Local LLM Strategy](./003-local-llm-strategy.md)

---

## References
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [fastmcp GitHub](https://github.com/jlowin/fastmcp)
- [MCP Inspector Tool](https://github.com/modelcontextprotocol/inspector)
