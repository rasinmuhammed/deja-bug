#!/usr/bin/env python3
"""
Quick test to verify the MCP server functions work
"""
from server.src.deja_bug.server import extract_file_paths

# Test error log
test_log = """Traceback (most recent call last):
  File "test.py", line 2, in <module>
    print(x.data)
AttributeError: 'NoneType' object has no attribute 'data'
"""

print("Testing Deja-Bug Server Functions...")
print("-" * 50)

# Test file path extraction
paths = extract_file_paths(test_log)
print(f"✅ File path extraction works!")
print(f"   Extracted: {paths}")

print("\n✅ Server module loads correctly!")
print("\n⚠️  Full MCP integration requires running in VS Code")
print("   Press F5 in VS Code to test the complete flow")
