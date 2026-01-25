"""LLM module for bug analysis"""
from .ollama_client import OllamaClient
from .prompts import build_analysis_prompt

__all__ = ["OllamaClient", "build_analysis_prompt"]
