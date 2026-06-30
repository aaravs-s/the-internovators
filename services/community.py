from repositories import follows_json, route_comments_json, saved_routes_json, users_json
from services.route_catalog import enrich_route_map_data, normalize_safety_score, route_image_url


def canonical_owner_id(route: dict) -> str:
    user_id = route.get("user_id", "")
    if isinstance(user_id, list):
        return user_id[0] if user_id else ""
    return user_id


def shared_routes_owned_by(user_id: str) -> list[dict]:
    return [
        route
        for route in saved_routes_json.list_saved_routes()
        if route.get("is_shared", True) and canonical_owner_id(route) == user_id
    ]


def public_user(user: dict, viewer_id: str) -> dict:
    user_id = user["id"]
    return {
        "id": user_id,
        "username": user["username"],
        "bio": user.get("bio", ""),
        "picture_url": user.get("picture_url", ""),
        "created_at": user.get("created_at", ""),
        "shared_route_count": len(shared_routes_owned_by(user_id)),
        "follower_count": follows_json.follower_count(user_id),
        "following_count": follows_json.following_count(user_id),
        "is_following": follows_json.is_following(viewer_id, user_id),
    }


def list_community_users(viewer_id: str, view: str, query: str = "") -> list[dict]:
    normalized_query = query.strip().lower()
    followed_ids = follows_json.following_ids(viewer_id)
    users = []
    for user in users_json.list_users():
        if user["id"] == viewer_id:
            continue
        if view == "following" and user["id"] not in followed_ids:
            continue
        searchable = f"{user.get('username', '')} {user.get('bio', '')}".lower()
        if normalized_query and normalized_query not in searchable:
            continue
        users.append(public_user(user, viewer_id))
    users.sort(key=lambda user: (-user["shared_route_count"], user["username"].lower()))
    return users


def community_route(route: dict, viewer_id: str) -> dict:
    route = enrich_route_map_data(route)
    owner_id = canonical_owner_id(route)
    owner = users_json.get_user_by_id(owner_id)
    enriched = saved_routes_json.route_with_social_fields(route, viewer_id)
    return {
        "id": route["id"],
        "name": route["name"],
        "summary": route.get("summary", ""),
        "distance_miles": route.get("distance_miles", 0),
        "estimated_minutes": route.get("estimated_minutes", 0),
        "safety_score": normalize_safety_score(route.get("safety_score", 0)),
        "tags": list(route.get("tags", [])),
        "image_url": route_image_url(route),
        "coordinates": list(route.get("coordinates", [])),
        "is_demo": bool(route.get("is_demo", False)),
        "created_at": route.get("created_at", ""),
        "owner": public_user(owner, viewer_id),
        "like_count": enriched["like_count"],
        "comment_count": sum(
            1
            for comment in route_comments_json.list_comments()
            if comment.get("route_id") == route["id"]
        ),
        "is_liked": enriched["user_has_liked"],
        "is_owner": owner_id == viewer_id,
    }


def activity_feed(viewer_id: str, scope: str) -> list[dict]:
    followed_ids = follows_json.following_ids(viewer_id)
    routes = [
        route
        for route in saved_routes_json.list_saved_routes()
        if route.get("is_shared", True)
        and (scope == "everyone" or canonical_owner_id(route) in followed_ids)
    ]
    routes.sort(key=lambda route: route.get("created_at", ""), reverse=True)
    return [community_route(route, viewer_id) for route in routes[:50]]


def route_discussion(route: dict, viewer_id: str) -> list[dict]:
    route_comments = [
        comment
        for comment in route_comments_json.list_comments()
        if comment.get("route_id") == route["id"]
    ]
    route_comments.sort(key=lambda comment: comment.get("created_at", ""))
    top_level = [comment for comment in route_comments if not comment.get("parent_id")]

    def serialize(comment: dict) -> dict:
        author = users_json.get_user_by_id(comment["author_id"])
        return {
            "id": comment["id"],
            "route_id": comment["route_id"],
            "body": comment["body"],
            "created_at": comment["created_at"],
            "author": public_user(author, viewer_id),
            "can_delete": viewer_id in {comment["author_id"], canonical_owner_id(route)},
            "replies": [],
        }

    discussion = []
    for parent in top_level:
        item = serialize(parent)
        item["replies"] = [
            serialize(reply)
            for reply in route_comments
            if reply.get("parent_id") == parent["id"]
        ]
        discussion.append(item)
    return discussion
