from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.route import RouteOption


def list_generated_routes() -> list[dict]:
    return read_list(settings.generated_routes_file)

def transform_step(step):
    return {
        "instruction": step["instruction"],
        "distance_miles": step["distance"] / 1609,
        "kind": "start" if step["type"] == 11 else ("end" if step["type"] == 10 else "step"),
    }

def store_generated_routes(routes: list[RouteOption]) -> list[dict]:
    records = list_generated_routes()
    generated_at = datetime.now(timezone.utc).isoformat()
    stored_routes = []

    for route in routes:
        route_record = route.model_dump()
        route_record["generated_at"] = generated_at
        route_record["directions"] = [transform_step(s) for s in route_record["directions"]]
        stored_routes.append(route_record)

    records.extend(stored_routes)
    write_list(settings.generated_routes_file, records[-50:])
    return stored_routes

def get_generated_route(route_id: str) -> dict | None:
    return next(
        (route for route in list_generated_routes() if route["id"] == route_id),
        None,
    )
