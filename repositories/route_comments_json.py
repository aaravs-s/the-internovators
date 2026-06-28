from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list


def list_comments() -> list[dict]:
    return read_list(settings.route_comments_file)


def get_comment(comment_id: str) -> dict | None:
    return next(
        (comment for comment in list_comments() if comment.get("id") == comment_id),
        None,
    )


def create_comment(
    route_id: str,
    author_id: str,
    body: str,
    parent_id: str | None = None,
) -> dict:
    comments = list_comments()
    comment = {
        "id": str(uuid4()),
        "route_id": route_id,
        "author_id": author_id,
        "parent_id": parent_id,
        "body": body,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    comments.append(comment)
    write_list(settings.route_comments_file, comments)
    return comment


def delete_comment_thread(comment_id: str) -> bool:
    comments = list_comments()
    retained = [
        comment
        for comment in comments
        if comment.get("id") != comment_id and comment.get("parent_id") != comment_id
    ]
    if len(retained) == len(comments):
        return False
    write_list(settings.route_comments_file, retained)
    return True
