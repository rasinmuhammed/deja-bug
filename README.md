# 🐛 Deja-Bug

> **Your debugging sessions, transformed into wisdom.**

Stop losing knowledge every time you fix a bug. Deja-Bug captures your debugging journey, analyzes it with AI, and helps you become a better developer—**100% local, privacy-first.**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎯 Why Deja-Bug?

### The Problem

You're vibe coding at 2am. You hit an error. You fix it after 20 minutes of debugging. Two weeks later... **the exact same error**.

Every debugging session is lost knowledge. Your fixes disappear into git history. The patterns in your mistakes go unnoticed.

### The Vision

**What if every bug you fixed made you a better developer?**

What if you could:
- See "You've fixed this 3 times before"
- Get "You often forget null checks in API handlers"
- Track "You're debugging 33% faster this month! 🎉"

### The Solution

**Deja-Bug is your AI debugging journal.**

It automatically captures errors from your terminal, analyzes your fixes with local AI, and builds a searchable knowledge base of YOUR debugging patterns. Not Stack Overflow's. Not GPT's. **Yours.**

---

## ✨ Features That Matter

### 🎯 Automatic Error Detection  
**Zero setup. Zero configuration. Just works.**

Deja-Bug watches your terminal in the background. The moment an error appears, it starts listening. When you fix it, it captures:
- The full error log
- Your code changes (git diff)
- How long it took
- Which files you modified

No manual logging. No interrupting your flow.

### 🧠 AI-Powered Analysis
**Local AI that learns from YOU, not everyone else.**

After each fix, your preferred LLM analyzes:
- **Root cause:** What actually went wrong
- **Fix explanation:** Why your solution works  
- **Key learning:** The takeaway for next time
- **Auto-tags:** Categorizes for easy searching

**Works with:**
- 🎨 **Cursor AI** - Zero config, just install
- 🤖 **GitHub Copilot** - Auto-detected if installed
- 🦙 **Ollama** - Full local control

Deja-Bug automatically picks the best available option.

### 🔍 Pattern Detection (THE Killer Feature)
**"Hey, you keep making this mistake..."**

After a week of debugging, Deja-Bug notices:
- "You've had 5 null pointer errors this week"
- "This file keeps breaking"
- "You debug faster on Tuesdays 🤔"
- "You're improving! 33% faster than last month!"

Get proactive warnings: *"This looks familiar - you fixed this 3x before. Here's what worked..."*

### 🏆 Gamified Learning
**Because debugging should be celebrated.**

Unlock achievements:
- 🎉 **First Capture** - Your journey begins
- ⚡ **Speed Demon** - Fixed in <1 minute
- 🔥 **Week Warrior** - 7-day streak
- 🎯 **Bug Hunter** - 10 bugs captured
- 🏆 **Debugging Veteran** - 50 bugs captured

Track your growth. Share your wins.

### 📊 Beautiful Timeline  
**Visualize your debugging journey.**

See all your bugs in a gorgeous, searchable timeline:
- Stats dashboard (total bugs, avg time, streak)
- Search by error type, file, or keyword
- Click any bug to see the full analysis
- Export to GitHub Gist to share learnings

### 🔐 100% Private
**Your code never leaves your machine.**

Everything runs locally:
- AI analysis happens on your machine
- Vector database stored in `~/.deja-bug/`
- No cloud. No tracking. No telemetry.

Your bugs, your learnings, your privacy.

---

## 🚀 Quick Start

### Installation

coming soon

```bash
# Option 1: Install from VS Code Marketplace (Recommended)
1. Open VS Code
2. Go to Extensions (Cmd+Shift+X)
3. Search "Deja-Bug"
4. Click Install

# Option 2: Install from .vsix
code --install-extension deja-bug-1.0.0.vsix
```

### Prerequisites

**Using Cursor?** → You're done! Zero setup needed.

**Using VS Code with Copilot?** → You're done! Auto-detected.

**Want full local control?**
```bash
# Install Ollama
brew install ollama

# Pull a coding model
ollama pull qwen2.5-coder:3b  # 3B params, fast
# or
ollama pull qwen2.5-coder:7b  # 7B params, better quality
```

### Your First Bug Capture

1. **Write buggy code:**
   ```python
   def greet(name):
       return f"Hello, {name.upper()}"  # Will fail if name is None
   
   greet(None)  # BUG!
   ```

2. **Run it in the terminal:**
   ```bash
   python test.py
   # AttributeError: 'NoneType' object has no attribute 'upper'
   ```

3. **Fix it:**
   ```python
   def greet(name):
       if name is None:
           return "Hello, stranger!"
       return f"Hello, {name.upper()}"
   ```

4. **Run again:**
   ```bash
   python test.py  # Success!
   ```

5. **See the magic! 🪄**

Deja-Bug automatically:
- ✅ Detected the error
- ✅ Captured your fix
- ✅ Analyzed with AI
- ✅ Showed a beautiful notification
- ✅ Updated your status bar

**Check it out:**
- Status bar shows: `🐛 1 bug`
- Click it to see your timeline
- View the full AI analysis
- Unlock your first achievement! 🎉

---

## 💻 How To Use

### Automatic Capture (Recommended)
Just debug normally! Deja-Bug watches terminal output and automatically captures when it detects:
1. An error/exception
2. You run the command again
3. It succeeds (exit code 0)

### Manual Capture
Force capture any bug:
```
Cmd+Shift+D (Mac)
Ctrl+Shift+D (Windows/Linux)
```

### View Timeline
```
Cmd+Shift+P → "Deja-Bug: Show Timeline"
```
or click the bug icon in the status bar.

### See Patterns
```
Cmd+Shift+P → "Deja-Bug: Show Patterns"
```
View detected patterns and insights.

### Monthly Insights
```
Cmd+Shift+P → "Deja-Bug: Show Insights"
```
Get personalized debugging insights with AI.

### Search Past Bugs
```
Cmd+Shift+P → "Deja-Bug: Search Bugs"
```
Semantic search through your debugging history.

---

## 🎨 Screenshots

_Coming soon - beautiful timeline, pattern detection, achievements UI..._

---

## 🛠️ How It Works

### Architecture Overview

```
┌─────────────┐
│  VS Code    │
│  Extension  │
└──────┬──────┘
       │
       ├─► Terminal Monitor (captures errors)
       ├─► LLM Manager (Cursor/Copilot/Ollama)
       └─► MCP Server (Python)
              ├─> Vector DB (ChromaDB)
              ├─> Pattern Detection
              └─> Stats & Timeline
```

### What Gets Captured

For each bug:
- **Error log:** Full terminal output
- **Git diff:** Your code changes
- **Time to fix:** From error to resolution
- **Context:** Which files, timestamps, git hash
- **AI analysis:** Root cause, fix, learning, tags

### Where Data Lives

```
~/.deja-bug/
├── bugs/           # Markdown reports
│   ├── bug-inc-001.md
│   ├── bug-inc-002.md
│   └── ...
├── vector-db/      # Embeddings for search
└── stats/          # Debugging statistics
```

Everything is markdown - easy to read, grep, backup.

---

## 🎯 Use Cases

### 1. Vibe Coding Sessions
You're in the flow at 2am. Error happens. You fix it. Forget about it.

**With Deja-Bug:** Next week when it happens again, you get: *"You've seen this before! Here's what worked..."*

### 2. Learning New Languages
Picking up Rust? Making mistakes?

**With Deja-Bug:** After 50 bugs, you get insights like: *"You often forget to handle Result types"* → Personalized learning.

### 3. Team Knowledge Sharing
Junior picked up a bug you've fixed?

**With Deja-Bug:** Share the GitHub Gist link with full analysis, fix explanation, and learnings.

### 4. Interview Prep
"Tell me about a challenging bug you fixed..."

**With Deja-Bug:** Open your timeline, filter by "challenging" or language, show the analysis. Concrete examples ready.

### 5. Portfolio Building
Showcase your problem-solving skills.

**With Deja-Bug:** Export your debugging stats, achievement badges, pattern insights. Proof of growth.

---

## 🤝 Contributing

We believe great software is built by passionate communities.

### Ways to Contribute

1. **Found a bug?** → [Open an issue](https://github.com/yourusername/deja-bug/issues)
2. **Have an idea?** → [Start a discussion](https://github.com/yourusername/deja-bug/discussions)
3. **Want to code?** → Check [CONTRIBUTING.md](./CONTRIBUTING.md)
4. **Love Deja-Bug?** → Star the repo ⭐

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/deja-bug
cd deja-bug

# Install dependencies
cd extension && pnpm install
cd ../server && uv venv && source .venv/bin/activate && uv pip install -e .

# Open in VS Code
code .

# Press F5 to launch Extension Development Host
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for technical details.

---

## 📄 License

MIT License - See [LICENSE](./LICENSE)

**Built with ❤️ for developers who want to learn from every bug.**

---

## 🌟 Show Your Support

If Deja-Bug helps you become a better developer:

- ⭐ Star this repo
- 🐦 [Tweet about it](https://twitter.com/intent/tweet?text=Just%20found%20Deja-Bug%20-%20an%20AI%20debugging%20journal%20that%20learns%20from%20YOUR%20bugs!%20%F0%9F%90%9B)
- 📝 Write a blog post
- 🎥 Make a video
- 💬 Tell a friend

Every share helps more developers level up their debugging game!

---

## 💡 Philosophy

> **"The best debugger is the one who learns from every mistake."**

We believe:
1. **Privacy matters** - Your code stays on your machine
2. **Learning > Fixing** - Understanding why > quick fix
3. **Patterns > Solutions** - Preventing bugs > fixing them
4. **Progress > Perfection** - Track improvement over time
5. **Joy > Grind** - Debugging can be rewarding

Deja-Bug isn't just a tool. It's a companion on your journey to becoming a better developer.

---

**Happy Debugging! 🐛✨**

*Questions? Join our [Discord](https://discord.gg/deja-bug) or reach out on [Twitter](https://twitter.com/deja-bug)*
