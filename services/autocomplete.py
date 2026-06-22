import os
import requests

def autocomplete(text):
    response = requests.get(
        "https://api.openrouteservice.org/geocode/autocomplete",
        params={
            "api_key": os.getenv("ORS_API_KEY"),
            "layers": "venue,address,locality",
            "text": text,
        },
    )
    return response.json()