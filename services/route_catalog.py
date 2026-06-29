import os

from core.config import settings
from repositories import generated_routes_json, saved_routes_json
from schemas.route import DirectionStepPublic, RouteDetailPublic, RouteSummaryPublic, SafetyBreakdown


def normalize_safety_score(score: float | int) -> float:
    # normalized = float(score)
    # if normalized <= 10:
    #     normalized *= 10
    # return round(max(0, min(normalized, 10)), 1)
    return score


def route_image_url(route: dict) -> str | None:
    filename = route.get("filename", "")
    if (
        filename
        and filename == os.path.basename(filename)
        and (settings.maps_dir / filename).is_file()
    ):
        return f"/maps/{filename}"
    return None


def route_safety_breakdown(route: dict) -> SafetyBreakdown | None:
    breakdown = route.get("safety_breakdown")
    if not isinstance(breakdown, dict):
        return None
    return SafetyBreakdown.model_validate(breakdown)


def list_public_routes(
    route_type: str = "all",
    focus: str = "all",
    sort: str = "recent",
    viewer_id: str | None = None,
) -> list[RouteSummaryPublic]:
    return [
        _summary(route)
        for route in saved_routes_json.list_gallery_routes(
            route_type=route_type,
            focus=focus,
            sort=sort,
            viewer_id=viewer_id,
        )
    ]


def get_public_route(
    route_id: str, viewer_id: str | None = None
) -> RouteDetailPublic | None:
    saved_route = saved_routes_json.get_saved_route(route_id)
    if saved_route:
        if (
            not saved_route.get("is_shared", True)
            and saved_route.get("user_id") != viewer_id
        ):
            return None
        return _detail(saved_route)

    generated_route = generated_routes_json.get_generated_route(route_id)
    if generated_route:
        return _detail(generated_route)
    return None


def _summary(route: dict) -> RouteSummaryPublic:
    return RouteSummaryPublic(
        id=route["id"],
        name=route["name"],
        distance_miles=route["distance_miles"],
        estimated_minutes=route.get("estimated_minutes", 0),
        safety_score=normalize_safety_score(route.get("safety_score", 0)),
        tags=list(route.get("tags", [])),
        image_url=route_image_url(route),
        safety_breakdown=route_safety_breakdown(route),
        route_profile=route.get("route_profile", "route"),
        tradeoff_summary=route.get("tradeoff_summary", ""),
        preference_score=route.get("preference_score", 0),
        preference_summary=route.get("preference_summary", ""),
    )


def _detail(route: dict) -> RouteDetailPublic:
    summary = _summary(route)
    return RouteDetailPublic(
        **summary.model_dump(),
        start=route.get("start", ""),
        destination=route.get("destination", ""),
        summary=route.get("summary", ""),
        highlights=list(route.get("highlights", [])),
        directions=_direction_steps(route),
        coordinates=list(route.get("coordinates", [])),
    )


def _direction_steps(route: dict) -> list[DirectionStepPublic]:
    raw_steps = route.get("directions") or []
    if not raw_steps:
        return []

    steps = [
        DirectionStepPublic(
            instruction=f"Start — {route.get('start', '')}",
            distance_miles=0,
            kind="start",
        )
    ]
    distance_meters = 0.0
    for raw_step in raw_steps:
        distance_meters += float(raw_step.get("distance", 0))
        steps.append(
            DirectionStepPublic(
                instruction=raw_step.get("instruction", "Continue"),
                distance_miles=round(distance_meters / 1609.344, 2),
                kind="step",
            )
        )
    steps.append(
        DirectionStepPublic(
            instruction=f"End — {route.get('destination', '')}",
            distance_miles=round(float(route.get("distance_miles", 0)), 2),
            kind="end",
        )
    )
    return steps
