"""
LanceDB vector storage for semantic bug search
"""
import lancedb
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime


class BugVectorStore:
    """Vector database for storing and searching bug reports"""
    
    def __init__(self, db_path: str = "~/.deja-bug/vectors"):
        """
        Initialize LanceDB connection.
        
        Args:
            db_path: Path to LanceDB storage directory
        """
        self.db_path = Path(db_path).expanduser()
        self.db_path.mkdir(parents=True, exist_ok=True)
        
        self.db = lancedb.connect(str(self.db_path))
        self._init_table()
    
    def _init_table(self):
        """Initialize or load the bugs table"""
        try:
            self.table = self.db.open_table("bugs")
        except Exception:
            # Table doesn't exist yet - will be created on first add()
            self.table = None
    
    def add_bug(
        self,
        bug_id: str,
        summary: Dict[str, Any],
        embedding: List[float],
        files_modified: List[str],
        time_to_fix: int,
        confidence: float
    ) -> bool:
        """
        Store a bug with its vector embedding.
        
        Args:
            bug_id: Unique bug identifier
            summary: LLM-generated summary (root_cause, fix_explanation, etc.)
            embedding: 768-dim vector from nomic-embed-text
            files_modified: List of file paths that were changed
            time_to_fix: Time taken to fix in seconds
            confidence: Match confidence score (0-1)
            
        Returns:
            True if successful
        """
        try:
            data = [{
                "bug_id": bug_id,
                "timestamp": int(datetime.now().timestamp() * 1000),
                "error_type": summary.get("tags", ["unknown"])[0] if summary.get("tags") else "unknown",
                "root_cause": summary.get("root_cause", ""),
                "fix_explanation": summary.get("fix_explanation", ""),
                "learning": summary.get("learning", ""),
                "tags": summary.get("tags", []),
                "files_modified": files_modified,
                "time_to_fix": time_to_fix,
                "confidence": confidence,
                "embedding": embedding
            }]
            
            # Create table if it doesn't exist
            if self.table is None:
                self.table = self.db.create_table("bugs", data=data)
            else:
                self.table.add(data)
                
            return True
        except Exception as e:
            print(f"Error adding bug to vector store: {e}")
            return False
    
    def search_similar(
        self,
        query_embedding: List[float],
        k: int = 5,
        min_confidence: float = 0.3
    ) -> List[Dict[str, Any]]:
        """
        Find similar bugs using cosine similarity.
        
        Args:
            query_embedding: 768-dim query vector
            k: Number of results to return
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of similar bug records, ordered by similarity
        """
        try:
            # Vector search with LanceDB
            results = (
                self.table
                .search(query_embedding)
                .limit(k)
                .where(f"confidence >= {min_confidence}")
                .to_list()
            )
            
            return results
        except Exception as e:
            print(f"Error searching bugs: {e}")
            return []
    
    def get_all_bugs(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all bugs, ordered by timestamp (newest first).
        
        Args:
            limit: Optional limit on number of results
            
        Returns:
            List of bug records
        """
        try:
            query = self.table.search().to_pandas()
            query = query.sort_values("timestamp", ascending=False)
            
            if limit:
                query = query.head(limit)
                
            return query.to_dict('records')
        except Exception:
            return []
    
    def get_bug_by_id(self, bug_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific bug by ID"""
        try:
            results = self.table.search().where(f"bug_id = '{bug_id}'").to_list()
            return results[0] if results else None
        except Exception:
            return None
    
    def count(self) -> int:
        """Get total number of bugs stored"""
        if self.table is None:
            return 0
        try:
            return len(self.table.search().to_list())
        except Exception:
            return 0
