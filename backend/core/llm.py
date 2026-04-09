"""
LLM Client

Unified wrapper for Ollama (local) and optional cloud LLM providers
(OpenAI / Gemini). Handles prompt formatting, streaming responses,
and embedding generation.
"""


class LLMClient:
    """Ollama / OpenAI wrapper for CodeMind's LLM needs."""

    def __init__(self, provider: str = "ollama", model: str = "llama3", base_url: str = "http://localhost:11434"):
        self.provider = provider
        self.model = model
        self.base_url = base_url

    async def generate(self, prompt: str, stream: bool = False) -> str | None:
        """
        Generate a response from the LLM.

        Args:
            prompt: The input prompt.
            stream: If True, yields chunks via async generator.
        """
        # TODO: Implement Ollama generation
        # TODO: Implement OpenAI fallback
        return None

    async def embed(self, text: str) -> list[float]:
        """
        Generate an embedding vector for the given text.
        """
        # TODO: Implement embedding generation via Ollama
        return []
