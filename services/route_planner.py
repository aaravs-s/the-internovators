from core.config import settings
from repositories.json_store import read_list
from schemas.route import RouteOption, RouteSearchRequest
from services.geocoding import normalize_place_name
from services.safety_scoring import calculate_safety_breakdown, calculate_safety_score, describe_score
import requests
import os
import json
import sys
import shapely
import math
import re
from shapely.geometry import LineString, shape, mapping
from shapely.ops import unary_union
from urllib.parse import quote
from staticmap import StaticMap, Line
import time
import sqlite3
from services.points_of_interest import find_pois
from uuid import uuid4

# fastapi dev main.py --host 127.0.0.1 --reload

ORS_API_KEY = os.getenv("ORS_API_KEY")
TT_API_KEY = os.getenv("TT_API_KEY")
ROUTE_ACTIVITY_TYPES = {
    "walking": "foot-walking",
    "biking": "cycling-regular",
}
PROFILE_NAMES = {
    "quickest": "Quickest",
    "safest": "Safest",
    "scenic": "Scenic",
    "quiet": "Quiet",
    "balanced": "Balanced",
}
PROFILE_STYLES = {
    "quickest": "direct",
    "safest": "balanced",
    "scenic": "quiet",
    "quiet": "quiet",
    "balanced": "balanced",
}
PROFILE_PRIORITY = ["quickest", "safest", "scenic", "quiet", "balanced"]
MAX_DETOUR_FACTOR = 1.75
MAX_ROUTE_OVERLAP = 0.45
RELAXED_ROUTE_OVERLAP = 0.65
MIN_DISTINCT_ROUTES = 2
MIN_RETURNED_ROUTES = 4
MAX_DISTINCT_ROUTES = 5

url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

routing_headers = {
    "Authorization": ORS_API_KEY,
    "Content-Type": "application/json"
}


def profile_sort_key(route: dict | RouteOption) -> tuple[int, int, float]:
    profile = route.route_profile if isinstance(route, RouteOption) else route.get("route_profile", "balanced")
    score = route.safety_score if isinstance(route, RouteOption) else route.get("safety_score", 0)
    minutes = route.estimated_minutes if isinstance(route, RouteOption) else route.get("estimated_minutes", 0)
    priority = PROFILE_PRIORITY.index(profile) if profile in PROFILE_PRIORITY else len(PROFILE_PRIORITY)
    return (priority, -int(score), float(minutes))


def has_user_preferences(search: RouteSearchRequest) -> bool:
    weights = inferred_preference_weights(search)
    return any(
        [
            weights["water"],
            weights["scenic"],
            weights["crowds"],
            weights["safety"],
        ]
    )


def preference_term_pattern(keyword: str) -> str:
    escaped = re.escape(keyword)
    if keyword.replace(" ", "").isalpha():
        return rf"\b{escaped}\w*\b"
    return escaped


def has_avoid_preference(text: str, keywords: list[str]) -> bool:
    negative_prefixes = [
        (r"avoid(?:ing)?", 6),
        (r"skip", 4),
        (r"without", 5),
        (r"stay away from", 5),
        (r"away from", 5),
        (r"far from", 5),
        (r"not near", 5),
        (r"not by", 5),
        (r"not close to", 5),
        (r"do not want", 8),
        (r"don't want", 8),
        (r"dont want", 8),
        (r"do not like", 6),
        (r"don't like", 6),
        (r"dont like", 6),
        (r"hate", 4),
        (r"dislike", 4),
        (r"no", 1),
    ]

    for keyword in keywords:
        term = preference_term_pattern(keyword)
        for prefix, max_words in negative_prefixes:
            pattern = rf"\b(?:{prefix})(?:\W+\w+){{0,{max_words}}}\W+{term}"
            if re.search(pattern, text):
                return True
    return False


def inferred_preference_weights(search: RouteSearchRequest) -> dict[str, int | str]:
    weights = {
        "water": search.prefer_water,
        "scenic": search.prefer_scenic,
        "crowds": search.avoid_crowds,
        "safety": search.prefer_safety,
        "water_mode": "seek",
        "scenic_mode": "seek",
        "crowd_mode": "avoid",
    }
    text = search.preferences_description.lower().replace("’", "'")

    keyword_groups = {
        "water": [
            "water",
            "lake",
            "river",
            "creek",
            "pond",
            "reservoir",
            "shore",
            "waterfront",
            "bridge",
        ],
        "scenic": [
            "scenic",
            "pretty",
            "beautiful",
            "nature",
            "park",
            "trail",
            "green",
            "trees",
            "view",
            "calm",
            "relaxing",
        ],
        "crowds": [
            "avoid crowds",
            "not crowded",
            "less crowded",
            "quiet",
            "peaceful",
            "empty",
            "alone",
            "low traffic",
            "less traffic",
            "calm",
        ],
        "safety": [
            "safe",
            "safety",
            "crime",
            "well lit",
            "lighting",
            "night",
            "secure",
            "avoid danger",
            "dangerous",
            "incident",
        ],
    }

    for key, keywords in keyword_groups.items():
        matches = sum(1 for keyword in keywords if keyword in text)
        if matches:
            weights[key] = max(weights[key], min(5, 2 + matches))

    if has_avoid_preference(text, keyword_groups["water"]):
        weights["water"] = max(weights["water"], 4)
        weights["water_mode"] = "avoid"

    if has_avoid_preference(text, keyword_groups["scenic"]):
        weights["scenic"] = max(weights["scenic"], 4)
        weights["scenic_mode"] = "avoid"

    seek_crowd_terms = ["crowded", "busy", "lively", "people", "social", "active"]
    avoid_crowd_terms = [
        "not crowded",
        "less crowded",
        "avoid crowded",
        "avoid crowds",
        "quiet",
        "peaceful",
    ]
    if any(term in text for term in seek_crowd_terms) and not any(
        term in text for term in avoid_crowd_terms
    ):
        weights["crowds"] = max(weights["crowds"], 3)
        weights["crowd_mode"] = "seek"

    return weights


def route_preference_score(route: dict, search: RouteSearchRequest) -> tuple[int, str]:
    breakdown = route.get("safety_breakdown") or {}
    weights = inferred_preference_weights(search)
    weighted_total = 0.0
    weight_total = 0
    summary_parts = []

    if weights["water"]:
        water_score = float(breakdown.get("water_proximity_score", 70))
        if weights.get("water_mode") == "avoid":
            score = 100 - water_score
            summary_parts.append("away from water")
        else:
            score = water_score
            summary_parts.append("water")
        weighted_total += score * weights["water"]
        weight_total += weights["water"]

    if weights["scenic"]:
        profile_bonus = 12 if route.get("route_profile") == "scenic" else 0
        scenic_score = min(100, float(breakdown.get("water_proximity_score", 70)) + profile_bonus)
        if weights.get("scenic_mode") == "avoid":
            score = 100 - scenic_score
            summary_parts.append("less scenic")
        else:
            score = scenic_score
            summary_parts.append("scenic")
        weighted_total += score * weights["scenic"]
        weight_total += weights["scenic"]

    if weights["crowds"]:
        crowding_score = float(breakdown.get("crowding_score", 70))
        if weights.get("crowd_mode") == "seek":
            score = 100 - crowding_score
            summary_parts.append("lively")
        else:
            score = crowding_score
            summary_parts.append("low-crowd")
        weighted_total += score * weights["crowds"]
        weight_total += weights["crowds"]

    if weights["safety"]:
        score = float(breakdown.get("overall_score", route.get("safety_score", 70)))
        weighted_total += score * weights["safety"]
        weight_total += weights["safety"]
        summary_parts.append("safety")

    if weight_total == 0:
        return 0, ""

    score = int(round(weighted_total / weight_total))
    return score, f"{score}% match for {', '.join(summary_parts)} preferences"


def route_overlap_ratio(first: dict, second: dict) -> float:
    first_coords = first.get("coordinates", [])
    second_coords = second.get("coordinates", [])
    if len(first_coords) < 2 or len(second_coords) < 2:
        return 0

    first_buffer = LineString(first_coords).buffer(0.00035)
    second_buffer = LineString(second_coords).buffer(0.00035)
    min_area = min(first_buffer.area, second_buffer.area)
    if min_area <= 0:
        return 0
    return first_buffer.intersection(second_buffer).area / min_area


def within_detour_limit(route: dict, baseline: dict) -> bool:
    return (
        route.get("distance_miles", 0) <= baseline.get("distance_miles", 0) * MAX_DETOUR_FACTOR
        and route.get("estimated_minutes", 0) <= baseline.get("estimated_minutes", 0) * MAX_DETOUR_FACTOR
    )


def is_distinct_route(route: dict, accepted: list[dict], max_overlap: float = MAX_ROUTE_OVERLAP) -> bool:
    return all(route_overlap_ratio(route, existing) <= max_overlap for existing in accepted)


def distinct_route_candidates(candidates: list[dict]) -> list[dict]:
    valid_candidates = [candidate for candidate in candidates if len(candidate.get("coordinates", [])) >= 2]
    if not valid_candidates:
        return []

    baseline = min(
        valid_candidates,
        key=lambda route: (route.get("estimated_minutes", 0), route.get("distance_miles", 0)),
    )
    sorted_candidates = sorted(valid_candidates, key=profile_sort_key)
    accepted: list[dict] = []

    for candidate in sorted_candidates:
        if len(accepted) >= MAX_DISTINCT_ROUTES:
            break
        if (
            len(accepted) >= MIN_DISTINCT_ROUTES
            and not within_detour_limit(candidate, baseline)
        ):
            continue
        if is_distinct_route(candidate, accepted):
            accepted.append(candidate)

    if len(accepted) < MIN_RETURNED_ROUTES:
        for candidate in sorted_candidates:
            if len(accepted) >= MIN_RETURNED_ROUTES:
                break
            if (
                candidate not in accepted
                and within_detour_limit(candidate, baseline)
                and is_distinct_route(candidate, accepted, RELAXED_ROUTE_OVERLAP)
            ):
                accepted.append(candidate)

    return accepted[:MAX_DISTINCT_ROUTES]


def coordinate_distance_miles(start: list[float], end: list[float]) -> float:
    lon1, lat1 = start
    lon2, lat2 = end
    radius_miles = 3958.8
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    haversine = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )
    return 2 * radius_miles * math.atan2(math.sqrt(haversine), math.sqrt(1 - haversine))


def route_distance_miles(coordinates: list[list[float]]) -> float:
    if len(coordinates) < 2:
        return 0
    return sum(
        coordinate_distance_miles(coordinates[index], coordinates[index + 1])
        for index in range(len(coordinates) - 1)
    )


def synthetic_profile_coordinates(
    profile: str,
    start_coordinates: list[float],
    dest_coordinates: list[float],
) -> list[list[float]]:
    if profile == "quickest":
        return [start_coordinates, dest_coordinates]
    if profile == "scenic":
        waypoint = offset_waypoint(start_coordinates, dest_coordinates, 1, 1.45, 0.5)
        return [start_coordinates, waypoint, dest_coordinates] if waypoint else []
    if profile == "quiet":
        first = offset_waypoint(start_coordinates, dest_coordinates, 1, 0.9, 0.3)
        second = offset_waypoint(start_coordinates, dest_coordinates, 1, 0.9, 0.72)
        return [start_coordinates, first, second, dest_coordinates] if first and second else []
    if profile == "safest":
        waypoint = offset_waypoint(start_coordinates, dest_coordinates, -1, 1.45, 0.5)
        return [start_coordinates, waypoint, dest_coordinates] if waypoint else []
    if profile == "balanced":
        first = offset_waypoint(start_coordinates, dest_coordinates, -1, 0.85, 0.35)
        second = offset_waypoint(start_coordinates, dest_coordinates, 1, 0.55, 0.72)
        return [start_coordinates, first, second, dest_coordinates] if first and second else []
    return []


def add_diversity_fallback_candidates(
    candidates: list[dict],
    route_type: str,
) -> list[dict]:
    valid_candidates = [
        candidate for candidate in candidates if len(candidate.get("coordinates", [])) >= 2
    ]
    if not valid_candidates or len(distinct_route_candidates(valid_candidates)) >= MIN_RETURNED_ROUTES:
        return candidates

    baseline = min(
        valid_candidates,
        key=lambda route: (route.get("estimated_minutes", 0), route.get("distance_miles", 0)),
    )
    start_coordinates = baseline["coordinates"][0]
    dest_coordinates = baseline["coordinates"][-1]
    direct_distance = route_distance_miles([start_coordinates, dest_coordinates])
    baseline_distance = max(float(baseline.get("distance_miles", 0)), direct_distance, 0.1)
    baseline_minutes = max(int(baseline.get("estimated_minutes", 0)), 1)
    default_minutes_per_mile = 6 if route_type == "biking" else 18
    minutes_per_mile = baseline_minutes / baseline_distance
    if minutes_per_mile <= 0:
        minutes_per_mile = default_minutes_per_mile

    expanded_candidates = list(candidates)
    for profile in PROFILE_PRIORITY:
        if profile == "quickest":
            continue
        coordinates = synthetic_profile_coordinates(
            profile,
            start_coordinates,
            dest_coordinates,
        )
        if len(coordinates) < 2:
            continue
        route_distance = route_distance_miles(coordinates)
        ratio = route_distance / direct_distance if direct_distance else 1
        distance_miles = round(max(baseline_distance * ratio, baseline_distance + 0.05), 2)
        estimated_minutes = max(
            baseline_minutes + 1,
            int(round(distance_miles * minutes_per_mile)),
        )
        expanded_candidates.append(
            {
                "coordinates": coordinates,
                "distance_miles": distance_miles,
                "estimated_minutes": estimated_minutes,
                "id": profile,
                "name": PROFILE_NAMES.get(profile, "Route Option"),
                "map_style": PROFILE_STYLES.get(profile, "balanced"),
                "route_profile": profile,
                "directions": [
                    {
                        "instruction": f"Follow the {PROFILE_NAMES.get(profile, 'alternate')} variation toward your destination.",
                        "distance": int(distance_miles * 1609),
                    }
                ],
                "diversity_fallback": True,
            }
        )

    return expanded_candidates


def tradeoff_summary(route: dict, baseline: dict) -> str:
    extra_minutes = route.get("estimated_minutes", 0) - baseline.get("estimated_minutes", 0)
    extra_distance = route.get("distance_miles", 0) - baseline.get("distance_miles", 0)
    profile = route.get("route_profile", "balanced")

    if profile == "quickest":
        return "Fastest available route"
    if profile == "safest":
        return f"+{max(0, extra_minutes)} min, safer corridor"
    if profile == "scenic":
        return f"+{max(0, extra_minutes)} min, scenic waypoint"
    if profile == "quiet":
        return f"+{max(0, extra_minutes)} min, lower-stress streets"
    if extra_minutes > 0 or extra_distance > 0:
        return f"+{max(0, extra_minutes)} min, balanced tradeoff"
    return "Balanced route"


def finalize_route_options(
    candidates: list[dict],
    start: str,
    destination: str,
    route_type: str,
    include_pois: bool,
    search: RouteSearchRequest,
) -> list[RouteOption]:
    if not candidates:
        return []

    candidates = add_diversity_fallback_candidates(candidates, route_type)

    quickest = min(
        candidates,
        key=lambda route: (route.get("estimated_minutes", 0), route.get("distance_miles", 0)),
    )
    quickest["route_profile"] = "quickest"
    quickest["name"] = PROFILE_NAMES["quickest"]
    quickest["map_style"] = PROFILE_STYLES["quickest"]

    selected = distinct_route_candidates(candidates)
    if quickest not in selected:
        selected = [quickest] + selected
    selected = selected[:MAX_DISTINCT_ROUTES]

    route_options: list[RouteOption] = []
    for route in selected:
        profile = route.get("route_profile", "balanced")
        route["name"] = PROFILE_NAMES.get(profile, "Route Option")
        route["map_style"] = PROFILE_STYLES.get(profile, "balanced")
        safety_breakdown = calculate_safety_breakdown(route)
        route["safety_breakdown"] = safety_breakdown
        score = safety_breakdown["overall_score"]
        preference_score, preference_summary = route_preference_score(route, search)
        route_highlights = find_pois(route) if include_pois else []
        route_options.append(
            RouteOption(
                id=f"{profile}-{uuid4().hex[:8]}",
                name=route["name"],
                start=start,
                destination=destination,
                distance_miles=route["distance_miles"],
                estimated_minutes=route["estimated_minutes"],
                safety_score=score,
                summary=describe_score(score),
                highlights=route_highlights,
                route_type=route_type,
                map_style=route["map_style"],
                filename="",
                directions=route.get("directions", []),
                coordinates=route["coordinates"],
                safety_breakdown=safety_breakdown,
                route_profile=profile,
                tradeoff_summary=tradeoff_summary(route, quickest),
                preference_score=preference_score,
                preference_summary=preference_summary,
            )
        )

    if has_user_preferences(search):
        return sorted(
            route_options,
            key=lambda route: (-route.preference_score, route.estimated_minutes),
        )

    return sorted(route_options, key=profile_sort_key)


def avoid_polygon_options(polygons: list) -> dict:
    return {
        "avoid_polygons": {
            "type": "MultiPolygon",
            "coordinates": polygons,
        }
    } if polygons else {}


def offset_waypoint(
    start_coordinates,
    dest_coordinates,
    side: float,
    strength: float = 1.0,
    fraction: float = 0.5,
):
    start_lon, start_lat = start_coordinates
    dest_lon, dest_lat = dest_coordinates
    mid_lon = start_lon + (dest_lon - start_lon) * fraction
    mid_lat = start_lat + (dest_lat - start_lat) * fraction
    dx = dest_lon - start_lon
    dy = dest_lat - start_lat
    length = (dx**2 + dy**2) ** 0.5
    if length == 0:
        return None

    perpendicular_lon = -dy / length
    perpendicular_lat = dx / length
    offset = min(0.02, max(0.0035, length * 0.25)) * side * strength
    return [
        mid_lon + perpendicular_lon * offset,
        mid_lat + perpendicular_lat * offset,
    ]


def profile_waypoint(profile: str, start_coordinates, dest_coordinates):
    if profile == "scenic":
        return get_scenic_waypoint(start_coordinates, dest_coordinates) or offset_waypoint(
            start_coordinates, dest_coordinates, 1, 1.35
        )
    if profile == "quiet":
        return offset_waypoint(start_coordinates, dest_coordinates, 1, 0.85, 0.35)
    if profile == "balanced":
        return offset_waypoint(start_coordinates, dest_coordinates, -1, 0.75, 0.65)
    if profile == "safest":
        return offset_waypoint(start_coordinates, dest_coordinates, -1, 1.35)
    return None


def get_coordinates (address):
    if TT_API_KEY:
        try:
            response = requests.get(
                f"https://api.tomtom.com/search/2/search/{quote(address)}.json",
                params={"key": TT_API_KEY},
                timeout=8,
            )
            response.raise_for_status()
            results = response.json().get("results", [])
            if results:
                search_name = address.split(",")[0].lower()
                best_option_idx = 0
                for index, option in enumerate(results):
                    poi_name = option.get("poi", {}).get("name", "").lower()
                    freeform = option.get("address", {}).get("freeformAddress", "").lower()
                    if search_name in {poi_name, freeform}:
                        best_option_idx = index
                        break
                    if search_name in poi_name or search_name in freeform:
                        best_option_idx = index
                position = results[best_option_idx]["position"]
                return [position["lon"], position["lat"]]
        except (KeyError, requests.RequestException, ValueError):
            pass

    if ORS_API_KEY:
        response = requests.get(
            "https://api.openrouteservice.org/geocode/search",
            params={
                "api_key": ORS_API_KEY,
                "text": address,
                "boundary.country": "USA",
                "size": 1,
            },
            timeout=8,
        )
        response.raise_for_status()
        features = response.json().get("features", [])
        if features:
            return list(features[0]["geometry"]["coordinates"])

    raise ValueError(f"Unable to geocode {address}")

def get_crime_polygons ():
    polygons = []
    with open("data/crime_polygons.geojson", "r") as file:
        data = json.load(file)
        for feature in data["features"]:
            rings = feature["coordinates"]
            closed_rings = []
            for ring in rings:
                if ring[0] != ring[-1]:
                    ring = ring + [ring[0]]
                closed_rings.append(ring)
            polygons.append(closed_rings)
    return polygons

def get_incident_polygons (start, end): # parameters are lon, lat coordinate pairs
    # minLon,minLat,maxLon,maxLat
    offset_miles = 0.4 # how much bigger to make the bbox in miles
    bbox = [
        min(start[0], end[0]) - 0.0168*offset_miles,
        min(start[1], end[1]) - 0.0145*offset_miles,
        max(start[0], end[0]) + 0.0168*offset_miles,
        max(start[1], end[1]) + 0.0145*offset_miles
    ]
    bbox = [str(i) for i in bbox]

    url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
    params = {
        "bbox": ",".join(bbox),
        "key": TT_API_KEY,
        "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory}}}"
    }

    response = requests.get(url, params=params)
    data = response.json() # linestrings

    # convert to polygons to avoid
    polygons = []
    for incident in data["incidents"]:
        geom = shape(incident["geometry"])

        poly = geom.buffer(0.0003) # ~30m near Austin

        polygons.append(poly)

    avoid_area = unary_union(polygons)

    geojson_polygons = shapely.to_geojson(avoid_area)

    return json.loads(geojson_polygons)["coordinates"]


def get_scenic_waypoint(start_coordinates, dest_coordinates):
    if not TT_API_KEY:
        return None

    midpoint = [
        (start_coordinates[0] + dest_coordinates[0]) / 2,
        (start_coordinates[1] + dest_coordinates[1]) / 2,
    ]
    for query in ["park", "trail", "lake"]:
        try:
            response = requests.get(
                f"https://api.tomtom.com/search/2/categorySearch/{quote(query)}.json",
                params={
                    "key": TT_API_KEY,
                    "lat": midpoint[1],
                    "lon": midpoint[0],
                    "radius": 1600,
                    "limit": 1,
                    "countrySet": "US",
                },
                timeout=8,
            )
            response.raise_for_status()
            results = response.json().get("results", [])
            if results:
                position = results[0]["position"]
                return [position["lon"], position["lat"]]
        except (KeyError, requests.RequestException, ValueError):
            continue
    return None


def build_ors_body(start_coordinates, dest_coordinates, profile: str) -> dict:
    coordinates = [start_coordinates, dest_coordinates]
    waypoint = profile_waypoint(profile, start_coordinates, dest_coordinates)
    if waypoint:
        coordinates = [start_coordinates, waypoint, dest_coordinates]

    body = {
        "coordinates": coordinates,
    }
    if len(coordinates) == 2:
        body["alternative_routes"] = {
            "target_count": 2 if profile in {"quickest", "balanced"} else 1,
            "share_factor": 0.55 if profile in {"scenic", "quiet", "safest"} else 0.75,
            "weight_factor": 3 if profile in {"scenic", "quiet", "safest"} else 2,
        }

    polygons = []
    if profile in {"balanced", "safest"}:
        try:
            polygons.extend(get_crime_polygons())
        except (KeyError, OSError, ValueError):
            pass
    if profile in {"quiet", "safest"}:
        try:
            polygons.extend(get_incident_polygons(start_coordinates, dest_coordinates))
        except (KeyError, requests.RequestException, ValueError):
            pass
    if profile in {"balanced", "safest", "quiet"}:
        options = avoid_polygon_options(polygons)
        if options:
            body["options"] = options

    return body


def ors_profile_candidates(
    profile: str,
    start_coordinates,
    dest_coordinates,
    activity_type: str,
) -> list[dict]:
    response = requests.post(
        f"https://api.openrouteservice.org/v2/directions/{activity_type}/geojson",
        json=build_ors_body(start_coordinates, dest_coordinates, profile),
        headers=routing_headers,
        timeout=12,
    )
    response.raise_for_status()
    data = response.json()

    candidates = []
    for feature in data.get("features", []):
        coords = feature["geometry"]["coordinates"]
        miles = round(feature["properties"]["summary"]["distance"] / 1609, 2)
        minutes = int(feature["properties"]["summary"]["duration"] / 60)
        candidates.append(
            {
                "coordinates": coords,
                "distance_miles": miles,
                "estimated_minutes": minutes,
                "id": profile,
                "name": PROFILE_NAMES.get(profile, "Route Option"),
                "map_style": PROFILE_STYLES.get(profile, "balanced"),
                "route_profile": profile,
                "directions": extract_directions(feature),
            }
        )
    return candidates

def build_sample_routes(search: RouteSearchRequest) -> list[RouteOption]:
    samples = read_list(settings.sample_routes_file)
    route_options: list[RouteOption] = []

    for index, route in enumerate(samples):
        profile = ["balanced", "quiet", "quickest", "scenic"][index % 4]
        score = int(route.get("base_safety_score", 75))
        safety_breakdown = {
            "overall_score": score,
            "traffic_score": score,
            "incident_score": score,
            "crime_score": score,
            "water_proximity_score": score,
            "crowding_score": score,
            "signals": ["Fixed demo route with fallback safety estimates"],
        }
        multiplier = 0.6 if search.route_type == "biking" else 1
        route_option = RouteOption(
            id=route["id"],
            name=route["name"],
            start=route["start"],
            destination=route["destination"],
            distance_miles=route["distance_miles"],
            estimated_minutes=max(5, int(route["estimated_minutes"] * multiplier)),
            safety_score=score,
            summary=describe_score(score),
            highlights=route.get("highlights", []),
            route_type=route.get("route_type", "walking"),
            map_style=PROFILE_STYLES.get(profile, "balanced"),
            coordinates=route.get("coordinates", []),
            safety_breakdown=safety_breakdown,
            route_profile=profile,
            tradeoff_summary=route.get("tradeoff_summary", "Sample fallback route"),
            is_demo=True,
        )
        route_options.append(route_option)
        route_dict = route_option.model_dump()
        preference_score, preference_summary = route_preference_score(route_dict, search)
        route_option.preference_score = preference_score
        route_option.preference_summary = preference_summary

    if has_user_preferences(search):
        return sorted(
            route_options,
            key=lambda route: (-route.preference_score, route.estimated_minutes),
        )
    return sorted(route_options, key=lambda route: route.safety_score, reverse=True)

def generate_map_image (coords):
    """Returns filename of map image in maps/"""
    settings.maps_dir.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(settings.maps_dir / "filenames.db") as conn:

        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS filenames (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL
            )
        """)

        cursor.execute(
            "INSERT INTO filenames (name) VALUES (?)",
            ("map",)
        )
        inserted_id = cursor.lastrowid

        conn.commit()

    m = StaticMap(600, 300, url_template='https://basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png')
    line = Line(coords, 'var(--back-text-color)', 3)
    m.add_line(line)

    image = m.render()
    image.save(settings.maps_dir / f"map_{inserted_id}.png")

    return f"map_{inserted_id}.png"


def extract_directions(feature: dict) -> list[dict]:
    segments = feature.get("properties", {}).get("segments") or []
    if not segments or not isinstance(segments[0], dict):
        return []
    steps = segments[0].get("steps") or []
    return steps if isinstance(steps, list) else []


def extract_tomtom_coordinates(route: dict) -> list[list[float]]:
    coordinates = []
    for leg in route.get("legs", []):
        for point in leg.get("points", []):
            coordinates.append([point["longitude"], point["latitude"]])
    return coordinates


def extract_tomtom_directions(route: dict) -> list[dict]:
    directions = []
    guidance = route.get("guidance", {})
    for instruction in guidance.get("instructions", []):
        text = instruction.get("message") or instruction.get("instruction")
        if not text:
            continue
        directions.append(
            {
                "instruction": text,
                "distance": instruction.get("routeOffsetInMeters", 0),
            }
        )
    return directions


def tomtom_route_locations(locations: list[list[float]]) -> str:
    return ":".join(f"{latlon[1]},{latlon[0]}" for latlon in locations)


def tomtom_profile_candidates(
    profile: str,
    start_coordinates,
    dest_coordinates,
    travel_mode: str,
) -> list[dict]:
    route_type = {
        "quickest": "fastest",
        "balanced": "fastest",
        "quiet": "shortest",
        "safest": "eco",
        "scenic": "fastest",
    }.get(profile, "fastest")
    locations = [start_coordinates, dest_coordinates]
    waypoint = profile_waypoint(profile, start_coordinates, dest_coordinates)
    if waypoint:
        locations = [start_coordinates, waypoint, dest_coordinates]

    response = requests.get(
        "https://api.tomtom.com/routing/1/calculateRoute/"
        f"{tomtom_route_locations(locations)}/json",
        params={
            "key": TT_API_KEY,
            "travelMode": travel_mode,
            "routeType": route_type,
            "maxAlternatives": 2 if profile in {"quickest", "balanced"} and len(locations) == 2 else 0,
            "instructionsType": "text",
            "language": "en-US",
        },
        timeout=12,
    )
    response.raise_for_status()
    data = response.json()

    candidates = []
    for route in data.get("routes", []):
        coordinates = extract_tomtom_coordinates(route)
        if not coordinates:
            continue
        summary = route["summary"]
        candidates.append(
            {
                "coordinates": coordinates,
                "distance_miles": round(summary["lengthInMeters"] / 1609, 2),
                "estimated_minutes": max(1, int(summary["travelTimeInSeconds"] / 60)),
                "id": profile,
                "name": PROFILE_NAMES.get(profile, "Route Option"),
                "map_style": PROFILE_STYLES.get(profile, "balanced"),
                "route_profile": profile,
                "directions": extract_tomtom_directions(route),
            }
        )
    return candidates


def build_tomtom_routes(search: RouteSearchRequest) -> list[RouteOption]:
    start = normalize_place_name(search.start)
    destination = normalize_place_name(search.destination)
    start_coordinates = get_coordinates(start)
    dest_coordinates = get_coordinates(destination)
    travel_mode = "bicycle" if search.route_type == "biking" else "pedestrian"

    candidates = []
    for profile in PROFILE_PRIORITY:
        try:
            candidates.extend(
                tomtom_profile_candidates(
                    profile,
                    start_coordinates,
                    dest_coordinates,
                    travel_mode,
                )
            )
        except (KeyError, requests.RequestException, ValueError):
            continue

    return finalize_route_options(
        candidates,
        start,
        destination,
        search.route_type,
        include_pois=bool(ORS_API_KEY),
        search=search,
    )


def search_routes(search: RouteSearchRequest) -> list[RouteOption]:
    """Assumes searches are properly formatted addresses, which can be achieved with ORS autocomplete. Right now, this names routes
    'Route Option' unless it's the fastest route, which it calls 'Quickest'."""

    # Texas Capitol address: 1100 Congress Ave., Austin, TX 78701
    # UT Tower address: 110 Inner Campus Drive, Austin, TX 78705
    # Convention center: 500 E Cesar Chavez St, Austin, TX 78701

    # UT Tower, Austin, TX, USA
    # Texas State Capitol, Austin, TX, USA

    if not ORS_API_KEY and TT_API_KEY:
        try:
            routes = build_tomtom_routes(search)
            return routes or build_sample_routes(search)
        except (KeyError, requests.RequestException, ValueError):
            return build_sample_routes(search)

    if ORS_API_KEY:
        start = normalize_place_name(search.start)
        destination = normalize_place_name(search.destination)

        try:
            start_coordinates = get_coordinates(start)
            dest_coordinates = get_coordinates(destination)
            activity_type = ROUTE_ACTIVITY_TYPES.get(search.route_type, "foot-walking")

            generated_routes = []
            for profile in PROFILE_PRIORITY:
                try:
                    generated_routes.extend(
                        ors_profile_candidates(
                            profile,
                            start_coordinates,
                            dest_coordinates,
                            activity_type,
                        )
                    )
                except (KeyError, requests.RequestException, ValueError):
                    continue

            route_options = finalize_route_options(
                generated_routes,
                start,
                destination,
                search.route_type,
                include_pois=True,
                search=search,
            )
            if route_options:
                return route_options
            raise ValueError("No ORS route candidates generated")
        except (KeyError, requests.RequestException, ValueError):
            try:
                routes = build_tomtom_routes(search) if TT_API_KEY else []
                return routes or build_sample_routes(search)
            except (KeyError, requests.RequestException, ValueError):
                return build_sample_routes(search)

    return build_sample_routes(search)
