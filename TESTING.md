# 🧪 Deja-Bug End-to-End Testing Guide

## ✅ Prerequisites

**Before starting:**
1. Ollama is running: `ps aux | grep ollama` or `ollama serve` in background
2. Models installed:
   ```bash
   ollama list
   # Should show: qwen2.5-coder:3b and nomic-embed-text
   ```
3. Extension compiled: Check `extension/dist/extension.js` exists
4. In project directory: `cd /Users/muhammedrasin/deja-bug`

---

## 🚀 Test Flow

### Step 1: Launch Extension Development Host

**Start the extension:**
```bash
cd /Users/muhammedrasin/deja-bug
code .
# Then press F5 (or Run → Start Debugging)
```

**What happens:**
- New VS Code window opens with "[Extension Development Host]" title
- Wait ~5 seconds for initialization
- Notification: "Deja-Bug is ready!"

**Verify:**
- View → Output → Select "Deja-Bug Monitor"
- Should see: "Deja-Bug extension is now active!"
- Should see: "MCP client started successfully"

---

### Step 2: Create Test Bug

**In Extension Development Host, open terminal:**

**Create buggy file:**
```bash
cat > test_bug.py << 'EOF'
# This will cause AttributeError
user_data = None
print(f"User name: {user_data.get('name')}")
EOF
```

**Run it:**
```bash
python3 test_bug.py
```

**Expected error:**
```
Traceback (most recent call last):
  File "test_bug.py", line 3, in <module>
    print(f"User name: {user_data.get('name')}")
AttributeError: 'NoneType' object has no attribute 'get'
```

**Check Deja-Bug Monitor:**
- "🚨 Error detected: Python traceback"
- "📝 Incident inc-1-[timestamp] reported to MCP"

✅ **Success:** Error detected and incident created

---

### Step 3: Fix the Bug

**Apply the fix:**
```bash
cat > test_bug.py << 'EOF'
# Fixed version
user_data = {'name': 'Test User', 'email': 'test@example.com'}
print(f"User name: {user_data.get('name')}")
print(f"User email: {user_data.get('email')}")
EOF
```

**Run again:**
```bash
python3 test_bug.py
```

**Expected output:**
```
User name: Test User
User email: test@example.com
```

---

### Step 4: Trigger Capture

**Two options:**

#### Option A: Auto-capture (wait ~3 minutes)
- Extension waits to ensure it's a real fix
- Good for testing full automatic flow

#### Option B: Manual capture (instant) **← RECOMMENDED**
1. Focus the terminal window
2. Press **`Cmd+Shift+D`** (macOS) or **`Ctrl+Shift+D`** (Windows/Linux)
3. Notification: "✅ Bug captured! Analyzing with AI..."

✅ **Success:** Capture initiated

---

### Step 5: Watch AI Analysis

**Within 5-15 seconds:**

**Notifications appear:**
1. First: "✅ Bug captured! Analyzing with AI..."
2. Second: "🧠 The variable 'user_data' was initialized as None..." (AI summary)
   - Click "Search Similar" or "View Full Report"

**Check "Deja-Bug Server" output:**
```
🧠 Analyzing bug bug-inc-1-...
✅ Summary generated: The variable 'user_data' was initialized...
✅ Embedding generated (768-dim)
✅ Bug bug-inc-1-... stored in vector database
📝 Markdown report saved: /Users/muhammedrasin/.deja-bug/bugs/bug-inc-1-...md
```

✅ **Success:** AI analysis completes

---

### Step 6: Verify Generated Files

**Check markdown report:**
```bash
ls ~/.deja-bug/bugs/
cat ~/.deja-bug/bugs/bug-inc-*.md
```

**Report should contain:**
- 🔍 Root Cause Analysis
- 🛠️ What Fixed It
- 💡 Key Learning
- 📝 Code Changes (git diff if available)
- 🏷️ Tags (e.g., `null-pointer`, `python`)
- 📂 Files Modified

**Check vector database:**
```bash
ls ~/.deja-bug/vectors/
# Should see: bugs.lance/ directory
```

**Check timeline index:**
```bash
cat ~/.deja-bug/index.md
# Should have entry for your bug
```

✅ **Success:** All files generated correctly

---

## 📊 Success Criteria Checklist

Mark each as you complete:

- [ ] Extension loads without errors (F5)
- [ ] Error detected in terminal (Python AttributeError)
- [ ] Incident logged in "Deja-Bug Monitor"
- [ ] Fix applied successfully
- [ ] Capture triggered (Cmd+Shift+D)
- [ ] AI analysis notification appears
- [ ] Root cause shown in notification
- [ ] Markdown report exists in `~/.deja-bug/bugs/`
- [ ] Vector database has entry in `~/.deja-bug/vectors/`
- [ ] Semantic search finds the bug
- [ ] Timeline command opens webview
- [ ] No crashes or exceptions

---

## 🐛 Troubleshooting

### Extension won't start
**Error:** "Failed to start Deja-Bug"

**Fix:**
```bash
cd /Users/muhammedrasin/deja-bug/server
uv sync  # Reinstall dependencies
cd ../extension
pnpm run compile  # Recompile extension
```

Then restart (F5)

---

### No error detected
**Symptoms:** Terminal shows error but no Deja-Bug notification

**Fix:**
1. Check "Deja-Bug Monitor" output for errors
2. Verify error has traceback (not just exit code)
3. Try Python error (most reliable):
   ```python
   print(None.get('key'))  # AttributeError
   ```

---

### AI analysis doesn't trigger
**Symptoms:** Capture works but no AI notification

**Fix:**
1. Verify Ollama running:
   ```bash
   curl http://localhost:11434/api/tags
   ```
   If not running: `ollama serve`

2. Check "Deja-Bug Server" output for errors
3. Restart Extension Development Host (Cmd+R or Reload Window)

---

### "Cmd+Shift+D" doesn't work
**Symptoms:** Keyboard shortcut does nothing

**Fix:**
1. Make sure terminal is **focused** (click in terminal)
2. Try Command Palette instead:
   - `Cmd+Shift+P` → "Deja-Bug: Capture This Bug"
3. Check keybinding conflicts:
   - File → Preferences → Keyboard Shortcuts
   - Search: "deja-bug.manualCapture"

---

## 📈 Expected Performance

**On M1 MacBook Air (8GB RAM):**
- Extension startup: ~2-5 seconds
- Error detection: Instant
- Manual capture: Instant
- AI analysis: 5-15 seconds
- Markdown generation: <1 second
- Vector search: <1 second

**Memory usage:** ~300-400 MB total

---

## ✅ Test Complete!

**If all checks passed:**
- ✅ Deja-Bug is working end-to-end
- ✅ AI analysis is functioning
- ✅ Vector storage operational
- ✅ Ready for real-world use!

**Next steps:**
- Use naturally while coding
- Build up your bug knowledge base
- Review markdown reports weekly
- Share interesting patterns with team

**🎉 Happy Testing! You've built something amazing!**
