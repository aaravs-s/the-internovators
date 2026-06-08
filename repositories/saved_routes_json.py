from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.route import SavedRouteCreate


def list_saved_routes() -> list[dict]:
    return read_list(settings.saved_routes_file)


def save_route(route_data: SavedRouteCreate, user_id: str) -> dict:
    saved_routes = list_saved_routes()
    saved_route = {
        "id": str(uuid4()),
        "user_id": user_id,
        "route_id": route_data.route_id,
        "name": route_data.name,
        "start": route_data.start,
        "destination": route_data.destination,
        "distance_miles": route_data.distance_miles,
        "safety_score": route_data.safety_score,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    saved_routes.append(saved_route)
    write_list(settings.saved_routes_file, saved_routes)
    return saved_route


def list_saved_routes_for_user(user_id: str) -> list[dict]:
    return [route for route in list_saved_routes() if route["user_id"] == user_id]
