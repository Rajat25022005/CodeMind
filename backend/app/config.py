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
        env_file=("../.env", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Neo4j ──
    neo4j_uri: str = "bolt://localhost:7687"
    neo4j_user: str = "neo4j"
    neo4j_password: str  # Required — must be set in .env or environment

    # ── Qdrant ──
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333

    # ── Ollama ──
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = ""
    ollama_embed_model: str = "nomic-embed-text"

    # ── Cloud LLM fallback (optional) ──
    openai_api_key: str = ""
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.1-flash-lite-preview"

    # ── Security ──
    secret_key: str = "change-me-in-production"

    # ── Application ──
    debug: bool = False
    log_level: str = "INFO"
    embed_dimension: int = 768
    collection_name: str = "codemind_chunks"

    # ── CORS ──
    allowed_origins: str = "http://localhost:5173,http://localhost:3000"


@lru_cache
def get_settings() -> Settings:
    """Return cached singleton settings instance."""
    return Settings()
