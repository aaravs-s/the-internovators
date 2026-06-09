from core.config import settings
from repositories.json_store import read_list
from schemas.route import RouteOption, RouteSearchRequest
from services.geocoding import normalize_place_name
from services.safety_scoring import calculate_safety_score, describe_score
import requests
import os

ORS_API_KEY = os.getenv("ORS_API_KEY")

url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"

routing_headers = {
    "Authorization": ORS_API_KEY,
    "Content-Type": "application/json"
}

def get_coordinates (address):
    response = requests.get(
        "https://api.openrouteservice.org/geocode/search",
        headers={
            "Authorization": ORS_API_KEY
        },
        params={
            "text": address,
            "size": 1  # return only the best match
        }
    )

    # ORS does longitude, latitude for some reason
    lon, lat = response.json()["features"][0]["geometry"]["coordinates"]
    return [lon, lat]

def search_routes(search: RouteSearchRequest) -> list[RouteOption]:
    """Assumes searches are properly formatted addresses, which can be achieved with ORS autocomplete. Right now, this names routes
    'Route Option' unless it's the fastest route, which it calls 'Quickest'."""

    # Texas Capitol address: 1100 Congress Ave., Austin, TX 78701
    # UT Tower address: 110 Inner Campus Drive, Austin, TX 78705

    start = normalize_place_name(search.start)
    destination = normalize_place_name(search.destination)

    start_coordinates = get_coordinates(start)
    dest_coordinates = get_coordinates(destination)

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
        }
    }

    response = requests.post(
        f"https://api.openrouteservice.org/v2/directions/{activity_type}/geojson",
        json=body,
        headers=routing_headers
    )
    data = response.json()

    generated_routes = []
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

    print(generated_routes)
    

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
    print(route_options)

    return sorted(route_options, key=lambda route: route.safety_score, reverse=True)
