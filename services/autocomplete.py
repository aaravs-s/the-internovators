from urllib.parse import quote
import os
import requests


def _format_tomtom_suggestion(result: dict) -> dict | None:
    address = result.get("address", {})
    position = result.get("position", {})
    poi = result.get("poi", {})
    name = poi.get("name") or address.get("freeformAddress")
    freeform = address.get("freeformAddress")

    if not name or not freeform:
        return None

    label = name if name == freeform else f"{name}, {freeform}"
    return {
        "label": label,
        "address": freeform,
        "lat": position.get("lat"),
        "lon": position.get("lon"),
    }


def _tomtom_autocomplete(text: str) -> list[dict]:
    api_key = os.getenv("TT_API_KEY") or os.getenv("TOMTOM_API_KEY")
    if not api_key:
        return []

    response = requests.get(
        f"https://api.tomtom.com/search/2/search/{quote(text)}.json",
        params={
            "key": api_key,
            "limit": 6,
            "countrySet": "US",
            "lat": 30.2672,
            "lon": -97.7431,
            "radius": 50000,
        },
        timeout=8,
    )
    response.raise_for_status()
    suggestions = [
        suggestion
        for result in response.json().get("results", [])
        if (suggestion := _format_tomtom_suggestion(result))
    ]
    return suggestions


def _ors_autocomplete(text: str) -> list[dict]:
    api_key = os.getenv("ORS_API_KEY")
    if not api_key:
        return []

    response = requests.get(
        "https://api.openrouteservice.org/geocode/autocomplete",
        params={
            "api_key": api_key,
            "layers": "venue,address,locality",
            "text": text,
            "boundary.country": "USA",
            "focus.point.lat": 30.2672,
            "focus.point.lon": -97.7431,
            "size": 6,
        },
        timeout=8,
    )
    response.raise_for_status()
    return [
        {
            "label": feature.get("properties", {}).get("label", ""),
            "address": feature.get("properties", {}).get("name", ""),
            "lat": feature.get("geometry", {}).get("coordinates", [None, None])[1],
            "lon": feature.get("geometry", {}).get("coordinates", [None, None])[0],
        }
        for feature in response.json().get("features", [])
        if feature.get("properties", {}).get("label")
    ]


def autocomplete(text: str) -> list[dict]:
    query = text.strip()
    if len(query) < 3:
        return []

    try:
        suggestions = _tomtom_autocomplete(query)
        if suggestions:
            return suggestions
    except requests.RequestException:
        pass

    try:
        return _ors_autocomplete(query)
    except requests.RequestException:
        return []
