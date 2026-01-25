"""
Ollama client for LLM-powered bug analysis and embeddings
"""
import json
import aiohttp
from typing import Dict, Any, List, Optional


class OllamaClient:
    """Client for interacting with local Ollama server"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "qwen2.5-coder:3b"  # Lightweight model for M1 8GB
        self.embed_model = "nomic-embed-text"
        
    async def summarize_bug(
        self,
        error_log: str,
        git_diff: str,
        time_to_fix: int
    ) -> Dict[str, Any]:
        """
        Generate structured bug summary using LLM.
        
        Returns:
            dict with keys: root_cause, fix_explanation, learning, tags
        """
        from .prompts import build_analysis_prompt
        
        prompt = build_analysis_prompt(error_log, git_diff, time_to_fix)
        
        response = await self._generate(prompt)
        
        # Parse JSON response
        try:
            summary = json.loads(response)
            return summary
        except json.JSONDecodeError:
            # Fallback if model doesn't return valid JSON
            return {
                "root_cause": "LLM analysis failed to parse",
                "fix_explanation": response[:200],
                "learning": "Review error log manually",
                "tags": ["parsing-error"]
            }
    
    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embeddings for semantic search.
        
        Returns:
            768-dimensional vector
        """
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/embeddings",
                json={
                    "model": self.embed_model,
                    "prompt": text[:1000]  # Truncate long texts
                }
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("embedding", [])
                else:
                    raise Exception(f"Embedding failed: {resp.status}")
    
    async def _generate(self, prompt: str) -> str:
        """
        Call Ollama generate API.
        
        Returns:
            Generated text response
        """
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Lower for more focused responses
                        "num_predict": 500   # Limit token generation
                    }
                }
            ) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data.get("response", "")
                else:
                    error_text = await resp.text()
                    raise Exception(f"LLM generation failed: {error_text}")
    
    async def health_check(self) -> bool:
        """Check if Ollama server is running"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/api/tags") as resp:
                    return resp.status == 200
        except Exception:
            return False
