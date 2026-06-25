from datetime import datetime, timezone
from uuid import uuid4

from core.config import settings
from repositories.json_store import read_list, write_list
from schemas.route import RouteOption


def list_generated_routes() -> list[dict]:
    return read_list(settings.generated_routes_file)

def transform_step(step):
    if "distance_miles" in step and "kind" in step:
        return step

    step_type = step.get("type")
    if step_type == 11:
        kind = "start"
    elif step_type == 10:
        kind = "end"
    else:
        kind = step.get("kind", "step")

    distance_meters = float(step.get("distance", step.get("routeOffsetInMeters", 0)))
    return {
        "instruction": step.get("instruction", step.get("message", "Continue")),
        "distance_miles": distance_meters / 1609,
        "kind": kind,
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
