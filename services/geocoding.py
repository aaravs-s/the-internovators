def normalize_place_name(place_name: str) -> str:
    cleaned = " ".join(place_name.strip().split())
    if "austin" in cleaned.lower():
        return cleaned
    return f"{cleaned}, Austin, TX"


def suggest_places(query: str) -> list[str]:
    if len(query.strip()) < 2:
        return []

    normalized = normalize_place_name(query)
    common_destinations = [
        "UT Austin, Austin, TX",
        "Texas Capitol, Austin, TX",
        "Austin Central Library, Austin, TX",
        "Zilker Park, Austin, TX",
        "Republic Square, Austin, TX",
    ]
    matches = [
        destination
        for destination in common_destinations
        if query.lower() in destination.lower()
    ]
    return matches or [normalized]

