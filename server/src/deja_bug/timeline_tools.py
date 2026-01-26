"""
Additional MCP tools for timeline and stats
"""
from typing import Any
from datetime import datetime, timedelta
from pathlib import Path
import json

def register_timeline_tools(mcp, vector_store, log):
    """Register tools for timeline and statistics"""
    
    @mcp.tool()
    def get_all_bugs(
        limit: int = 50,
        search: str = "",
        tags: list[str] | None = None
    ) -> dict[str, Any]:
        """Get all captured bugs with optional filtering
        
        Args:
            limit: Maximum number of bugs to return
            search: Optional search query for filtering
            tags: Optional list of tags to filter by
            
        Returns:
            Dictionary with status, bugs list, and count
        """
        try:
            # Get bugs from vector store
            bugs_dir = Path.home() / ".deja-bug/bugs"
            if not bugs_dir.exists():
                return {"status": "success", "bugs": [], "count": 0}
            
            bugs = []
            for md_file in sorted(bugs_dir.glob("bug-*.md"), reverse=True):
                if len(bugs) >= limit:
                    break
                    
                try:
                    content = md_file.read_text()
                    
                    # Parse markdown for metadata
                    bug_data = {
                        "bug_id": md_file.stem,
                        "path": str(md_file),
                        "created": datetime.fromtimestamp(md_file.stat().st_mtime).isoformat()
                    }
                    
                    # Extract data from markdown
                    lines = content.split('\n')
                    for line in lines:
                        if line.startswith('**Date:**'):
                            bug_data['date'] = line.split('**Date:**')[1].strip()
                        elif line.startswith('**Time to Fix:**'):
                            time_str = line.split('**Time to Fix:**')[1].strip()
                            bug_data['time_to_fix'] = time_str
                        elif line.startswith('## 🔍 Root Cause'):
                            # Next non-empty line is root cause
                            idx = lines.index(line)
                            for i in range(idx + 1, len(lines)):
                                if lines[i].strip() and not lines[i].startswith('#'):
                                    bug_data['root_cause'] = lines[i].strip()
                                    break
                        elif '🏷️ Tags' in line or 'Tags:' in line:
                            # Extract tags
                            tags_line = line
                            bug_data['tags'] = [t.strip() for t in tags_line.split(':')[-1].split(',') if t.strip()]
                    
                    # Apply filters
                    if search and search.lower() not in content.lower():
                        continue
                    
                    if tags and not any(t in bug_data.get('tags', []) for t in tags):
                        continue
                    
                    bugs.append(bug_data)
                    
                except Exception as e:
                    log(f"Error parsing {md_file}: {e}")
                    continue
            
            return {
                "status": "success",
                "bugs": bugs,
                "count": len(bugs)
            }
            
        except Exception as e:
            log(f"Error getting bugs: {e}")
            return {"status": "error", "error": str(e), "bugs": [], "count": 0}
    
    
    @mcp.tool()
    def get_stats() -> dict[str, Any]:
        """Calculate debugging statistics
        
        Returns:
            Dictionary with various stats
        """
        try:
            bugs_dir = Path.home() / ".deja-bug/bugs"
            if not bugs_dir.exists():
                return {
                    "total_bugs": 0,
                    "avg_fix_time": "0s",
                    "streak": 0,
                    "top_error": "None",
                    "this_week": 0,
                    "this_month": 0
                }
            
            bugs = list(bugs_dir.glob("bug-*.md"))
            total = len(bugs)
            
            # Calculate fix times
            fix_times = []
            error_types = {}
            dates = []
            
            for md_file in bugs:
                try:
                    content = md_file.read_text()
                    
                    # Extract time to fix
                    for line in content.split('\n'):
                        if '**Time to Fix:**' in line:
                            time_str = line.split('**Time to Fix:**')[1].strip()
                            # Parse "X seconds" or "X minutes"
                            if 'second' in time_str:
                                seconds = int(time_str.split()[0])
                                fix_times.append(seconds)
                            elif 'minute' in time_str:
                                minutes = float(time_str.split()[0])
                                fix_times.append(int(minutes * 60))
                        
                        # Extract error type from tags
                        if 'Tags:' in line or '🏷️' in line:
                            tags = line.split(':')[-1].strip().split(',')
                            for tag in tags:
                                tag = tag.strip()
                                if tag:
                                    error_types[tag] = error_types.get(tag, 0) + 1
                    
                    # Get file date
                    mtime = md_file.stat().st_mtime
                    dates.append(datetime.fromtimestamp(mtime))
                    
                except Exception:
                    continue
            
            # Calculate average
            avg_seconds = sum(fix_times) / len(fix_times) if fix_times else 0
            if avg_seconds < 60:
                avg_fix_time = f"{int(avg_seconds)}s"
            else:
                avg_fix_time = f"{avg_seconds / 60:.1f}m"
            
            # Calculate streak
            if dates:
                dates.sort(reverse=True)
                streak = 1
                for i in range(len(dates) - 1):
                    diff = (dates[i] - dates[i + 1]).days
                    if diff <= 1:
                        streak += 1
                    else:
                        break
            else:
                streak = 0
            
            # Top error
            top_error = max(error_types.items(), key=lambda x: x[1])[0] if error_types else "None"
            
            # This week/month
            now = datetime.now()
            week_ago = now - timedelta(days=7)
            month_ago = now - timedelta(days=30)
            
            this_week = sum(1 for d in dates if d >= week_ago)
            this_month = sum(1 for d in dates if d >= month_ago)
            
            return {
                "total_bugs": total,
                "avg_fix_time": avg_fix_time,
                "streak": streak,
                "top_error": top_error,
                "this_week": this_week,
                "this_month": this_month,
                "by_type": error_types
            }
            
        except Exception as e:
            log(f"Error calculating stats: {e}")
            return {
                "total_bugs": 0,
                "avg_fix_time": "0s",
                "streak": 0,
                "top_error": "Error",
                "error": str(e)
            }
    
    
    @mcp.tool()
    def health_check() -> dict[str, str]:
        """Check if MCP server is healthy
        
        Returns:
            Status dictionary
        """
        return {"status": "ok", "server": "deja-bug"}
