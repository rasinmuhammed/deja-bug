"""
MCP tool definitions for LLM-powered bug analysis
"""
import asyncio
from typing import Dict, Any


def init_tools(mcp, ollama_client, vector_store, active_incidents, log):
    """Initialize and register LLM tools with MCP server"""
    
    @mcp.tool()
    async def analyze_bug(
        bug_id: str,
        error_log: str,
        git_diff: str = "",
        time_to_fix: int = 0,
        modified_files: list[str] = None
    ) -> Dict[str, Any]:
        """
        Analyze a captured bug using LLM and store in vector database.
        
        Args:
            bug_id: Unique bug identifier from report_resolution
            error_log: Full error log/stack trace
            git_diff: Git diff showing the fix
            time_to_fix: Time taken to fix in seconds
            modified_files: List of files that were modified
            
        Returns:
            Structured summary with root_cause, fix_explanation, learning, tags
        """
        if modified_files is None:
            modified_files = []
        
        try:
            log(f"🧠 Analyzing bug {bug_id} with LLM...")
            
            # 1. Get LLM summary
            summary = await ollama_client.summarize_bug(error_log, git_diff, time_to_fix)
            log(f"✅ Summary generated: {summary.get('root_cause', '')[:50]}...")
            
            # 2. Generate embedding for semantic search
            text_for_embedding = f"{summary['root_cause']} {summary['fix_explanation']}"
            embedding = await ollama_client.embed_text(text_for_embedding)
            log(f"✅ Embedding generated ({len(embedding)}-dim)")
            
            # 3. Store in vector database
            success = vector_store.add_bug(
                bug_id=bug_id,
                summary=summary,
                embedding=embedding,
                files_modified=modified_files,
                time_to_fix=time_to_fix,
                confidence=active_incidents.get(bug_id, {}).get("confidence", 0.0)
            )
            
            if success:
                log(f"✅ Bug {bug_id} stored in vector database")
            
            # 4. Generate markdown report
            from ..reports import generate_markdown_report, save_markdown_report, update_timeline_index
            
            markdown = generate_markdown_report(
                bug_id=bug_id,
                summary=summary,
                error_log=error_log,
                git_diff=git_diff,
                files_modified=modified_files,
                time_to_fix=time_to_fix,
                confidence=active_incidents.get(bug_id, {}).get("confidence", 0.0)
            )
            
            report_path = save_markdown_report(bug_id, markdown)
            update_timeline_index(bug_id, summary)
            log(f"📝 Markdown report saved: {report_path}")
            
            return {
                "status": "analyzed",
                "bug_id": bug_id,
                "summary": summary,
                "stored_in_db": success,
                "report_path": str(report_path)
            }
            
        except Exception as e:
            log(f"❌ Error analyzing bug: {e}")
            return {
                "status": "error",
                "error": str(e)
            }


    @mcp.tool()
    async def search_similar_bugs(
        query: str,
        k: int = 5
    ) -> Dict[str, Any]:
        """
        Search for similar bugs using semantic similarity.
        
        Args:
            query: Natural language query (e.g., "null pointer in Python")
            k: Number of results to return
            
        Returns:
            List of similar bugs with their summaries
        """
        try:
            log(f"🔍 Searching for bugs similar to: {query[:50]}...")
            
            # Generate embedding for query
            query_embedding = await ollama_client.embed_text(query)
            
            # Search vector database
            similar_bugs = vector_store.search_similar(query_embedding, k=k)
            
            log(f"✅ Found {len(similar_bugs)} similar bugs")
            
            return {
                "status": "success",
                "query": query,
                "results": similar_bugs,
                "count": len(similar_bugs)
            }
            
        except Exception as e:
            log(f"❌ Error searching bugs: {e}")
            return {
                "status": "error",
                "error": str(e),
                "results": []
            }
