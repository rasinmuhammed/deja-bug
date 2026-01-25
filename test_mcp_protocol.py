#!/usr/bin/env python3
"""
Direct test of the MCP server to verify it accepts the correct parameters.
This simulates what the VS Code extension sends.
"""
import json
import subprocess
import sys

def test_mcp_server():
    """Test the MCP server's report_incident tool"""
    
    # Start the server
    proc = subprocess.Popen(
        ['uv', 'run', 'python', '-m', 'deja_bug.server'],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd='server',
        text=True,
        bufsize=1
    )
    
    # Give server time to start
    import time
    time.sleep(2)
    
    # Send a test request - calling the tool directly as a JSON-RPC method
    request = {
        "jsonrpc": "2.0",
        "method": "report_incident",  # Tool name as method
        "params": {  # Parameters go directly here
            "error_log": "Traceback (most recent call last):\\n  File 'test.py', line 1\\nAttributeError",
            "timestamp": 1234567890,
            "terminal_id": "test-123",
            "git_hash": "abc123",
            "cwd": "/test"
        },
        "id": 1
    }
    
    print("Sending test request:")
    print(json.dumps(request, indent=2))
    
    # Send request
    proc.stdin.write(json.dumps(request) + '\\n')
    proc.stdin.flush()
    
    # Read response (with timeout)
    import select
    ready, _, _ = select.select([proc.stdout], [], [], 3)
    
    if ready:
        response_line = proc.stdout.readline()
        print("\\nReceived response:")
        try:
            response = json.loads(response_line)
            print(json.dumps(response, indent=2))
            
            if 'result' in response and 'incident_id' in response['result']:
                print("\\n✅ SUCCESS! Server accepted the request and returned incident_id")
                proc.terminate()
                return True
            elif 'error' in response:
                print(f"\\n❌ FAILED: {response['error']['message']}")
                proc.terminate()
                return False
        except json.JSONDecodeError:
            print(f"❌ Could not parse response: {response_line}")
            proc.terminate()
            return False
    else:
        print("❌ No response received within timeout")
        proc.terminate()
        return False

if __name__ == '__main__':
    success = test_mcp_server()
    sys.exit(0 if success else 1)
