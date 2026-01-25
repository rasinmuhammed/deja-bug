"""
MCP Server for Deja-Bug

Handles incident capture, resolution matching, and knowledge storage
"""
import sys
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from fastmcp import FastMCP
from pydantic import BaseModel, Field

# Initialize MCP server
mcp = FastMCP("deja-bug")

# In-memory storage for active incidents (will be replaced with proper storage)
active_incidents: Dict[str, Dict[str, Any]] = {}
incident_counter = 0


class IncidentCapture(BaseModel):
    """Data captured when an error is detected"""
    error_log: str = Field(description="Full terminal output containing the error")
    timestamp: int = Field(description="Unix timestamp in milliseconds")
    terminal_id: str = Field(description="Unique terminal identifier")
    git_hash: str = Field(default="unknown", description="Current git commit SHA")
    cwd: str = Field(default="", description="Working directory path")


class ResolutionCapture(BaseModel):
    """Data captured when a fix is detected"""
    incident_id: str = Field(description="ID from report_incident")
    timestamp: int = Field(description="Unix timestamp in milliseconds")
    git_diff: str = Field(default="", description="Git diff output")
    modified_files: list[str] = Field(default_factory=list, description="List of modified file paths")
    exit_code: int = Field(default=0, description="Process exit code (should be 0 for success)")
    time_to_fix_seconds: int = Field(default=0, description="Time taken to fix in seconds")
    manual_capture: bool = Field(default=False, description="Whether this was a manual capture")


@mcp.tool()
def report_incident(
    error_log: str,
    timestamp: int,
    terminal_id: str,
    git_hash: str = "unknown",
    cwd: str = ""
) -> dict[str, Any]:
    """
    Called when the extension detects an error signal in the terminal.
    
    Args:
        error_log: Full terminal output containing the error
        timestamp: Unix timestamp in milliseconds
        terminal_id: Unique terminal identifier
        git_hash: Current git commit SHA
        cwd: Working directory path
    """
    global incident_counter
    incident_counter += 1
    incident_id = f"inc-{incident_counter}-{timestamp}"
    
    # Extract file paths from stack trace (simple regex for now)
    stack_files = extract_file_paths(error_log)
    
    # Capture data model
    capture_data = {
        "error_log": error_log,
        "timestamp": timestamp,
        "terminal_id": terminal_id,
        "git_hash": git_hash,
        "cwd": cwd
    }
    
    # Store incident
    active_incidents[incident_id] = {
        "capture": capture_data,
        "stack_files": stack_files,
        "status": "open",
        "created_at": datetime.now().isoformat()
    }
    
    log(f"📝 Incident {incident_id} reported. Stack files: {stack_files}")
    
    return {
        "incident_id": incident_id,
        "stack_files": stack_files,
        "monitoring": True
    }


@mcp.tool()
def report_resolution(
    incident_id: str,
    timestamp: int,
    git_diff: str = "",
    modified_files: list[str] = None,
    exit_code: int = 0,
    time_to_fix_seconds: int = 0,
    manual_capture: bool = False
) -> dict[str, Any]:
    """
    Called when terminal shows success after a previous error.
    
    Args:
        incident_id: ID from report_incident
        timestamp: Unix timestamp in milliseconds
        git_diff: Git diff output
        modified_files: List of modified file paths
        exit_code: Process exit code (should be 0 for success)
        time_to_fix_seconds: Time taken to fix in seconds
        manual_capture: Whether this was a manual capture
    """
    if modified_files is None:
        modified_files = []
        
    incident = active_incidents.get(incident_id)
    
    if not incident:
        log(f"❌ No incident found for {incident_id}")
        return {"status": "no_match", "confidence": 0.0}
    
    # HEURISTIC: Do modified files overlap with stack trace files?
    stack_files = set(incident["stack_files"])
    modified_files_set = set(modified_files)
    
    # normalize paths (extract just filename for comparison)
    stack_filenames = {Path(f).name for f in stack_files}
    modified_filenames = {Path(f).name for f in modified_files_set}
    
    overlap = stack_filenames & modified_filenames
    confidence = len(overlap) / len(stack_filenames) if stack_filenames else 0.0
    
    log(f"🔍 Resolution match: {overlap} (confidence: {confidence:.2f})")
    
    # Capture if confidence is high OR if it's a manual capture
    if confidence > 0.5 or manual_capture:
        match_type = "Manual" if manual_capture else "High confidence"
        bug_id = f"bug-{incident_id}-{timestamp}"
        
        log(f"✅ Bug captured! ({match_type}) ID: {bug_id}, Confidence: {confidence:.2f}")
        
        # Capture data
        resolution_data = {
            "incident_id": incident_id,
            "timestamp": timestamp,
            "git_diff": git_diff,
            "modified_files": modified_files,
            "exit_code": exit_code,
            "time_to_fix_seconds": time_to_fix_seconds,
            "manual_capture": manual_capture
        }
        
        # Mark incident as resolved
        incident["status"] = "resolved"
        incident["resolution"] = resolution_data
        incident["bug_id"] = bug_id
        incident["confidence"] = confidence
        
        return {
            "status": "captured",
            "confidence": confidence,
            "bug_id": bug_id
        }
    else:
        log(f"⚠️  Low confidence match ({confidence:.2f}), not capturing")
        return {
            "status": "low_confidence",
            "confidence": confidence
        }


@mcp.tool()
def get_stats() -> dict[str, Any]:
    """
    Get statistics about captured bugs
    """
    total = len(active_incidents)
    resolved = sum(1 for inc in active_incidents.values() if inc["status"] == "resolved")
    
    return {
        "total_incidents": total,
        "resolved": resolved,
        "pending": total - resolved
    }


def extract_file_paths(error_log: str) -> list[str]:
    """Extract file paths from error log / stack trace"""
    import re
    paths = []
    
    # Match common stack trace patterns
    patterns = [
        r'at .* \(([^:)]+):\d+:\d+\)',           # JavaScript
        r'File "([^"]+)", line \d+',             # Python
        r'(?:^|\s)([a-zA-Z0-9_\-./]+\.[a-zA-Z]{2,5}):\d+'  # Generic
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, error_log)
        paths.extend(matches)
    
    return list(set(paths))  # Remove duplicates


def log(message: str) -> None:
    """Log to stderr (will appear in VS Code output channel)"""
    print(f"[MCP] {message}", file=sys.stderr)
    sys.stderr.flush()


def main():
    """Run the MCP server"""
    log("🚀 Deja-Bug MCP server starting...")
    log(f"Python version: {sys.version}")
    log("Listening on stdio for JSON-RPC requests")
    
    try:
        mcp.run()
    except KeyboardInterrupt:
        log("Server stopped by user")
    except Exception as e:
        log(f"Server error: {e}")
        raise


if __name__ == "__main__":
    main()
