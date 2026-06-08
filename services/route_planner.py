from core.config import settings
from repositories.json_store import read_list
from schemas.route import RouteOption, RouteSearchRequest
from services.geocoding import normalize_place_name
from services.safety_scoring import calculate_safety_score, describe_score


def search_routes(search: RouteSearchRequest) -> list[RouteOption]:
    start = normalize_place_name(search.start)
    destination = normalize_place_name(search.destination)
    sample_routes = read_list(settings.sample_routes_file)

    route_options: list[RouteOption] = []
    for route in sample_routes:
        score = calculate_safety_score(route)
        route_options.append(
            RouteOption(
                id=route["id"],
                name=route["name"],
                start=start,
                destination=destination,
                distance_miles=route["distance_miles"],
                estimated_minutes=route["estimated_minutes"],
                safety_score=score,
                summary=describe_score(score),
                highlights=route["highlights"],
            )
        )

    return sorted(route_options, key=lambda route: route.safety_score, reverse=True)
