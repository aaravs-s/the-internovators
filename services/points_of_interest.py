import os
import requests

ORS_API_KEY = os.getenv("ORS_API_KEY")

def find_pois (route):

    headers = {
        "Authorization": ORS_API_KEY,
        "Content-Type": "application/json"
    }

    body = {
        "request": "pois",
        "geometry": {
            "geojson": {
                "type": "LineString",
                "coordinates": route["coordinates"]
            },
            "buffer": 50  # meters on either side of route
        },
        "filters": {
            # museums, parks, boutiques, restaurants, attractions
            # see https://github.com/GIScience/openpoiservice/blob/main/openpoiservice/server/categories/categories.yml for all categories (max 5)
            "category_ids": [134, 280, 431, 570, 622] 
        },
        "limit": 10
    }

    response = requests.post(
        "https://api.openrouteservice.org/pois",
        json=body,
        headers=headers
    )

    data = response.json()

    if "features" not in data:
        return []
    
    pois = []
    for feature in data["features"]:
        if "osm_tags" in feature["properties"] and "name" in feature["properties"]["osm_tags"]:
            pois.append(feature["properties"]["osm_tags"]["name"])

    return pois