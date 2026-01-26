# Quick Start: Testing Deja-Bug v1.0.0

**Time needed:** 30-45 minutes  
**Goal:** Verify all core features work before beta release

---

## 🚀 Setup (5 min)

1. **Ensure Ollama is running** (if you want AI analysis):
```bash
# Check if running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve

# Verify model available
ollama list  # Should show qwen2.5-coder:3b
```

2. **Launch Extension Development Host:**
```bash
cd /Users/muhammedrasin/deja-bug
code .
# Press F5
```

---

## ✅ Quick Test Workflow (25 min)

### Test 1: Welcome Screen (2 min)
- Fresh extension? Welcome should appear
- Click "Get Started"
- ✓ Never shows again

### Test 2: First Bug Capture (5 min)
```bash
# In Extension Development Host, create:
cd ~/Desktop
mkdir deja-bug-test && cd deja-bug-test

# Create test_bug.py
cat > test_bug.py << 'EOF'
def broken():
    return None.upper()

broken()
EOF

# Run it
python test_bug.py
# See error!

# Fix it
cat > test_bug.py << 'EOF'
def fixed():
    val = None
    return val.upper() if val else "default"

fixed()
print("Success!")
EOF

# Run again
python test_bug.py
```

**Wait for magic!**
- Progress notification appears
- AI analysis runs
- Rich notification shows
- Status bar updates to `🐛 1 bug`

**Check the report:**
```bash
ls ~/.deja-bug/bugs/
cat ~/.deja-bug/bugs/bug-inc-*.md
```

### Test 3: Timeline (3 min)
- Click bug icon in status bar
- Should see:
  - Stats dashboard
  - Your bug card
  - Search bar
- Click bug card → opens markdown

### Test 4: Manual Capture (3 min)
```bash
# Create another quick bug
cat > test2.py << 'EOF'
x = 10 / 0
EOF

python test2.py  # Error

# Fix
cat > test2.py << 'EOF'
x = 10 / 2
print(x)
EOF

python test2.py  # Success
```

**Press Cmd+Shift+D immediately**
- Force capture works
- Status bar shows `🐛 2 bugs`

### Test 5: Patterns (5 min)
- Capture 1-2 more bugs (any type)
- Wait 30 seconds
- Cmd+Shift+P → "Deja-Bug: Show Patterns"
- Should see insights if 3+ bugs

### Test 6: Achievements (3 min)
- First bug should have unlocked "First Capture"
- If you fixed bug in <60s, "Speed Demon" unlocks
- Check all: Click "View All" in notification

### Test 7: Search (2 min)
- Cmd+Shift+P → "Deja-Bug: Search Bugs"
- Type "None" or "division"
- Checks semantic search

### Test 8: Monthly Insights (2 min)
- Need 5+ bugs for this
- Cmd+Shift+P → "Deja-Bug: Generate Monthly Insights"
- Beautiful webview with personalized tips

---

## 🎯 Critical Checks

**Must Work:**
- [ ] Extension activates without errors
- [ ] Welcome screen shows on first run
- [ ] Auto-capture works
- [ ] Manual capture works (Cmd+Shift+D)
- [ ] AI analysis generates report
- [ ] Timeline shows real data
- [ ] Status bar updates correctly
- [ ] Rich notifications appear
- [ ] At least one achievement unlocks

**Should Work:**
- [ ] Patterns detected (with 3+ bugs)
- [ ] Search has results
- [ ] Monthly insights generate
- [ ] All commands accessible

---

## 🐛 If Something Breaks

### No AI Analysis
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check MCP server
# View > Output > Deja-Bug MCP
# Should see "server starting..."
```

### No Bug Captured
```bash
# Check terminal monitor
# View > Output > Extension Host
# Look for errors
```

### Commands Not Found
```bash
# Reload window
# Cmd+Shift+P → "Developer: Reload Window"
```

---

## ✅ Success Criteria

**Ready for Beta if:**
- ✅ All "Must Work" checks pass
- ✅ No crashes or errors
- ✅ UI looks good
- ✅ At least 3-5 bugs captured successfully

**Needs fixes if:**
- ❌ Extension doesn't activate
- ❌ AI analysis fails consistently
- ❌ UI has major bugs
- ❌ Data loss or corruption

---

## 📸 Take Screenshots

If all tests pass, capture:
1. Welcome screen
2. Rich notification after analysis
3. Timeline with data
4. Pattern insights panel
5. Achievement unlock
6. Monthly insights

**Use for marketing!** 🚀

---

**Ready to test? Let's go!** 🧪
