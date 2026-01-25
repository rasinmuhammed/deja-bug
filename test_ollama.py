#!/usr/bin/env python3
"""
Test script to verify Ollama LLM client works correctly
"""
import asyncio
from server.src.deja_bug.llm import OllamaClient


async def test_ollama():
    """Test Ollama client functionality"""
    client = OllamaClient()
    
    # Test 1: Health check
    print("🔍 Testing Ollama connection...")
    is_healthy = await client.health_check()
    if not is_healthy:
        print("❌ Ollama server not running!")
        print("   Run: ollama serve")
        return False
    print("✅ Ollama server is running")
    
    # Test 2: Bug summarization
    print("\n🧠 Testing bug summarization...")
    test_error = """Traceback (most recent call last):
  File "test.py", line 2, in <module>  
    print(x.data)
AttributeError: 'NoneType' object has no attribute 'data'
"""
    
    test_diff = """--- a/test.py
+++ b/test.py
-x = None
+x = {"data": "hello"}
"""
    
    try:
        summary = await client.summarize_bug(test_error, test_diff, 45)
        print("✅ Summary generated:")
        print(f"   Root cause: {summary.get('root_cause', 'N/A')[:80]}...")
        print(f"   Tags: {summary.get('tags', [])}")
    except Exception as e:
        print(f"❌ Summarization failed: {e}")
        return False
    
    # Test 3: Embeddings
    print("\n🔢 Testing text embeddings...")
    try:
        embedding = await client.embed_text("null pointer exception")
        print(f"✅ Embedding generated: {len(embedding)}-dimensional vector")
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return False
    
    print("\n🎉 All tests passed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_ollama())
    exit(0 if success else 1)
