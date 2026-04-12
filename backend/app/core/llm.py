"""
LLM Client

Unified wrapper for language model access.
Primary: Ollama (local). Fallback: OpenAI / Gemini (cloud).
Handles text generation, embedding, and streaming.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified LLM client — Ollama-first with optional cloud fallback."""

    __slots__ = ("_http", "_available", "_settings")

    def __init__(self) -> None:
        self._http: httpx.AsyncClient | None = None
        self._available: bool = False
        self._settings = get_settings()

    def _require_http(self) -> httpx.AsyncClient:
        """Return the HTTP client or raise if not initialised."""
        if self._http is None:
            raise RuntimeError("LLM client not initialised — call connect() first")
        return self._http

    async def connect(self) -> None:
        """Verify Ollama is reachable."""
        self._settings = get_settings()
        self._http = httpx.AsyncClient(
            timeout=120.0,
            limits=httpx.Limits(
                max_connections=50,
                max_keepalive_connections=10,
                keepalive_expiry=30,
            ),
        )
        try:
            resp = await self._http.get(f"{self._settings.ollama_base_url}/api/tags")
            resp.raise_for_status()
            models = [m["name"] for m in resp.json().get("models", [])]
            logger.info("Ollama available. Models: %s", models)
            self._available = True
        except Exception as e:
            logger.warning("Ollama not available: %s — will try cloud fallback", e)
            self._available = False

    async def close(self) -> None:
        """Close HTTP client."""
        if self._http:
            await self._http.aclose()
            self._http = None

    @property
    def available(self) -> bool:
        return self._available or bool(self._settings.openai_api_key) or bool(self._settings.gemini_api_key)

    # ── Text Generation ──

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str | None = None,
    ) -> str:
        """Generate a text completion. Tries Ollama first, then cloud fallback."""
        # Try Ollama
        if self._available:
            try:
                return await self._generate_ollama(
                    prompt, system_prompt, model or self._settings.ollama_model
                )
            except Exception as e:
                logger.warning("Ollama generation failed: %s", e)

        # Fallback: OpenAI
        if self._settings.openai_api_key:
            try:
                return await self._generate_openai(prompt, system_prompt)
            except Exception as e:
                logger.warning("OpenAI fallback failed: %s", e)

        # Fallback: Gemini
        if self._settings.gemini_api_key:
            try:
                return await self._generate_gemini(prompt, system_prompt)
            except Exception as e:
                logger.warning("Gemini fallback failed: %s", e)

        raise RuntimeError("No LLM backend available")

    async def _generate_ollama(
        self, prompt: str, system_prompt: str, model: str
    ) -> str:
        """Generate via Ollama REST API."""
        http = self._require_http()
        payload: dict = {
            "model": model,
            "prompt": prompt,
            "stream": False,
        }
        if system_prompt:
            payload["system"] = system_prompt

        resp = await http.post(
            f"{self._settings.ollama_base_url}/api/generate",
            json=payload,
        )
        resp.raise_for_status()
        return resp.json().get("response", "")

    async def _generate_openai(self, prompt: str, system_prompt: str) -> str:
        """Generate via OpenAI API."""
        http = self._require_http()
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        resp = await http.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {self._settings.openai_api_key}"},
            json={"model": "gpt-4o-mini", "messages": messages},
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]

    async def _generate_gemini(self, prompt: str, system_prompt: str) -> str:
        """Generate via Google Gemini API."""
        http = self._require_http()
        full_prompt = f"{system_prompt}\n\n{prompt}" if system_prompt else prompt

        resp = await http.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{self._settings.gemini_model}:generateContent",
            headers={"x-goog-api-key": self._settings.gemini_api_key},
            json={"contents": [{"parts": [{"text": full_prompt}]}]},
        )
        resp.raise_for_status()
        candidates = resp.json().get("candidates", [])
        if candidates:
            parts = candidates[0].get("content", {}).get("parts", [])
            return parts[0].get("text", "") if parts else ""
        return ""

    # ── Streaming ──

    async def stream_generate(
        self,
        prompt: str,
        system_prompt: str = "",
        model: str | None = None,
    ) -> AsyncIterator[str]:
        """Stream tokens from Ollama. Yields individual text chunks."""
        http = self._require_http()
        m = model or self._settings.ollama_model

        payload: dict = {"model": m, "prompt": prompt, "stream": True}
        if system_prompt:
            payload["system"] = system_prompt

        async with http.stream(
            "POST",
            f"{self._settings.ollama_base_url}/api/generate",
            json=payload,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.strip():
                    data = json.loads(line)
                    token = data.get("response", "")
                    if token:
                        yield token
                    if data.get("done"):
                        break

    # ── Embedding ──

    async def embed(self, text: str, model: str | None = None) -> list[float]:
        """Generate an embedding vector for the given text."""
        m = model or self._settings.ollama_embed_model

        if self._available:
            try:
                return await self._embed_ollama(text, m)
            except Exception as e:
                logger.warning("Ollama embedding failed: %s", e)

        if self._settings.openai_api_key:
            return await self._embed_openai(text)

        if self._settings.gemini_api_key:
            return await self._embed_gemini(text)

        raise RuntimeError("No embedding backend available")

    async def _embed_ollama(self, text: str, model: str) -> list[float]:
        """Embed via Ollama."""
        http = self._require_http()
        resp = await http.post(
            f"{self._settings.ollama_base_url}/api/embed",
            json={"model": model, "input": text},
        )
        resp.raise_for_status()
        data = resp.json()
        # Ollama returns {"embeddings": [[...]]} for /api/embed
        embeddings = data.get("embeddings", [])
        if embeddings:
            return embeddings[0]
        # Fallback for older Ollama versions using /api/embeddings
        return data.get("embedding", [])

    async def _embed_openai(self, text: str) -> list[float]:
        """Embed via OpenAI."""
        http = self._require_http()
        resp = await http.post(
            "https://api.openai.com/v1/embeddings",
            headers={"Authorization": f"Bearer {self._settings.openai_api_key}"},
            json={"model": "text-embedding-3-small", "input": text},
        )
        resp.raise_for_status()
        return resp.json()["data"][0]["embedding"]

    async def _embed_gemini(self, text: str) -> list[float]:
        """Embed via Google Gemini API."""
        http = self._require_http()
        resp = await http.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2-preview:embedContent",
            headers={"x-goog-api-key": self._settings.gemini_api_key},
            json={
                "model": "models/gemini-embedding-2-preview",
                "content": {"parts": [{"text": text}]}
            },
        )
        resp.raise_for_status()
        return resp.json()["embedding"]["values"]
