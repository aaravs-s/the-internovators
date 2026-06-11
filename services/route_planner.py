from core.config import settings
from repositories.json_store import read_list
from schemas.route import RouteOption, RouteSearchRequest
from services.geocoding import normalize_place_name
from services.safety_scoring import calculate_safety_score, describe_score
import requests
import os
import json
import sys
import shapely
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from urllib.parse import quote

# fastapi dev main.py --host 127.0.0.1 --reload

ORS_API_KEY = os.getenv("ORS_API_KEY")
TT_API_KEY = os.getenv("TT_API_KEY")

url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

routing_headers = {
    "Authorization": ORS_API_KEY,
    "Content-Type": "application/json"
}

def get_coordinates (address):
    response = requests.get(
        f"https://api.tomtom.com/search/2/search/{quote(address)}.json",
        params={
            "key": TT_API_KEY
        }
    )

    data = response.json()

    # tomtom api doesn't always return the best result first, so look if exact address/place name shows up in results
    best_option_idx = -1
    i = 0
    for option in data["results"]:
        if option["type"] == "POI":
            if address.split(",")[0].lower() == option["poi"]["name"].lower() or address.split(",")[0].lower() == option["address"]["freeformAddress"].lower():
                best_option_idx = i
                break
            elif best_option_idx == -1 and (address.split(",")[0].lower() in option["poi"]["name"].lower() or address.split(",")[0].lower() in option["address"]["freeformAddress"].lower()):
                best_option_idx = i
        i += 1
    if best_option_idx == -1:
        best_option_idx = 0

    data = response.json()

    lat = data["results"][best_option_idx]["position"]["lat"]
    lon = data["results"][best_option_idx]["position"]["lon"]
    # ORS does longitude, latitude for some reason
    return [lon, lat]

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

def search_routes(search: RouteSearchRequest) -> list[RouteOption]:
    """Assumes searches are properly formatted addresses, which can be achieved with ORS autocomplete. Right now, this names routes
    'Route Option' unless it's the fastest route, which it calls 'Quickest'."""

    # Texas Capitol address: 1100 Congress Ave., Austin, TX 78701
    # UT Tower address: 110 Inner Campus Drive, Austin, TX 78705
    # Convention center: 500 E Cesar Chavez St, Austin, TX 78701

    # UT Tower, Austin, TX, USA
    # Texas State Capitol, Austin, TX, USA

    start = normalize_place_name(search.start)
    destination = normalize_place_name(search.destination)

    start_coordinates = get_coordinates(start)
    dest_coordinates = get_coordinates(destination)
    # print(start_coordinates, dest_coordinates)

    activity_type = "foot-walking" # or cycling-regular or cycling-road (?)  

    body = {
        "coordinates": [
            start_coordinates,
            dest_coordinates
        ],
        "alternative_routes": {
            "target_count": 3,
            "share_factor": 0.8,
            "weight_factor": 2
        },
        "options": {
            "avoid_polygons": {
                "type": "MultiPolygon",
                "coordinates": get_crime_polygons() + get_incident_polygons(start_coordinates, dest_coordinates)
            }
        }
    }


    response = requests.post(
        f"https://api.openrouteservice.org/v2/directions/{activity_type}/geojson",
        json=body,
        headers=routing_headers
    )
    data = response.json()
    # print(data)

    generated_routes = []
    # rectangular container of routes, so that we only request the traffic data we need
    # bbox = data["bbox"]
    for feature in data["features"]:
        coords = feature["geometry"]["coordinates"]
        miles = round(feature["properties"]["summary"]["distance"]/1609, 2) # dist given in meters
        minutes = int(feature["properties"]["summary"]["duration"]/60) # time given in seconds

        generated_routes.append({
            "coordinates": coords,
            "distance_miles": miles,
            "estimated_minutes": minutes,
            "id": "route",
            "name": "Route Option"
            # "bbox": bbox
        })
    route_superlatives = {
        "shortest": {
            "index": -1,
            "duration": 1000000
        }
    }
    for i in range(len(generated_routes)):
        route = generated_routes[i]
        if route["estimated_minutes"] < route_superlatives["shortest"]["duration"]:
            route_superlatives["shortest"]["index"] = i
            route_superlatives["shortest"]["duration"] = route["estimated_minutes"]
    generated_routes[route_superlatives["shortest"]["index"]]["id"] = "quickest"
    generated_routes[route_superlatives["shortest"]["index"]]["name"] = "Quickest"
    # print(generated_routes[-1])

    route_options: list[RouteOption] = []
    for route in generated_routes:
        score = 80 #calculate_safety_score(route)
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
                highlights=[],#route["highlights"],
            )
        )

    return sorted(route_options, key=lambda route: route.safety_score, reverse=True)
