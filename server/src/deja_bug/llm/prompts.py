"""
Prompt templates for bug analysis with Ollama LLM
"""

BUG_ANALYSIS_PROMPT = """You are an expert debugging assistant analyzing a developer's debugging session.

ERROR LOG:
{error_log}

CODE CHANGES (git diff):
{git_diff}

TIME TO FIX: {time_to_fix} seconds

Provide a structured analysis in JSON format with these exact keys:
{{
    "root_cause": "Brief 2-3 sentence explanation of what caused the error",
    "fix_explanation": "Clear explanation of what code changes fixed the issue and why",
    "learning": "Key takeaway or best practice to remember for the future",
    "tags": ["tag1", "tag2", "tag3"]
}}

Focus on being concise and actionable. The tags should be relevant keywords (e.g., "null-pointer", "async", "python").

Return ONLY the JSON object, no other text."""

SEARCH_QUERY_EXPANSION = """Given this bug description or error message:

"{query}"

Generate 2-3 alternative phrasings or related error patterns that a developer might search for.
Return as a JSON array of strings.

Example: ["original query", "rephrased variant 1", "related pattern"]"""


def build_analysis_prompt(error_log: str, git_diff: str, time_to_fix: int) -> str:
    """Build the bug analysis prompt with context"""
    return BUG_ANALYSIS_PROMPT.format(
        error_log=error_log[:2000],  # Truncate to avoid token limits
        git_diff=git_diff[:1500] if git_diff else "No git changes captured",
        time_to_fix=time_to_fix
    )


def build_search_expansion_prompt(query: str) -> str:
    """Build query expansion prompt for better semantic search"""
    return SEARCH_QUERY_EXPANSION.format(query=query[:500])
