"""
Reasoning Agent

LangGraph-powered multi-hop question answering.
Takes retrieved context and performs multi-step reasoning
to produce evidence-backed answers with full citations.
Supports both synchronous and streaming modes.
"""

from __future__ import annotations

import json
import logging
from typing import AsyncIterator, Any

from langgraph.graph import StateGraph, END

from app.core.llm import LLMClient
from app.codebase.schemas import QueryResponse, Citation, TraceStep, StreamChunk

logger = logging.getLogger(__name__)

# System prompt for the reasoning agent
REASONING_SYSTEM = """You are CodeMind, an AI codebase memory engine. You answer questions about code evolution, architectural decisions, and engineering history.

Given the context chunks below, produce a clear, evidence-backed answer. ALWAYS cite your sources using [Source: <id>] markers.

Rules:
1. Be specific — reference exact commits, PRs, files, and functions.
2. Explain the "why" not just the "what".
3. If the context doesn't contain enough information, say so honestly.
4. Format your answer with markdown for readability.
"""

CITATION_EXTRACTION_PROMPT = """From the answer below, extract all citations. Return a JSON array of objects with "badge" (short label like "PR #47" or "Commit 4f3a9c2") and "text" (the relevant quote or description).

Answer:
{answer}

Return ONLY valid JSON array like: [{"badge": "...", "text": "..."}, ...]"""


class ReasoningState(dict):
    """State for the LangGraph reasoning workflow."""
    pass


class ReasoningAgent:
    """Multi-hop QA agent using LangGraph + Ollama."""

    def __init__(self, llm: LLMClient) -> None:
        self.llm = llm
        self._graph = self._build_graph()

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph reasoning workflow."""
        workflow = StateGraph(dict)

        # Define nodes
        workflow.add_node("plan", self._plan_step)
        workflow.add_node("retrieve_context", self._retrieve_context_step)
        workflow.add_node("synthesize", self._synthesize_step)
        workflow.add_node("extract_citations", self._extract_citations_step)

        # Define edges
        workflow.set_entry_point("plan")
        workflow.add_edge("plan", "retrieve_context")
        workflow.add_edge("retrieve_context", "synthesize")
        workflow.add_edge("synthesize", "extract_citations")
        workflow.add_edge("extract_citations", END)

        return workflow.compile()

    async def _plan_step(self, state: dict) -> dict:
        """Plan the reasoning steps needed to answer the query."""
        query = state.get("query", "")
        prompt = (
            f"Given this question about a codebase, list 2-3 specific sub-questions "
            f"that need to be answered to fully respond. Keep each sub-question brief.\n\n"
            f"Question: {query}\n\nSub-questions (one per line):"
        )

        try:
            plan = await self.llm.generate(prompt)
            steps = [s.strip() for s in plan.strip().split("\n") if s.strip()]
        except Exception:
            steps = [query]

        state["plan"] = steps
        state["trace"] = [TraceStep(label="Planning", done=True, detail=f"{len(steps)} sub-questions")]
        return state

    async def _retrieve_context_step(self, state: dict) -> dict:
        """Organize the pre-retrieved context for synthesis."""
        context = state.get("context", [])
        # Context is already retrieved by the API layer before calling reason()
        state["formatted_context"] = self._format_context(context)
        state["trace"].append(
            TraceStep(label="Context assembly", done=True, detail=f"{len(context)} chunks")
        )
        return state

    async def _synthesize_step(self, state: dict) -> dict:
        """Synthesize the final answer from context and plan."""
        query = state.get("query", "")
        context = state.get("formatted_context", "")
        plan = state.get("plan", [])

        prompt = (
            f"Question: {query}\n\n"
            f"Reasoning plan:\n" + "\n".join(f"- {s}" for s in plan) + "\n\n"
            f"Context:\n{context}\n\n"
            f"Provide a comprehensive, evidence-backed answer. Cite sources using [Source: <id>] markers."
        )

        try:
            answer = await self.llm.generate(prompt, system_prompt=REASONING_SYSTEM)
        except Exception as e:
            answer = f"I encountered an error while reasoning: {e}"

        state["answer"] = answer
        state["trace"].append(
            TraceStep(label="Synthesis", done=True, detail=f"{len(answer)} chars")
        )
        return state

    async def _extract_citations_step(self, state: dict) -> dict:
        """Extract structured citations from the answer."""
        answer = state.get("answer", "")

        try:
            prompt = CITATION_EXTRACTION_PROMPT.format(answer=answer)
            raw = await self.llm.generate(prompt)
            citations_data = json.loads(raw.strip())
            citations = [
                Citation(badge=c.get("badge", ""), text=c.get("text", ""))
                for c in citations_data
                if c.get("badge")
            ]
        except Exception:
            citations = []

        state["citations"] = citations
        state["trace"].append(
            TraceStep(label="Citations", done=True, detail=f"{len(citations)} found")
        )
        return state

    def _format_context(self, context: list[dict]) -> str:
        """Format retrieved context chunks into a readable string."""
        parts = []
        for i, chunk in enumerate(context):
            source = chunk.get("source_file", chunk.get("id", f"chunk-{i}"))
            content = chunk.get("content", "")
            ctype = chunk.get("chunk_type", "")
            parts.append(f"[Source: {source}] ({ctype})\n{content}\n")
        return "\n---\n".join(parts)

    # ── Public Interface ──

    async def reason(self, query: str, context: list[dict]) -> QueryResponse:
        """
        Perform full multi-hop reasoning pipeline.
        Returns a structured QueryResponse with answer, citations, and trace.
        """
        initial_state = {
            "query": query,
            "context": context,
            "plan": [],
            "trace": [],
            "answer": "",
            "citations": [],
        }

        final_state = await self._graph.ainvoke(initial_state)

        return QueryResponse(
            answer=final_state.get("answer", ""),
            citations=final_state.get("citations", []),
            reasoning_trace=final_state.get("trace", []),
            hops=len(final_state.get("plan", [])),
        )

    async def stream_reason(
        self, query: str, context: list[dict]
    ) -> AsyncIterator[StreamChunk]:
        """
        Stream the reasoning process step-by-step.
        Yields StreamChunk objects for real-time UI updates.
        """
        # Step 1: Plan
        yield StreamChunk(type="trace_step", content="Planning reasoning steps...")

        plan_prompt = (
            f"Given this question about a codebase, list 2-3 specific sub-questions "
            f"that need to be answered. Keep each brief.\n\nQuestion: {query}"
        )
        try:
            plan_text = await self.llm.generate(plan_prompt)
            plan_steps = [s.strip() for s in plan_text.strip().split("\n") if s.strip()]
        except Exception:
            plan_steps = [query]

        yield StreamChunk(
            type="trace_step",
            content=f"Plan: {len(plan_steps)} sub-questions",
            metadata={"steps": plan_steps},
        )

        # Step 2: Retrieve context
        yield StreamChunk(
            type="trace_step",
            content=f"Assembling context from {len(context)} chunks...",
        )

        formatted_context = self._format_context(context)

        # Step 3: Stream synthesis
        yield StreamChunk(type="trace_step", content="Synthesizing answer...")

        synthesis_prompt = (
            f"Question: {query}\n\n"
            f"Context:\n{formatted_context}\n\n"
            f"Provide a comprehensive, evidence-backed answer."
        )

        try:
            async for token in self.llm.stream_generate(
                synthesis_prompt, system_prompt=REASONING_SYSTEM
            ):
                yield StreamChunk(type="token", content=token)
        except Exception as e:
            yield StreamChunk(type="error", content=str(e))
            return

        yield StreamChunk(type="trace_step", content="Answer complete")

        # Step 4: Done
        yield StreamChunk(type="done", content="", metadata={"hops": len(plan_steps)})
