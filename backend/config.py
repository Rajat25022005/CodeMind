"""
CodeMind Configuration

Centralized settings loaded from environment variables / .env file.
Uses pydantic-settings for validation and type coercion.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Neo4j ──
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str = "codemind_dev"

    # ── Qdrant ──
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # ── Ollama ──
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3"
    ollama_embed_model: str = "nomic-embed-text"

    # ── Cloud LLM fallback (optional) ──
    openai_api_key: str = ""
    gemini_api_key: str = ""

    # ── Application ──
    debug: bool = False
    embed_dimension: int = 768
    collection_name: str = "codemind_chunks"


@lru_cache
def get_settings() -> Settings:
    """Return cached singleton settings instance."""
    return Settings()
