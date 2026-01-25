# 🧪 Deja-Bug Testing Guide: Smart Capture in Action

This guide walks you through testing the **smart capture** features step-by-step.

---

## Prerequisites

✅ Extension compiled (confirm you see `⚡ Done in 17ms` from previous compile)  
✅ VS Code open in the `/Users/muhammedrasin/deja-bug` directory  
✅ Python 3 installed

---

## Test 1: Smart Capture (Time-Based Filtering)

This test demonstrates that **quick fixes are ignored**, but **real debugging** is captured.

### Step 1: Launch Extension

1. **Press `F5`** in VS Code
2. **Wait for the Extension Development Host** window to open
3. **Look for notification**: "Deja-Bug is ready to capture your debugging sessions!"

> **Tip**: If you don't see the notification, check **View → Output → "Deja-Bug Monitor"**

### Step 2: Create Test File

In the **Extension Development Host** window terminal:

```bash
cat > quick_test.py << 'EOF'
# This is intentionally broken
x = None
print(x.data)
EOF
```

###Step 3: Trigger Error (Start Timer)

```bash
python3 quick_test.py
```

**Expected Output**:
```
AttributeError: 'NoneType' object has no attribute 'data'
```

**Check "Deja-Bug Monitor" output**:
- You should see: `Error detected: Python runtime error`
- And: `Incident inc-1-... reported. Monitoring for resolution...`

⏱️ **Timer started!** The extension is now tracking how long it takes you to fix this.

### Step 4: Fix QUICKLY (< 2 minutes)

**Immediately** fix the file:

```bash
cat > quick_test.py << 'EOF'
# Fixed!
x = {"data": "Hello"}
print(x.get("data"))
EOF
```

And run it:

```bash
python3 quick_test.py
```

**Expected Output**: `Hello`

**Check "Deja-Bug Monitor"**:
```
[timestamp] Success detected after error - checking for resolution
[timestamp] ⏭️  Quick fix (Xs < 120s threshold). Not capturing.
```

✅ **SUCCESS**: The bug was **NOT** captured because it was fixed too quickly (< 2 min threshold).

This filters out trivial syntax errors!

---

## Test 2: Smart Capture (Real Debugging)

Now let's simulate a bug that takes time to debug.

### Step 1: Create a New Test File

```bash
cat > slow_test.py << 'EOF'
# A more subtle bug
def calculate(numbers):
    total = 0
    for num in numbers:
        total = total / num  # BUG: Should be +, not /
    return total

result = calculate([1, 2, 3, 4])
print(f"Result: {result}")
EOF
```

### Step 2: Trigger Error

```bash
python3 slow_test.py
```

**Expected**: 
```
ZeroDivisionError: division by zero
```

Wait - oops! We created a different error. Let me fix the scenario:

```bash
cat > slow_test.py << 'EOF'
# A logic bug that requires debugging
def calculate_average(numbers):
    total = sum(numbers)
    count = len(numbers)
    return total / count  # What if numbers is empty?

result = calculate_average([])
print(f"Average: {result}")
EOF
```

```bash
python3 slow_test.py
```

**Expected**:
```
ZeroDivisionError: division by zero
```

**Check Monitor**: Incident reported.

### Step 3: Wait 2+ Minutes ⏱️

**DO NOT FIX YET!**

Pretend you're debugging. You could:
- Read the code
- Add print statements (but don't run yet)
- Check Stack Overflow
- Think about the logic

**⏱️ Wait at least 2 minutes and 10 seconds**

### Step 4: Fix After 2+ Minutes

After waiting, fix the code:

```bash
cat > slow_test.py << 'EOF'
# Fixed with proper error handling
def calculate_average(numbers):
    if not numbers:
        return 0
    total = sum(numbers)
    count = len(numbers)
    return total / count

result = calculate_average([])
print(f"Average: {result}")
EOF
```

```bash
python3 slow_test.py
```

**Expected Output**: `Average: 0`

**Check "Deja-Bug Monitor"**:
```
[timestamp] Success detected after error - checking for resolution
[timestamp] ✓ Bug captured! Confidence: 100%, Time to fix: 132s
```

You should also see a **notification**:
```
🐛 Bug fixed and captured! (100% confidence, 132s to fix)
```

✅ **SUCCESS**: Bug captured because resolution time > 120 seconds!

---

## Test 3: Manual Capture (Override Time Filter)

Sometimes you fix a bug quickly but want to save it anyway.

### Step 1: Create Quick Error

```bash
cat > manual_test.py << 'EOF'
import json
data = json.loads('{"broken}')  # Intentional syntax error
EOF
```

```bash
python3 manual_test.py
```

**Expected**: `JSONDecodeError`

**Check Monitor**: Incident reported.

### Step 2: Fix It Quickly

```bash
cat > manual_test.py << 'EOF'
import json
data = json.loads('{"fixed": true}')
print(data)
EOF
```

**DON'T RUN IT YET!**

### Step 3: Use Manual Capture

**Before running the fixed code:**

1. **Press `Cmd+Shift+P`** (Command Palette)
2. Type: `Deja-Bug: Capture This Bug`
3. **OR** use keybinding: **`Cmd+Shift+D`** (with terminal focused)

Now run:
```bash
python3 manual_test.py
```

**Expected**:
- Monitor shows: `📝 Manual capture triggered...`
- Notification: `✅ Bug manually captured! ID: bug-...`

✅ **SUCCESS**: Even though you fixed it quickly, manual capture saved it!

---

## Test 4: Capture Modes

Test the different capture modes.

### Mode: OFF

1. **Open Settings**: `Cmd+,`
2. **Search**: `deja-bug.captureMode`
3. **Set to**: `off`

Now trigger an error → fix it. **Nothing** should be captured.

### Mode: MANUAL

1. **Set `captureMode` to**: `manual`
2. Trigger error → fix it
3. **Auto-capture won't work**, only manual capture command will save bugs

### Mode: EVERYTHING

1. **Set `captureMode` to**: `everything`
2. Trigger error → fix it **immediately**
3. **Bug will be captured** even if < 120 seconds

This is useful for testing or if you want to capture everything.

### Mode: SMART (Default)

1. **Set back to**: `smart`
2. This uses the time-based filter (2-minute threshold)

---

## Checking Captured Bugs

Currently, bugs are logged but not saved to files (Phase 3 feature).

To see captured bugs:

1. **Open Output**: `View → Output`
2. **Select**: "Deja-Bug Server"
3. Look for lines like:
   ```
   [MCP] ✅ Bug captured! ID: bug-inc-1-...
   ```

---

## Troubleshooting

### Extension Not Activating
- **Check**: `Cmd+Shift+P` → "Developer: Show Running Extensions"
- Look for "Deja-Bug"

### Server Not Starting
- **Check**: Output → "Deja-Bug Server"
- You should see: `[MCP] 🚀 Deja-Bug MCP server starting...`
- **Fix**: `Cmd+Shift+P` → "Deja-Bug: Restart MCP Server"

### No Errors Detected
- **Confirm** you're in the **Extension Development Host** window (not the original VS Code window)
- **Check** error patterns in `error-patterns.ts` include your error type

### Manual Capture Not Working
- **Trigger an error first** (an active incident must exist)
- **Check** Output → "Deja-Bug Monitor"  for the incident ID

---

## Configuration Tweaks

**Adjust minimum time threshold**:

1. **Settings** (`Cmd+,`)
2. **Search**: `deja-bug.minResolutionTime`
3. **Try**: `30` (30 seconds instead of 120)
4. Now test - bugs fixed in 30-120s will be filtered, but >30s will be captured

**Adjust confidence threshold**:

1. **Search**: `deja-bug.confidenceThreshold`
2. **Default**: `0.5` (50% file overlap)
3. **Lower** (e.g., `0.3`) to capture more bugs
4. **Higher** (e.g., `0.8`) to be more selective

---

## Summary

| Mode | Quick Fixes (<2 min) | Slow Fixes (>2 min) | Manual Capture |
|------|---------------------|-------------------|----------------|
| **off** | ❌ Not captured | ❌ Not captured | ❌ Disabled |
| **manual** | ❌ Not captured | ❌ Not captured | ✅ Works |
| **smart** | ❌ Filtered out | ✅ Auto-captured | ✅ Override |
| **everything** | ✅ Captured | ✅ Captured | ✅ Works |

---

## What's Next?

After testing, you're ready for **Phase 3**: LLM Integration

This will add:
- Ollama summarization of bugs
- LanceDB vector storage
- Semantic search ("Did you mean?")
- Markdown file generation

---

**Questions?** Check Output panels or restart the extension with `F5` again.

Happy bug hunting! 🐛✨
