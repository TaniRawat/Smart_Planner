"""
app/tasks_utils.py

Small helper utilities for task creation, tag handling, and pagination.

These helpers keep logic clean inside the routers and services.
They do NOT depend on FastAPI. They only depend on SQLAlchemy models
and the DB session that callers pass in.
"""

from __future__ import annotations

from typing import Iterable, List, Optional, Tuple, Dict, Any

from sqlalchemy.orm import Session

from . import models


# --------------------------------------------------------------
# Basic string sanitizers
# --------------------------------------------------------------
def normalize_text(value: Optional[str]) -> str:
    """Trim whitespace and convert None -> empty string."""
    if not value:
        return ""
    return value.strip()


def clamp_priority(priority: Optional[int]) -> int:
    """Ensure the priority stays within 1–5."""
    try:
        p = int(priority)
        if p < 1:
            return 1
        if p > 5:
            return 5
        return p
    except Exception:
        return 3


# --------------------------------------------------------------
# Tag utilities
# --------------------------------------------------------------
def resolve_or_create_tags(
    db: Session, tag_names: Optional[Iterable[str]]
) -> List[models.Tag]:
    """
    Given a list of tag names, return the Tag objects.
    Missing tags are created.

    - tag_names may be None, empty, or contain duplicates.
    - Names are normalized: stripped + lowercased for key, but original
      case preserved (users may prefer 'DSA' not 'dsa').

    Returns list[Tag].
    """
    if not tag_names:
        return []

    resolved_tags: List[models.Tag] = []
    seen = set()

    for name in tag_names:
        if not name:
            continue

        clean = name.strip()
        if not clean:
            continue

        norm = clean.lower()
        if norm in seen:
            continue
        seen.add(norm)

        # Try fetch existing tag
        tag = db.query(models.Tag).filter(models.Tag.name == clean).first()

        # If not exists, create
        if not tag:
            tag = models.Tag(name=clean)
            db.add(tag)
            db.flush()  # ensure tag.id is populated

        resolved_tags.append(tag)

    return resolved_tags


# --------------------------------------------------------------
# Pagination utilities
# --------------------------------------------------------------
def paginate_query(
    query, page: int = 1, per_page: int = 20
) -> Tuple[List[Any], Dict[str, int]]:
    """
    Apply pagination to a SQLAlchemy query.
    Returns (items, meta_dict).

    meta = {
        "total": total_count,
        "page": page,
        "per_page": per_page,
        "pages": total_pages
    }
    """
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 20

    total = query.order_by(None).count()
    pages = (total // per_page) + (1 if total % per_page != 0 else 0)

    items = (
        query.limit(per_page)
        .offset((page - 1) * per_page)
        .all()
    )

    meta = {
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": pages,
    }

    return items, meta


# --------------------------------------------------------------
# Task enrichment helper
# --------------------------------------------------------------
def enrich_task(task: models.Task) -> Dict[str, Any]:
    """
    Convert a Task SQLAlchemy object into a clean dictionary.

    This is optional because Pydantic v2 (from_attributes=True)
    already returns clean models, but it is useful for:
    - background workers
    - debugging output
    - feeding AI models (Step 4)
    """
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description or "",
        "priority": task.priority,
        "deadline": str(task.deadline) if task.deadline else None,
        "done": task.done,
        "tags": [t.name for t in task.tags],
        "owner_id": task.owner_id,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


# --------------------------------------------------------------
# Optional – hook for future AI Summaries
# --------------------------------------------------------------
def build_task_prompt(tasks: List[models.Task]) -> str:
    """
    Build a structured prompt that will be fed into the AI model
    (used in Step 4: daily summaries, task breakdown, study plan).

    Caller: app/services/ai_service.py
    """
    lines = ["Here is the user's task list. Summaries must be actionable.\n"]

    for t in tasks:
        tag_str = ", ".join([tag.name for tag in t.tags]) if t.tags else "none"
        line = (
            f"- {t.title} "
            f"(priority={t.priority}, deadline={t.deadline}, tags={tag_str}, done={t.done})"
        )
        if t.description:
            line += f"\n  description: {t.description}"
        lines.append(line)

    return "\n".join(lines)
