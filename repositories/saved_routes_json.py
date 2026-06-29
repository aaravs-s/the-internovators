from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.route import SavedRouteCreate, SavedRouteNotesUpdate


VALID_ROUTE_TYPES = {"all", "walking", "biking"}
VALID_FOCUS_FILTERS = {"all", "top-rated", "scenic", "safest", "popular"}
VALID_SORTS = {"recent", "community-rating", "safety-score", "most-liked", "shortest"}


def canonical_owner_id(route: dict) -> str:
    user_id = route.get("user_id", "")
    if isinstance(user_id, list):
        return user_id[0] if user_id else ""
    return user_id


def list_saved_routes() -> list[dict]:
    return [route_with_social_fields(route) for route in read_list(settings.saved_routes_file)]


def route_with_social_fields(route: dict, viewer_id: str | None = None) -> dict:
    route = dict(route)
    route["is_shared"] = route.get("is_shared", True)
    route["liked_by"] = list(route.get("liked_by", []))
    route["ratings"] = list(route.get("ratings", []))

    ratings = [
        rating
        for rating in route["ratings"]
        if isinstance(rating, dict) and isinstance(rating.get("rating"), int)
    ]
    rating_count = len(ratings)
    rating_total = sum(rating["rating"] for rating in ratings)

    route["like_count"] = len(route["liked_by"])
    route["rating_count"] = rating_count
    route["average_rating"] = round(rating_total / rating_count, 1) if rating_count else 0
    route["user_has_liked"] = bool(viewer_id and viewer_id in route["liked_by"])
    route["user_rating"] = next(
        (
            rating["rating"]
            for rating in ratings
            if viewer_id and rating.get("user_id") == viewer_id
        ),
        0,
    )
    return route


def _write_enriched_routes(saved_routes: list[dict]) -> None:
    write_list(
        settings.saved_routes_file,
        [
            {
                **route,
                "is_shared": route.get("is_shared", True),
                "liked_by": list(route.get("liked_by", [])),
                "ratings": list(route.get("ratings", [])),
            }
            for route in saved_routes
        ],
    )


def save_route_generated(route_data: SavedRouteCreate, user_id: str) -> dict:
    saved_routes = list_saved_routes()
    existing = next(
        (
            route
            for route in saved_routes
            if user_id in route["user_id"] and route["route_id"] == route_data.id
        ),
        None,
    )
    if existing:
        return existing

    saved_route = {
        "id": str(uuid4()),
        "user_id": [user_id],
        "route_id": route_data.id,
        "name": route_data.name,
        "start": route_data.start,
        "destination": route_data.destination,
        "distance_miles": route_data.distance_miles,
        "estimated_minutes": route_data.estimated_minutes,
        "safety_score": route_data.safety_score,
        "summary": route_data.summary,
        "highlights": route_data.highlights,
        "route_type": route_data.route_type,
        "map_style": route_data.map_style,
        "filename": route_data.filename,
        "directions": route_data.directions,
        "coordinates": route_data.coordinates,
        "safety_breakdown": (
            route_data.safety_breakdown.model_dump()
            if route_data.safety_breakdown
            else None
        ),
        "route_profile": route_data.route_profile,
        "tradeoff_summary": route_data.tradeoff_summary,
        "preference_score": route_data.preference_score,
        "preference_summary": route_data.preference_summary,
        "comments": "",
        "tags": [],
        "is_shared": True,
        "liked_by": [],
        "ratings": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    saved_routes.append(saved_route)
    write_list(settings.saved_routes_file, saved_routes)
    return saved_route

def save_route_shared(route_id: str, user_id: str) -> dict:
    saved_routes = list_saved_routes()
    
    saved_route = None
    for i in range(len(saved_routes)):
        if route_id == saved_routes[i]["id"]:
            saved_routes[i]["user_id"].append(user_id)
            saved_route = saved_routes[i]
            break

    write_list(settings.saved_routes_file, saved_routes)
    return saved_route

def list_saved_routes_for_user(user_id: str) -> list[dict]:
    return [route for route in list_saved_routes() if user_id in route["user_id"]]


def list_shared_routes_for_user(user_id: str) -> list[dict]:
    return [
        route
        for route in list_saved_routes_for_user(user_id)
        if route.get("is_shared", True)
    ]


def get_saved_route(saved_route_id: str) -> dict | None:
    return next(
        (route for route in list_saved_routes() if route["id"] == saved_route_id),
        None,
    )


def get_saved_route_for_user(route_id: str, user_id: str) -> dict | None:
    return next(
        (
            route
            for route in list_saved_routes()
            if route["route_id"] == route_id and user_id in route["user_id"]
        ),
        None,
    )


def get_saved_route_for_user_by_source(route: dict, user_id: str) -> dict | None:
    canonical_route_id = route.get("route_id", route["id"])
    return get_saved_route_for_user(canonical_route_id, user_id)


def list_gallery_routes(
    route_type: str = "all",
    focus: str = "all",
    sort: str = "recent",
    viewer_id: str | None = None,
) -> list[dict]:
    selected_route_type = route_type if route_type in VALID_ROUTE_TYPES else "all"
    selected_focus = focus if focus in VALID_FOCUS_FILTERS else "all"
    selected_sort = sort if sort in VALID_SORTS else "recent"

    routes = [
        route_with_social_fields(route, viewer_id)
        for route in read_list(settings.saved_routes_file)
        if route.get("is_shared", True)
    ]

    if selected_route_type != "all":
        routes = [
            route
            for route in routes
            if route.get("route_type", "walking") == selected_route_type
        ]

    if selected_focus == "top-rated":
        routes = [route for route in routes if route["average_rating"] > 0]
        selected_sort = "community-rating"
    elif selected_focus == "scenic":
        routes = [route for route in routes if _route_matches_scenic(route)]
    elif selected_focus == "safest":
        routes = [route for route in routes if route.get("safety_score", 0) >= 80]
        selected_sort = "safety-score"
    elif selected_focus == "popular":
        routes = [route for route in routes if route["like_count"] > 0]
        selected_sort = "most-liked"

    reverse = selected_sort != "shortest"
    routes.sort(key=_sort_key(selected_sort), reverse=reverse)
    return routes


def _route_matches_scenic(route: dict) -> bool:
    search_text = " ".join(
        [
            route.get("name", ""),
            route.get("summary", ""),
            route.get("comments", ""),
            " ".join(route.get("tags", [])),
            " ".join(route.get("highlights", [])),
        ]
    ).lower()
    return "scenic" in search_text


def _sort_key(sort: str):
    if sort == "community-rating":
        return lambda route: (
            route.get("average_rating", 0),
            route.get("rating_count", 0),
            route.get("created_at", ""),
        )
    if sort == "safety-score":
        return lambda route: (route.get("safety_score", 0), route.get("created_at", ""))
    if sort == "most-liked":
        return lambda route: (route.get("like_count", 0), route.get("created_at", ""))
    if sort == "shortest":
        return lambda route: route.get("distance_miles", 0)
    return lambda route: route.get("created_at", "")


def set_route_sharing(saved_route_id: str, user_id: str, is_shared: bool) -> dict | None:
    saved_routes = list_saved_routes()
    for route in saved_routes:
        if route["id"] == saved_route_id and user_id in route["user_id"]:
            route["is_shared"] = is_shared
            _write_enriched_routes(saved_routes)
            return route_with_social_fields(route)
    return None


def toggle_like(saved_route_id: str, user_id: str) -> dict | None:
    saved_routes = list_saved_routes()
    for route in saved_routes:
        if (
            route["id"] != saved_route_id
            or canonical_owner_id(route) == user_id
            or not route.get("is_shared", True)
        ):
            continue

        liked_by = list(route.get("liked_by", []))
        if user_id in liked_by:
            liked_by.remove(user_id)
        else:
            liked_by.append(user_id)
        route["liked_by"] = liked_by
        _write_enriched_routes(saved_routes)
        return route_with_social_fields(route, user_id)
    return None


def set_route_like(saved_route_id: str, user_id: str, is_liked: bool) -> dict | None:
    saved_routes = list_saved_routes()
    for route in saved_routes:
        if (
            route["id"] != saved_route_id
            or canonical_owner_id(route) == user_id
            or not route.get("is_shared", True)
        ):
            continue

        liked_by = list(route.get("liked_by", []))
        if is_liked and user_id not in liked_by:
            liked_by.append(user_id)
        elif not is_liked and user_id in liked_by:
            liked_by.remove(user_id)
        route["liked_by"] = liked_by
        _write_enriched_routes(saved_routes)
        return route_with_social_fields(route, user_id)
    return None


def rate_route(saved_route_id: str, user_id: str, rating: int) -> dict | None:
    if rating < 1 or rating > 5:
        return None

    saved_routes = list_saved_routes()
    for route in saved_routes:
        if (
            route["id"] != saved_route_id
            or user_id in route["user_id"]
            or not route.get("is_shared", True)
        ):
            continue

        ratings = [
            existing_rating
            for existing_rating in route.get("ratings", [])
            if existing_rating.get("user_id") != user_id
        ]
        ratings.append(
            {
                "user_id": user_id,
                "rating": rating,
                "rated_at": datetime.now(timezone.utc).isoformat(),
            }
        )
        route["ratings"] = ratings
        _write_enriched_routes(saved_routes)
        return route_with_social_fields(route, user_id)
    return None


def update_route_notes(
    saved_route_id: str, user_id: str, notes_data: SavedRouteNotesUpdate
) -> dict | None:
    saved_routes = list_saved_routes()
    for route in saved_routes:
        if route["id"] == saved_route_id and user_id in route["user_id"]:
            route["comments"] = notes_data.comments.strip()
            route["tags"] = [
                tag.strip()
                for tag in notes_data.tags.split(",")
                if tag.strip()
            ]
            _write_enriched_routes(saved_routes)
            return route
    return None
