from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.route import SavedRouteCreate, SavedRouteNotesUpdate


def list_saved_routes() -> list[dict]:
    return read_list(settings.saved_routes_file)


def save_route(route_data: SavedRouteCreate, user_id: str) -> dict:
    saved_routes = list_saved_routes()
    existing = next(
        (
            route
            for route in saved_routes
            if route["user_id"] == user_id and route["route_id"] == route_data.route_id
        ),
        None,
    )
    if existing:
        return existing

    saved_route = {
        "id": str(uuid4()),
        "user_id": user_id,
        "route_id": route_data.route_id,
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
        "comments": "",
        "tags": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    saved_routes.append(saved_route)
    write_list(settings.saved_routes_file, saved_routes)
    return saved_route


def list_saved_routes_for_user(user_id: str) -> list[dict]:
    return [route for route in list_saved_routes() if route["user_id"] == user_id]


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
            if route["route_id"] == route_id and route["user_id"] == user_id
        ),
        None,
    )


def update_route_notes(
    saved_route_id: str, user_id: str, notes_data: SavedRouteNotesUpdate
) -> dict | None:
    saved_routes = list_saved_routes()
    for route in saved_routes:
        if route["id"] == saved_route_id and route["user_id"] == user_id:
            route["comments"] = notes_data.comments.strip()
            route["tags"] = [
                tag.strip()
                for tag in notes_data.tags.split(",")
                if tag.strip()
            ]
            write_list(settings.saved_routes_file, saved_routes)
            return route
    return None
