from typing import Literal

from pydantic import BaseModel, Field


class RouteSearchRequest(BaseModel):
    start: str = Field(min_length=2, max_length=120)
    destination: str = Field(min_length=2, max_length=120)
    route_type: str = Field(default="walking", pattern="^(walking|biking)$")
    preferences_description: str = Field(default="", max_length=600)
    prefer_water: int = Field(default=0, ge=0, le=5)
    prefer_scenic: int = Field(default=0, ge=0, le=5)
    avoid_crowds: int = Field(default=0, ge=0, le=5)
    prefer_safety: int = Field(default=0, ge=0, le=5)


class SafetyBreakdown(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    traffic_score: int = Field(ge=0, le=100)
    incident_score: int = Field(ge=0, le=100)
    crime_score: int = Field(ge=0, le=100)
    water_proximity_score: int = Field(ge=0, le=100)
    crowding_score: int = Field(ge=0, le=100)
    signals: list[str] = Field(default_factory=list)


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
    safety_breakdown: SafetyBreakdown | None = None
    route_profile: str = "route"
    tradeoff_summary: str = ""
    preference_score: int = 0
    preference_summary: str = ""
    is_demo: bool = False


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
    safety_breakdown: SafetyBreakdown | None = None
    route_profile: str = "route"
    tradeoff_summary: str = ""
    preference_score: int = 0
    preference_summary: str = ""
    is_demo: bool = False


class RouteSummaryPublic(BaseModel):
    id: str
    name: str
    distance_miles: float
    estimated_minutes: int
    safety_score: float
    tags: list[str] = Field(default_factory=list)
    image_url: str | None = None
    safety_breakdown: SafetyBreakdown | None = None
    route_profile: str = "route"
    tradeoff_summary: str = ""
    preference_score: int = 0
    preference_summary: str = ""
    coordinates: list[list[float]] = Field(default_factory=list)
    is_demo: bool = False


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


class SavedRouteNotesUpdate(BaseModel):
    comments: str = Field(default="", max_length=500)
    tags: str = Field(default="", max_length=160)
