def calculate_safety_score(route: dict) -> int:
    base_score = int(route.get("base_safety_score", 75))
    lighting_bonus = 6 if route.get("well_lit") else 0
    sidewalk_bonus = 7 if route.get("sidewalk_heavy") else 0
    crossing_penalty = int(route.get("busy_crossings", 0)) * 3

    score = base_score + lighting_bonus + sidewalk_bonus - crossing_penalty
    return max(1, min(100, score))


def describe_score(score: int) -> str:
    if score >= 85:
        return "Strong sidewalk coverage and comfortable walking conditions."
    if score >= 70:
        return "Generally walkable with a few areas to watch."
    return "Usable route, but review the safety notes before walking."

