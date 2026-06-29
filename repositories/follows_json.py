from datetime import datetime, timezone

from core.config import settings
from repositories.json_store import read_list, write_list


def list_follows() -> list[dict]:
    return read_list(settings.follows_file)


def is_following(follower_id: str, followed_id: str) -> bool:
    return any(
        edge.get("follower_id") == follower_id
        and edge.get("followed_id") == followed_id
        for edge in list_follows()
    )


def follow(follower_id: str, followed_id: str) -> dict:
    follows = list_follows()
    existing = next(
        (
            edge
            for edge in follows
            if edge.get("follower_id") == follower_id
            and edge.get("followed_id") == followed_id
        ),
        None,
    )
    if existing:
        return existing

    edge = {
        "follower_id": follower_id,
        "followed_id": followed_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    follows.append(edge)
    write_list(settings.follows_file, follows)
    return edge


def unfollow(follower_id: str, followed_id: str) -> None:
    follows = [
        edge
        for edge in list_follows()
        if not (
            edge.get("follower_id") == follower_id
            and edge.get("followed_id") == followed_id
        )
    ]
    write_list(settings.follows_file, follows)


def following_ids(user_id: str) -> set[str]:
    return {
        edge["followed_id"]
        for edge in list_follows()
        if edge.get("follower_id") == user_id and edge.get("followed_id")
    }


def follower_count(user_id: str) -> int:
    return sum(1 for edge in list_follows() if edge.get("followed_id") == user_id)


def following_count(user_id: str) -> int:
    return sum(1 for edge in list_follows() if edge.get("follower_id") == user_id)
