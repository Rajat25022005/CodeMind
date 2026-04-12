"""
Ingestion Agent

Walks a git repository's full commit history via GitPython,
parses source files with Tree-sitter for AST-level entities,
and produces structured chunks for downstream graph construction
and vector embedding.
"""

from __future__ import annotations

import hashlib
import logging
import re
from datetime import datetime, timezone
from pathlib import Path

from git import Repo

from app.codebase.schemas import ChunkRecord

logger = logging.getLogger(__name__)

# Supported source file extensions for AST parsing
PARSEABLE_EXTENSIONS = frozenset({
    ".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs", ".c", ".cpp",
})

# Pre-compiled regex patterns for entity extraction (avoids recompilation per file)
_PY_ENTITY_RE = re.compile(r"^(class|def)\s+(\w+)\s*[\(:]", re.MULTILINE)
_JS_ENTITY_RE = re.compile(
    r"(?:export\s+)?(?:async\s+)?(?:function|class)\s+(\w+)", re.MULTILINE,
)
_JS_ARROW_RE = re.compile(
    r"(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\(", re.MULTILINE,
)

# Directories to skip during file traversal
_SKIP_DIRS = frozenset(("node_modules", "vendor", "__pycache__", "dist", "build"))


class IngestionAgent:
    """Processes a git repository into structured chunks for indexing."""

    __slots__ = ("repo_path", "repo")

    def __init__(self, repo_path: str) -> None:
        self.repo_path = repo_path
        self.repo: Repo | None = None

    async def ingest(self, max_commits: int | None = None, branch: str = "main") -> dict:
        """
        Run the full ingestion pipeline:
        1. Walk all commits and diffs via GitPython
        2. Parse source files for function/class definitions
        3. Chunk code + commit messages into structured records

        Returns dict with status and lists of chunks produced.
        """
        logger.info("Starting ingestion for %s (branch=%s)", self.repo_path, branch)

        self.repo_path = Path(self.repo_path).resolve()
        
        ALLOWED_BASE_DIRS = ["/repos", "/workspace", "/Users", "/tmp"]
        if not any(str(self.repo_path).startswith(base) for base in ALLOWED_BASE_DIRS):
            raise ValueError("Repository path not in allowed directories")

        if not self.repo_path.is_dir():
            raise FileNotFoundError(f"Repository not found at {self.repo_path}")
            
        self.repo = Repo(self.repo_path)
        if self.repo.bare:
            raise ValueError(f"Repository is bare: {self.repo_path}")

        chunks: list[ChunkRecord] = []

        # Step 1: Walk commits
        commit_chunks = await self._walk_commits(max_commits, branch)
        chunks.extend(commit_chunks)

        # Step 2: Parse current source files for entity extraction
        file_chunks = await self._parse_source_files()
        chunks.extend(file_chunks)

        logger.info(
            "Ingestion complete: %d commit chunks, %d file chunks",
            len(commit_chunks),
            len(file_chunks),
        )

        return {
            "status": "completed",
            "repo_path": self.repo_path,
            "total_chunks": len(chunks),
            "commit_chunks": len(commit_chunks),
            "file_chunks": len(file_chunks),
            "chunks": chunks,
        }

    async def _walk_commits(
        self, max_commits: int | None, branch: str
    ) -> list[ChunkRecord]:
        """Walk git history and produce commit + diff chunks."""
        chunks: list[ChunkRecord] = []

        try:
            commits = list(self.repo.iter_commits(branch, max_count=max_commits or 500))
        except Exception as e:
            logger.warning("Could not iterate branch '%s': %s — trying HEAD", branch, e)
            commits = list(self.repo.iter_commits("HEAD", max_count=max_commits or 500))

        for commit in commits:
            # Commit message chunk
            chunk_id = f"commit_{commit.hexsha[:7]}"
            ts = datetime.fromtimestamp(commit.committed_date, tz=timezone.utc).isoformat()

            chunks.append(ChunkRecord(
                id=chunk_id,
                content=f"Commit {commit.hexsha[:7]} by {commit.author.name}: {commit.message.strip()}",
                commit_hash=commit.hexsha,
                commit_message=commit.message.strip(),
                author=str(commit.author.name),
                timestamp=ts,
                chunk_type="commit_message",
                metadata={
                    "files_changed": len(commit.stats.files),
                    "insertions": commit.stats.total.get("insertions", 0),
                    "deletions": commit.stats.total.get("deletions", 0),
                },
            ))

            # Diff chunks (compare with parent)
            if commit.parents:
                parent = commit.parents[0]
                try:
                    diffs = parent.diff(commit, create_patch=True)
                    for diff in diffs:
                        if diff.diff:
                            diff_text = diff.diff.decode("utf-8", errors="replace")
                            # Skip very large diffs
                            if len(diff_text) > 5000:
                                diff_text = diff_text[:5000] + "\n... [truncated]"

                            file_path = diff.b_path or diff.a_path or "unknown"
                            diff_id = f"diff_{commit.hexsha[:7]}_{hashlib.sha256(file_path.encode()).hexdigest()[:6]}"

                            chunks.append(ChunkRecord(
                                id=diff_id,
                                content=diff_text,
                                source_file=file_path,
                                commit_hash=commit.hexsha,
                                commit_message=commit.message.strip(),
                                author=str(commit.author.name),
                                timestamp=ts,
                                chunk_type="diff",
                                metadata={"file_path": file_path},
                            ))
                except Exception as e:
                    logger.debug("Could not diff commit %s: %s", commit.hexsha[:7], e)

        return chunks

    async def _parse_source_files(self) -> list[ChunkRecord]:
        """Parse current source files for function/class definitions."""
        chunks: list[ChunkRecord] = []
        repo_root = Path(self.repo_path)

        for ext in PARSEABLE_EXTENSIONS:
            for file_path in repo_root.rglob(f"*{ext}"):
                # Skip hidden dirs, node_modules, vendor, etc.
                parts = file_path.parts
                if any(p.startswith(".") or p in _SKIP_DIRS for p in parts):
                    continue

                try:
                    content = file_path.read_text(encoding="utf-8", errors="replace")
                except Exception:
                    continue

                if not content.strip():
                    continue

                rel_path = str(file_path.relative_to(repo_root))

                # Extract functions and classes via simple pattern matching
                # (Tree-sitter integration can enhance this later)
                entities = self._extract_entities(content, ext)

                # File-level chunk
                file_id = f"file_{hashlib.sha256(rel_path.encode()).hexdigest()[:10]}"
                lines = content.count("\n") + 1

                chunks.append(ChunkRecord(
                    id=file_id,
                    content=content[:3000] if len(content) > 3000 else content,
                    source_file=rel_path,
                    chunk_type="code",
                    metadata={
                        "language": ext.lstrip("."),
                        "lines": lines,
                        "entities": entities,
                    },
                ))

                # Per-entity chunks for fine-grained search
                for entity in entities:
                    ent_name = entity["name"]
                    ent_id = f"entity_{hashlib.sha256(f'{rel_path}:{ent_name}'.encode()).hexdigest()[:10]}"
                    chunks.append(ChunkRecord(
                        id=ent_id,
                        content=entity.get("body", entity["name"]),
                        source_file=rel_path,
                        chunk_type="code",
                        metadata={
                            "entity_name": entity["name"],
                            "entity_type": entity["type"],
                            "language": ext.lstrip("."),
                            "line": entity.get("line", 0),
                        },
                    ))

        return chunks

    @staticmethod
    def _extract_entities(content: str, ext: str) -> list[dict]:
        """
        Extract function/class definitions from source code.
        Uses pre-compiled regex patterns as a baseline.
        For production, replace with Tree-sitter AST parsing.
        """
        entities: list[dict] = []

        if ext == ".py":
            # Python functions and classes
            for match in _PY_ENTITY_RE.finditer(content):
                kind = "class" if match.group(1) == "class" else "function"
                name = match.group(2)
                line_num = content[:match.start()].count("\n") + 1
                # Extract body (up to next definition or 50 lines)
                body_start = match.start()
                body_lines = content[body_start:].split("\n")[:50]
                body = "\n".join(body_lines)
                entities.append({
                    "name": name, "type": kind, "line": line_num, "body": body,
                })

        elif ext in (".js", ".ts", ".jsx", ".tsx"):
            # JavaScript/TypeScript functions and classes
            for match in _JS_ENTITY_RE.finditer(content):
                name = match.group(1)
                line_num = content[:match.start()].count("\n") + 1
                entities.append({
                    "name": name, "type": "function", "line": line_num,
                })

            # Arrow functions assigned to const
            for match in _JS_ARROW_RE.finditer(content):
                name = match.group(1)
                line_num = content[:match.start()].count("\n") + 1
                entities.append({
                    "name": name, "type": "function", "line": line_num,
                })

        return entities
