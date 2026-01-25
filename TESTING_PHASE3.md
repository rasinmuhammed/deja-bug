# Phase 3 Testing Checklist

## Pre-Test Setup
- [ ] Ollama server running
- [ ] Models pulled (qwen2.5-coder:3b, nomic-embed-text)
- [ ] Extension compiled (25.3kb)
- [ ] Server dependencies installed

## Component Tests

### 1. Ollama LLM Client
- [ ] Health check passes
- [ ] Bug summarization returns JSON
- [ ] Embeddings generate 768-dim vectors
- [ ] Error handling works

### 2. LanceDB Vector Storage
- [ ] Add bug successfully
- [ ] Semantic search returns results
- [ ] Cosine similarity ranking correct
- [ ] Retrieval by ID works

### 3. MCP Tools
- [ ] `analyze_bug` callable
- [ ] Returns structured summary
- [ ] Stores in vector DB
- [ ] Markdown report generated

### 4. Extension Integration
- [ ] Error detection working
- [ ] Auto-triggers LLM analysis
- [ ] Shows AI summary notification
- [ ] Timeline command opens webview

### 5. End-to-End Flow
- [ ] Terminal error → detected
- [ ] Fix applied → captured
- [ ] LLM analyzes → summary generated
- [ ] Vector stores → searchable
- [ ] Markdown saved → viewable
- [ ] Timeline shows → entry visible

## Performance Metrics
- [ ] LLM analysis < 15 seconds
- [ ] Vector search < 1 second
- [ ] Extension startup < 5 seconds
- [ ] Memory usage < 500MB

## Edge Cases
- [ ] Ollama down → graceful degradation
- [ ] No git repo → handles cleanly
- [ ] Large error logs → truncated properly
- [ ] Multiple errors → sequential handling
