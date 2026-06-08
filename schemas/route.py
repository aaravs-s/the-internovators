from pydantic import BaseModel, Field


class RouteSearchRequest(BaseModel):
    start: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=2, max_length=120)


class RouteOption(BaseModel):
    id: str
    name: str
    start: str
    destination: str
    distance_miles: float
    estimated_minutes: int
    safety_score: int
    summary: str
    highlights: list[str]


class SavedRouteCreate(BaseModel):
    route_id: str
    name: str
    start: str
    destination: str
    distance_miles: float
    safety_score: int

