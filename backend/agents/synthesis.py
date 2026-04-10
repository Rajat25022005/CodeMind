"""
Synthesis Agent

Summary + onboarding narrative generator + drift detection.
Produces chronological stories of how code modules evolved,
tailored for onboarding new team members or generating summaries.
Also detects when current code diverges from documented intent.
"""

from __future__ import annotations

import logging

from core.graph_db import GraphDB
from core.llm import LLMClient
from models import (
    OnboardingStep,
    OnboardingResponse,
    DriftAlert,
    DriftSeverity,
    TimelineEvent,
)

logger = logging.getLogger(__name__)

SUMMARY_SYSTEM = """You are CodeMind, an AI codebase memory engine. Generate clear, chronological summaries of how code modules evolved. Focus on the 'why' behind changes — the decisions, bugs, and architectural shifts that shaped the code. Be specific with commit references and dates."""

ONBOARDING_SYSTEM = """You are CodeMind, helping a new team member understand a code module. Generate a chronological walkthrough starting from when the module was created, through each major change, explaining:
1. What changed and why
2. Key architectural decisions
3. Important edge cases and gotchas
Format each step as a story point with a date and clear description."""

DRIFT_SYSTEM = """You are CodeMind's drift detection engine. Compare the current state of code against its documented intent from commit messages, PR descriptions, and inline comments. Flag any cases where:
1. Behavior has diverged from what was originally documented (BEHAVIOR_DRIFT)
2. Intent from the original commit/PR is no longer reflected in code (MISSING_INTENT)
3. Constraints specified in discussions are violated (CONSTRAINT_VIOLATION)
Return a JSON array of drift alerts."""


class SynthesisAgent:
    """Generates summaries, onboarding narratives, and drift alerts from graph data."""

    def __init__(self, graph_db: GraphDB, llm: LLMClient) -> None:
        self.graph_db = graph_db
        self.llm = llm

    async def summarize(self, module_path: str) -> dict:
        """
        Generate a chronological evolution summary for a module:
        1. Retrieve full history from the temporal graph
        2. Order events chronologically
        3. Generate a narrative via LLM
        """
        logger.info("Generating summary for: %s", module_path)

        history = await self._get_module_history(module_path)
        if not history:
            return {
                "module": module_path,
                "summary": f"No history found for {module_path} in the knowledge graph.",
                "timeline": [],
            }

        context = self._format_history(history)
        prompt = (
            f"Generate a concise chronological summary of how '{module_path}' evolved.\n\n"
            f"History:\n{context}"
        )

        try:
            summary = await self.llm.generate(prompt, system_prompt=SUMMARY_SYSTEM)
        except Exception as e:
            summary = f"Could not generate summary: {e}"

        timeline_events = [
            TimelineEvent(
                id=f"tl-{i}",
                title=h.get("label", ""),
                description=h.get("message", ""),
                date=h.get("timestamp", ""),
                type="commit",
                hash=h.get("commit_id", ""),
            )
            for i, h in enumerate(history)
        ]

        return {
            "module": module_path,
            "summary": summary,
            "timeline": [e.model_dump() for e in timeline_events],
        }

    async def onboard(self, module_path: str) -> OnboardingResponse:
        """
        Generate an onboarding walkthrough:
        1. Identify key architectural decisions
        2. Build a guided story of how the module evolved
        3. Highlight important design rationale
        """
        logger.info("Generating onboarding for: %s", module_path)

        history = await self._get_module_history(module_path)
        if not history:
            return OnboardingResponse(
                module=module_path,
                summary=f"No history found for {module_path}.",
            )

        context = self._format_history(history)
        prompt = (
            f"Generate an onboarding walkthrough for '{module_path}'. "
            f"Create 4-6 chronological steps, each with a date, title, description, "
            f"type (create/refactor/fix/feature), and commit hash.\n\n"
            f"History:\n{context}\n\n"
            f"Return as JSON array: "
            f'[{{"date": "...", "title": "...", "description": "...", "type": "...", "commit": "..."}}]'
        )

        try:
            raw = await self.llm.generate(prompt, system_prompt=ONBOARDING_SYSTEM)
            import json
            steps_data = json.loads(raw.strip())
            steps = [
                OnboardingStep(
                    date=s.get("date", ""),
                    title=s.get("title", ""),
                    description=s.get("description", ""),
                    type=s.get("type", "feature"),
                    commit=s.get("commit", ""),
                    pr=s.get("pr", ""),
                )
                for s in steps_data
            ]
        except Exception as e:
            logger.warning("Onboarding generation failed: %s", e)
            steps = []

        summary = f"Walkthrough for {module_path}: {len(steps)} evolution steps identified."
        return OnboardingResponse(module=module_path, summary=summary, steps=steps)

    async def detect_drift(self, module_path: str | None = None) -> list[DriftAlert]:
        """
        Compare current code state against documented intent.
        If module_path is None, scans all modules.
        """
        logger.info("Running drift detection for: %s", module_path or "all modules")

        # Get recent commits with their documented intent
        if module_path:
            query = (
                "MATCH (c:Entity {type: 'commit'})-[r]->(f:Entity) "
                "WHERE f.label CONTAINS $path "
                "RETURN c.label AS commit, c.message AS message, f.label AS file, "
                "c.timestamp AS ts "
                "ORDER BY c.timestamp DESC LIMIT 20"
            )
            params = {"path": module_path}
        else:
            query = (
                "MATCH (c:Entity {type: 'commit'})-[r]->(f:Entity {type: 'file'}) "
                "RETURN c.label AS commit, c.message AS message, f.label AS file, "
                "c.timestamp AS ts "
                "ORDER BY c.timestamp DESC LIMIT 50"
            )
            params = {}

        try:
            records = await self.graph_db.query(query, params)
        except Exception as e:
            logger.warning("Drift detection query failed: %s", e)
            return []

        if not records:
            return []

        # Format commit history for LLM analysis
        history_text = "\n".join(
            f"- Commit {r.get('commit', '?')}: {r.get('message', '?')} (file: {r.get('file', '?')})"
            for r in records
        )

        prompt = (
            f"Analyze these commits for potential drift (cases where code may have diverged "
            f"from documented intent):\n\n{history_text}\n\n"
            f"Return a JSON array of drift alerts: "
            f'[{{"file": "...", "message": "...", "severity": "BEHAVIOR_DRIFT|MISSING_INTENT|CONSTRAINT_VIOLATION"}}]'
            f"\nIf no drift is detected, return an empty array: []"
        )

        try:
            raw = await self.llm.generate(prompt, system_prompt=DRIFT_SYSTEM)
            import json
            alerts_data = json.loads(raw.strip())
            alerts = [
                DriftAlert(
                    file=a.get("file", ""),
                    message=a.get("message", ""),
                    severity=DriftSeverity(a.get("severity", "BEHAVIOR_DRIFT")),
                )
                for a in alerts_data
                if a.get("file")
            ]
        except Exception as e:
            logger.warning("Drift detection LLM analysis failed: %s", e)
            alerts = []

        return alerts

    async def _get_module_history(self, module_path: str) -> list[dict]:
        """Get the full temporal history of a module from the graph."""
        # Search for the file node
        file_query = (
            "MATCH (f:Entity) WHERE f.label CONTAINS $path "
            "RETURN f.id AS id LIMIT 1"
        )
        try:
            results = await self.graph_db.query(file_query, {"path": module_path})
        except Exception:
            return []

        if not results:
            return []

        node_id = results[0].get("id", "")
        if not node_id:
            return []

        return await self.graph_db.get_node_history(node_id)

    def _format_history(self, history: list[dict]) -> str:
        """Format history records into a readable string for LLM."""
        parts = []
        for h in history:
            parts.append(
                f"[{h.get('timestamp', '?')}] "
                f"Commit {h.get('commit_id', '?')[:7]} by {h.get('author', '?')}: "
                f"{h.get('message', '?')}"
            )
        return "\n".join(parts)
