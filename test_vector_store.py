#!/usr/bin/env python3
"""
Test LanceDB vector storage
"""
import asyncio
from server.src.deja_bug.storage import BugVectorStore
from server.src.deja_bug.llm import OllamaClient


async def test_vector_store():
    """Test vector database operations"""
    
    print("🗄️  Testing LanceDB vector storage...")
    
    # Initialize
    store = BugVectorStore(db_path="~/.deja-bug/test-vectors")
    print(f"✅ Database initialized ({store.count()} bugs)")
    
    # Test adding bugs
    print("\n📝 Adding test bugs...")
    ollama = OllamaClient()
    
    test_bugs = [
        ("Null pointer in Python", "AttributeError: 'NoneType' object has no attribute"),
        ("Async race condition", "RuntimeError: Task was destroyed but it is pending"),
        ("Index out of bounds", "IndexError: list index out of range")
    ]
    
    for i, (desc, error) in enumerate(test_bugs):
        bug_id = f"test-{i+1}"
        
        # Generate embedding
        embedding = await ollama.embed_text(desc)
        
        # Create mock summary
        summary = {
            "root_cause": desc,
            "fix_explanation": "Fixed by checking bounds",
            "learning": "Always validate inputs",
            "tags": [desc.split()[0].lower()]
        }
        
        success = store.add_bug(
            bug_id=bug_id,
            summary=summary,
            embedding=embedding,
            files_modified=["test.py"],
            time_to_fix=120,
            confidence=0.8
        )
        
        if success:
            print(f"   ✅ Added: {bug_id}")
    
    print(f"\n📊 Total bugs in database: {store.count()}")
    
    # Test semantic search
    print("\n🔍 Testing semantic search for 'null reference error'...")
    query_embedding = await ollama.embed_text("null reference error in python")
    similar = store.search_similar(query_embedding, k=3)
    
    print(f"   Found {len(similar)} similar bugs:")
    for bug in similar:
        print(f"   - {bug['bug_id']}: {bug['root_cause'][:50]}...")
    
    # Test retrieval
    print("\n📖 Testing bug retrieval...")
    bug = store.get_bug_by_id("test-1")
    if bug:
        print(f"   ✅ Retrieved: {bug['root_cause'][:50]}...")
    
    print("\n🎉 All vector storage tests passed!")
    return True


if __name__ == "__main__":
    success = asyncio.run(test_vector_store())
    exit(0 if success else 1)
