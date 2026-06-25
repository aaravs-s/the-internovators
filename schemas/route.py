from typing import Literal

from pydantic import BaseModel, Field


class RouteSearchRequest(BaseModel):
    start: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=2, max_length=120)
    route_type: str = Field(default="walking", pattern="^(walking|biking)$")


class RouteOption(BaseModel):
    id: str
    name: str
    start: str
    destination: str
    distance_miles: float
    estimated_minutes: int
    safety_score: int
    summary: str
    highlights: list[str] = Field(default_factory=list)
    route_type: str = "walking"
    map_style: str = "balanced"
    filename: str = ""
    directions: list[dict] = Field(default_factory=list)
    coordinates: list[list[float]] = Field(default_factory=list)


class SavedRouteCreate(BaseModel):
    id: str
    name: str
    start: str
    destination: str
    distance_miles: float
    estimated_minutes: int = 0
    safety_score: int
    summary: str = ""
    highlights: list[str] = Field(default_factory=list)
    route_type: str = "walking"
    map_style: str = "balanced"
    filename: str = ""
    directions: list[dict] = Field(default_factory=list)
    coordinates: list[list[float]] = Field(default_factory=list)


class RouteSummaryPublic(BaseModel):
    id: str
    name: str
    distance_miles: float
    estimated_minutes: int
    safety_score: float
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None


class DirectionStepPublic(BaseModel):
    instruction: str
    distance_miles: float
    kind: Literal["start", "step", "end"]


class RouteDetailPublic(RouteSummaryPublic):
    start: str
    destination: str
    summary: str = ""
    highlights: list[str] = Field(default_factory=list)
    directions: list[DirectionStepPublic] = Field(default_factory=list)
    coordinates: list[list[float]] = Field(default_factory=list)


class SavedRouteNotesUpdate(BaseModel):
    comments: str = Field(default="", max_length=500)
    tags: str = Field(default="", max_length=160)
