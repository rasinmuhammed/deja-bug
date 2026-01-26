"""
Pattern Detection System
Analyzes debugging history to find patterns and generate insights
"""
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict
from typing import Any
import json

def register_pattern_tools(mcp, vector_store, ollama_client, log):
    """Register pattern detection tools"""
    
    @mcp.tool()
    def detect_patterns(days: int = 7) -> dict[str, Any]:
        """Detect recurring patterns in recent debugging history
        
        Args:
            days: Number of days to analyze (default: 7)
            
        Returns:
            Dictionary with detected patterns and insights
        """
        try:
            log(f"🔍 Detecting patterns in last {days} days...")
            
            bugs_dir = Path.home() / ".deja-bug/bugs"
            if not bugs_dir.exists():
                return {
                    "status": "no_data",
                    "patterns": [],
                    "insights": []
                }
            
            # Get recent bugs
            cutoff_time = datetime.now() - timedelta(days=days)
            recent_bugs = []
            
            for md_file in bugs_dir.glob("bug-*.md"):
                mtime = datetime.fromtimestamp(md_file.stat().st_mtime)
                if mtime >= cutoff_time:
                    content = md_file.read_text()
                    bug_data = parse_bug_markdown(content, md_file.stem)
                    if bug_data:
                        recent_bugs.append(bug_data)
            
            if not recent_bugs:
                return {
                    "status": "no_recent_bugs",
                    "patterns": [],
                    "insights": []
                }
            
            # Pattern 1: Repeated error types
            error_counts = defaultdict(int)
            error_bugs = defaultdict(list)
            for bug in recent_bugs:
                for tag in bug.get('tags', []):
                    error_counts[tag] += 1
                    error_bugs[tag].append(bug)
            
            repeated_errors = []
            for error_type, count in error_counts.items():
                if count >= 3:  # Threshold: 3+ occurrences
                    repeated_errors.append({
                        "type": error_type,
                        "count": count,
                        "severity": "high" if count >= 5 else "medium",
                        "examples": [b['bug_id'] for b in error_bugs[error_type][:3]]
                    })
            
            # Pattern 2: File hotspots
            file_counts = defaultdict(int)
            for bug in recent_bugs:
                for file in bug.get('files', []):
                    file_counts[file] += 1
            
            file_hotspots = [
                {"file": file, "count": count}
                for file, count in file_counts.items()
                if count >= 2
            ]
            
            # Pattern 3: Time patterns
            hour_counts = defaultdict(int)
            for bug in recent_bugs:
                hour = bug.get('timestamp', datetime.now()).hour
                hour_counts[hour] += 1
            
            time_clusters = []
            for hour, count in hour_counts.items():
                if count >= 2:
                    time_clusters.append({
                        "hour": hour,
                        "count": count,
                        "period": get_time_period(hour)
                    })
            
            # Pattern 4: Improvement trends
            fix_times = [bug.get('time_to_fix', 0) for bug in recent_bugs]
            avg_time = sum(fix_times) / len(fix_times) if fix_times else 0
            
            # Sort by time and check if getting faster
            recent_bugs_sorted = sorted(recent_bugs, key=lambda b: b.get('timestamp', datetime.now()))
            first_half = recent_bugs_sorted[:len(recent_bugs_sorted)//2]
            second_half = recent_bugs_sorted[len(recent_bugs_sorted)//2:]
            
            first_avg = sum(b.get('time_to_fix', 0) for b in first_half) / len(first_half) if first_half else 0
            second_avg = sum(b.get('time_to_fix', 0) for b in second_half) / len(second_half) if second_half else 0
            
            improvement = 0
            if first_avg > 0:
                improvement = ((first_avg - second_avg) / first_avg) * 100
            
            # Generate insights
            insights = generate_insights(
                repeated_errors, 
                file_hotspots, 
                time_clusters,
                improvement,
                len(recent_bugs)
            )
            
            log(f"✅ Found {len(repeated_errors)} repeated patterns, {len(insights)} insights")
            
            return {
                "status": "success",
                "period_days": days,
                "total_bugs": len(recent_bugs),
                "patterns": {
                    "repeated_errors": repeated_errors,
                    "file_hotspots": file_hotspots,
                    "time_clusters": time_clusters,
                    "improvement_trend": {
                        "percentage": round(improvement, 1),
                        "direction": "improving" if improvement > 0 else "stable" if improvement == 0 else "declining",
                        "avg_time_seconds": round(avg_time, 0)
                    }
                },
                "insights": insights
            }
            
        except Exception as e:
            log(f"❌ Error detecting patterns: {e}")
            return {
                "status": "error",
                "error": str(e),
                "patterns": [],
                "insights": []
            }
    
    
    @mcp.tool()
    def generate_personalized_insights() -> dict[str, Any]:
        """Generate personalized insights using LLM based on all debugging history
        
        Returns:
            Personalized tips, common mistakes, and learning progress
        """
        try:
            log("🧠 Generating personalized insights with LLM...")
            
            # Get all bugs
            bugs_dir = Path.home() / ".deja-bug/bugs"
            if not bugs_dir.exists():
                return {
                    "status": "no_data",
                    "insights": []
                }
            
            all_bugs = []
            for md_file in sorted(bugs_dir.glob("bug-*.md")):
                content = md_file.read_text()
                bug_data = parse_bug_markdown(content, md_file.stem)
                if bug_data:
                    all_bugs.append(bug_data)
            
            if len(all_bugs) < 5:
                return {
                    "status": "insufficient_data",
                    "message": "Need at least 5 bugs to generate insights",
                    "current_count": len(all_bugs)
                }
            
            # Summarize bugs for LLM
            bug_summary = summarize_bugs_for_llm(all_bugs)
            
            # Generate insights with LLM
            prompt = f"""Analyze this developer's debugging history and provide personalized insights.

Bug History ({len(all_bugs)} bugs):
{bug_summary}

Provide insights in JSON format:
{{
  "common_mistakes": ["mistake 1", "mistake 2", "mistake 3"],
  "prevention_tips": ["tip 1", "tip 2", "tip 3"],
  "learning_progress": {{"insight": "description"}},
  "strengths": ["area 1", "area 2"]
}}

Focus on actionable, encouraging insights."""

            response = ollama_client.generate(prompt)
            
            # Parse response
            try:
                insights = json.loads(response)
            except:
                insights = {
                    "common_mistakes": ["Analysis in progress"],
                    "prevention_tips": ["Keep debugging!"],
                    "learning_progress": {"trend": "Improving"},
                    "strengths": ["Persistence"]
                }
            
            log("✅ Personalized insights generated")
            
            return {
                "status": "success",
                "total_bugs_analyzed": len(all_bugs),
                "insights": insights
            }
            
        except Exception as e:
            log(f"❌ Error generating insights: {e}")
            return {
                "status": "error",
                "error": str(e)
            }


def parse_bug_markdown(content: str, bug_id: str) -> dict[str, Any]:
    """Parse metadata from bug markdown file"""
    try:
        lines = content.split('\n')
        bug_data = {
            'bug_id': bug_id,
            'tags': [],
            'files': [],
            'time_to_fix': 0,
            'timestamp': datetime.now()
        }
        
        for i, line in enumerate(lines):
            if '**Time to Fix:**' in line:
                time_str = line.split('**Time to Fix:**')[1].strip()
                # Parse "X seconds" or "X minutes"
                if 'second' in time_str:
                    bug_data['time_to_fix'] = int(time_str.split()[0])
                elif 'minute' in time_str:
                    bug_data['time_to_fix'] = int(float(time_str.split()[0]) * 60)
            
            elif '**Date:**' in line:
                date_str = line.split('**Date:**')[1].strip()
                try:
                    bug_data['timestamp'] = datetime.fromisoformat(date_str)
                except:
                    pass
            
            elif 'Tags:' in line or '🏷️' in line:
                tags_str = line.split(':')[-1].strip()
                bug_data['tags'] = [t.strip() for t in tags_str.split(',') if t.strip()]
            
            elif '## 🔍 Root Cause' in line:
                # Get root cause text
                for j in range(i + 1, min(i + 10, len(lines))):
                    if lines[j].strip() and not lines[j].startswith('#'):
                        bug_data['root_cause'] = lines[j].strip()
                        break
        
        return bug_data
    except:
        return None


def get_time_period(hour: int) -> str:
    """Get human-readable time period"""
    if 0 <= hour < 6:
        return "late night"
    elif 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 18:
        return "afternoon"
    else:
        return "evening"


def generate_insights(repeated_errors, file_hotspots, time_clusters, improvement, total_bugs):
    """Generate human-readable insights"""
    insights = []
    
    # Repeated errors insight
    if repeated_errors:
        top_error = max(repeated_errors, key=lambda x: x['count'])
        insights.append({
            "type": "repeated_error",
            "severity": "high",
            "title": f"You've had {top_error['count']} {top_error['type']} errors",
            "message": f"This is your most common error type. Consider adding preventive checks.",
            "action": "Review past fixes for this pattern"
        })
    
    # File hotspots insight
    if file_hotspots:
        top_file = max(file_hotspots, key=lambda x: x['count'])
        insights.append({
            "type": "file_hotspot",
            "severity": "medium",
            "title": f"File keeps breaking: {Path(top_file['file']).name}",
            "message": f"This file has caused {top_file['count']} bugs. Might need refactoring.",
            "action": "Consider adding tests or splitting logic"
        })
    
    # Time pattern insight
    if time_clusters:
        top_time = max(time_clusters, key=lambda x: x['count'])
        insights.append({
            "type": "time_pattern",
            "severity": "low",
            "title": f"Most bugs happen in the {top_time['period']}",
            "message": f"You've had {top_time['count']} bugs around {top_time['hour']}:00",
            "action": "Consider taking breaks or pair programming at this time"
        })
    
    # Improvement insight
    if improvement > 10:
        insights.append({
            "type": "improvement",
            "severity": "positive",
            "title": f"You're getting {improvement:.0}% faster! 🎉",
            "message": "Your debugging speed is improving over time",
            "action": "Keep up the great work!"
        })
    
    # Milestone insights
    if total_bugs >= 10 and total_bugs < 20:
        insights.append({
            "type": "milestone",
            "severity": "positive",
            "title": "Building momentum!",
            "message": f"You've captured {total_bugs} bugs. Your knowledge base is growing.",
            "action": "Try using search to find similar past bugs"
        })
    
    return insights


def summarize_bugs_for_llm(bugs: list) -> str:
    """Create concise summary for LLM analysis"""
    summary_parts = []
    
    # Count error types
    tag_counts = defaultdict(int)
    for bug in bugs:
        for tag in bug.get('tags', []):
            tag_counts[tag] += 1
    
    summary_parts.append(f"Error types: {dict(tag_counts)}")
    
    # Average fix time
    avg_time = sum(b.get('time_to_fix', 0) for b in bugs) / len(bugs) if bugs else 0
    summary_parts.append(f"Avg fix time: {avg_time:.0f}s")
    
    # Recent root causes (sample)
    recent_causes = [b.get('root_cause', '') for b in bugs[-5:] if b.get('root_cause')]
    if recent_causes:
        summary_parts.append(f"Recent issues: {'; '.join(recent_causes[:3])}")
    
    return "\n".join(summary_parts)
