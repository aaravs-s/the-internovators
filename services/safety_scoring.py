from pathlib import Path
import json
import math
import os

import mapbox_vector_tile
import requests
from shapely.geometry import LineString, shape


MAX_TILES_PER_REQUEST = 30
MAX_ZOOM = 16
SCORE_RESOLUTION = 100
POI_SAMPLE_LIMIT = 3
POI_RADIUS_METERS = 250

TT_API_KEY = os.getenv("TT_API_KEY") or os.getenv("TOMTOM_API_KEY")

cache = {}
crime_polygon_cache = None


def clamp_score(value: float | int) -> int:
    return int(round(max(0, min(float(value), 100))))


def latlon_to_tile(lat, lon, z):
    xtile = int((lon + 180) / 360 * (2**z))
    ytile = int(
        (1 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi)
        * (2**z)
        / 2
    )
    return xtile, ytile


def tilecoord_to_lonlat(local_x, local_y, tile_x, tile_y, zoom, extent):
    world_x = tile_x + local_x / extent
    world_y = tile_y + (extent - local_y) / extent

    lon = world_x / (2**zoom) * 360.0 - 180.0
    n = math.pi - 2.0 * math.pi * world_y / (2**zoom)
    lat = math.degrees(math.atan(math.sinh(n)))

    return lon, lat


def get_tiles(route, zoom=12):
    tiles = {}
    distinct_tiles = set()

    for i, point in enumerate(route):
        x, y = latlon_to_tile(point.y, point.x, zoom)
        tiles[i] = (zoom, x, y)
        distinct_tiles.add((zoom, x, y))

    return len(distinct_tiles), tiles


def fetch_tile(z, x, y):
    key = (z, x, y)
    if key in cache:
        return cache[key]

    url = f"https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.pbf"
    response = requests.get(url, params={"key": TT_API_KEY}, timeout=8)
    response.raise_for_status()
    cache[key] = mapbox_vector_tile.decode(response.content)

    return cache[key]


def densify(route, step_meters=100):
    line = LineString(route)
    num_steps = int(line.length * 111000 / step_meters)

    return [
        line.interpolate(i / max(num_steps, 1), normalized=True)
        for i in range(num_steps + 1)
    ]


def representative_points(points, limit=POI_SAMPLE_LIMIT):
    if not points:
        return []
    if len(points) <= limit:
        return points
    indexes = sorted(
        {
            round(i * (len(points) - 1) / max(limit - 1, 1))
            for i in range(limit)
        }
    )
    return [points[index] for index in indexes]


def calculate_traffic_score(route: dict, sampled_points) -> tuple[int, list[str]]:
    if not TT_API_KEY or not route.get("coordinates") or not sampled_points:
        return 75, ["Traffic data unavailable"]

    try:
        tiles = [0] * (MAX_TILES_PER_REQUEST + 1)
        num_tiles = MAX_TILES_PER_REQUEST + 1
        zoom = MAX_ZOOM + 1
        while num_tiles > MAX_TILES_PER_REQUEST and zoom > 0:
            zoom -= 1
            num_tiles, tiles = get_tiles(sampled_points, zoom)

        total_traffic = 0.0
        matched_points = 0
        road_closure_count = 0

        for index, point in enumerate(sampled_points):
            tile = tiles[index]
            tile_data = fetch_tile(*tile)
            if "empty" in tile_data:
                continue

            traffic_layer = tile_data.get("Traffic flow", {})
            features = traffic_layer.get("features", [])
            extent = traffic_layer.get("extent", 4096)
            min_dist = None
            traffic_level = None

            for feature in features:
                geometry = feature.get("geometry", {})
                line_lists = (
                    geometry.get("coordinates", [])
                    if geometry.get("type") == "MultiLineString"
                    else [geometry.get("coordinates", [])]
                )
                for linestring in line_lists:
                    traffic_line = LineString(
                        [
                            tilecoord_to_lonlat(
                                tile_point[0],
                                tile_point[1],
                                tile[1],
                                tile[2],
                                zoom,
                                extent,
                            )
                            for tile_point in linestring
                        ]
                    )
                    cur_dist = point.distance(traffic_line)
                    if cur_dist < 0.00005 and (min_dist is None or cur_dist < min_dist):
                        min_dist = cur_dist
                        properties = feature.get("properties", {})
                        traffic_level = float(properties.get("traffic_level", 0))
                        if properties.get("road_closure"):
                            road_closure_count += 1

            if traffic_level is not None:
                total_traffic += traffic_level
                matched_points += 1

        if matched_points == 0:
            return 85, ["No heavy traffic detected nearby"]

        avg_traffic = total_traffic / matched_points
        score = clamp_score(100 * (1 - avg_traffic) - road_closure_count * 15)
        signal = (
            "Low nearby traffic"
            if score >= 80
            else "Moderate nearby traffic"
            if score >= 60
            else "Heavy nearby traffic"
        )
        return score, [signal]
    except (KeyError, ValueError, requests.RequestException):
        return 75, ["Traffic data unavailable"]


def route_bbox(coordinates: list[list[float]], offset_degrees=0.006):
    lons = [point[0] for point in coordinates]
    lats = [point[1] for point in coordinates]
    return [
        min(lons) - offset_degrees,
        min(lats) - offset_degrees,
        max(lons) + offset_degrees,
        max(lats) + offset_degrees,
    ]


def fetch_incidents(coordinates: list[list[float]]) -> list[dict]:
    if not TT_API_KEY or not coordinates:
        return []

    bbox = route_bbox(coordinates)
    response = requests.get(
        "https://api.tomtom.com/traffic/services/5/incidentDetails",
        params={
            "bbox": ",".join(str(value) for value in bbox),
            "key": TT_API_KEY,
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,delay,length}}}",
            "timeValidityFilter": "present",
        },
        timeout=8,
    )
    response.raise_for_status()
    return response.json().get("incidents", [])


def calculate_incident_score(route: dict) -> tuple[int, list[str]]:
    if not TT_API_KEY:
        return 80, ["Incident data unavailable"]

    try:
        incidents = fetch_incidents(route.get("coordinates", []))
    except (ValueError, requests.RequestException):
        return 80, ["Incident data unavailable"]

    if not incidents:
        return 100, ["No current traffic incidents nearby"]

    penalty = 0
    for incident in incidents:
        properties = incident.get("properties", {})
        category = str(properties.get("iconCategory", "")).lower()
        delay = float(properties.get("delay", 0) or 0)
        magnitude = int(properties.get("magnitudeOfDelay", 0) or 0)

        penalty += 8
        if "accident" in category:
            penalty += 12
        if "closure" in category:
            penalty += 18
        penalty += min(15, magnitude * 3 + delay / 120)

    score = clamp_score(100 - penalty)
    return score, [f"{len(incidents)} current traffic incident{'s' if len(incidents) != 1 else ''} nearby"]


def load_crime_polygons() -> list:
    global crime_polygon_cache
    if crime_polygon_cache is not None:
        return crime_polygon_cache

    data_path = Path(__file__).resolve().parents[1] / "data" / "crime_polygons.geojson"
    if not data_path.exists():
        crime_polygon_cache = []
        return crime_polygon_cache

    data = json.loads(data_path.read_text(encoding="utf-8"))
    polygons = []
    for feature in data.get("features", []):
        geometry = feature.get("geometry") or {
            "type": feature.get("type"),
            "coordinates": feature.get("coordinates"),
        }
        try:
            polygons.append(shape(geometry))
        except (TypeError, ValueError):
            continue
    crime_polygon_cache = polygons
    return crime_polygon_cache


def calculate_crime_score(route: dict) -> tuple[int, list[str]]:
    coordinates = route.get("coordinates", [])
    if len(coordinates) < 2:
        return 75, ["Crime data unavailable"]

    line = LineString(coordinates)
    near_route = line.buffer(0.00035)
    nearby_count = 0
    intersect_count = 0

    for polygon in load_crime_polygons():
        if line.intersects(polygon):
            intersect_count += 1
        elif near_route.intersects(polygon):
            nearby_count += 1

    penalty = intersect_count * 18 + nearby_count * 8
    score = clamp_score(100 - penalty)
    if intersect_count:
        return score, [f"Route crosses {intersect_count} higher-risk local crime area{'s' if intersect_count != 1 else ''}"]
    if nearby_count:
        return score, [f"{nearby_count} higher-risk local crime area{'s' if nearby_count != 1 else ''} near route"]
    return score, ["No local crime hot spots detected near route"]


def fetch_category_results(query: str, point) -> list[dict]:
    if not TT_API_KEY:
        return []

    response = requests.get(
        f"https://api.tomtom.com/search/2/categorySearch/{query}.json",
        params={
            "key": TT_API_KEY,
            "lat": point.y,
            "lon": point.x,
            "radius": POI_RADIUS_METERS,
            "limit": 10,
            "countrySet": "US",
        },
        timeout=8,
    )
    response.raise_for_status()
    return response.json().get("results", [])


def collect_route_pois(sampled_points) -> tuple[dict[str, dict], bool]:
    pois = {}
    had_error = False
    queries = ["park", "water", "trail", "public transport stop", "restaurant", "nightlife"]

    for point in representative_points(sampled_points):
        for query in queries:
            try:
                for result in fetch_category_results(query, point):
                    poi = result.get("poi", {})
                    position = result.get("position", {})
                    key = result.get("id") or (
                        poi.get("name"),
                        round(float(position.get("lat", 0) or 0), 5),
                        round(float(position.get("lon", 0) or 0), 5),
                    )
                    categories = [str(category).lower() for category in poi.get("categories", [])]
                    pois[str(key)] = {
                        "name": poi.get("name", ""),
                        "categories": categories + [query],
                    }
            except (ValueError, requests.RequestException):
                had_error = True

    return pois, had_error


def calculate_environment_scores(sampled_points) -> tuple[int, int, list[str]]:
    if not TT_API_KEY or not sampled_points:
        return 70, 70, ["POI context unavailable"]

    pois, had_error = collect_route_pois(sampled_points)
    if not pois and had_error:
        return 70, 70, ["POI context unavailable"]

    water_terms = {
        "water",
        "lake",
        "river",
        "reservoir",
        "beach",
        "park",
        "trail",
        "scenic",
        "nature reserve",
    }
    crowd_terms = {
        "restaurant",
        "nightlife",
        "bar",
        "public transport stop",
        "bus stop",
        "metro station",
        "shopping center",
    }

    water_count = 0
    crowd_count = 0
    for poi in pois.values():
        category_text = " ".join(poi["categories"])
        if any(term in category_text for term in water_terms):
            water_count += 1
        if any(term in category_text for term in crowd_terms):
            crowd_count += 1

    water_score = clamp_score(55 + min(water_count, 8) * 6)
    crowding_score = clamp_score(95 - min(crowd_count, 10) * 5)

    signals = []
    if water_count:
        signals.append(f"{water_count} park, trail, scenic, or water POI{'s' if water_count != 1 else ''} nearby")
    else:
        signals.append("Limited park, trail, scenic, or water POIs nearby")
    if crowd_count:
        signals.append(f"{crowd_count} crowding-related POI{'s' if crowd_count != 1 else ''} nearby")
    else:
        signals.append("Low POI-based crowding indicators")
    if had_error:
        signals.append("Some POI checks unavailable")

    return water_score, crowding_score, signals


def calculate_overall_score(breakdown: dict) -> int:
    return clamp_score(
        breakdown["traffic_score"] * 0.25
        + breakdown["incident_score"] * 0.20
        + breakdown["crime_score"] * 0.30
        + breakdown["crowding_score"] * 0.15
        + breakdown["water_proximity_score"] * 0.10
    )


def calculate_safety_breakdown(route: dict) -> dict:
    coordinates = route.get("coordinates", [])
    if len(coordinates) < 2:
        base_score = int(route.get("base_safety_score", route.get("safety_score", 75)))
        breakdown = {
            "traffic_score": base_score,
            "incident_score": base_score,
            "crime_score": base_score,
            "water_proximity_score": base_score,
            "crowding_score": base_score,
            "signals": ["Sample route uses fallback safety estimates"],
        }
        breakdown["overall_score"] = clamp_score(base_score)
        return breakdown

    sampled_points = densify(coordinates, SCORE_RESOLUTION)
    traffic_score, traffic_signals = calculate_traffic_score(route, sampled_points)
    incident_score, incident_signals = calculate_incident_score(route)
    crime_score, crime_signals = calculate_crime_score(route)
    water_score, crowding_score, environment_signals = calculate_environment_scores(sampled_points)

    breakdown = {
        "traffic_score": traffic_score,
        "incident_score": incident_score,
        "crime_score": crime_score,
        "water_proximity_score": water_score,
        "crowding_score": crowding_score,
        "signals": traffic_signals + incident_signals + crime_signals + environment_signals,
    }
    breakdown["overall_score"] = calculate_overall_score(breakdown)
    return breakdown


def calculate_safety_score(route: dict) -> int:
    return calculate_safety_breakdown(route)["overall_score"]


def describe_score(score: int) -> str:
    if score >= 85:
        return "Strong sidewalk coverage and comfortable walking conditions."
    if score >= 70:
        return "Generally walkable with a few areas to watch."
    return "Usable route, but review the safety notes before walking."
