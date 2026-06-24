from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse

from core.dependencies import get_current_user
from core.config import settings
from repositories import generated_routes_json, reports_json, saved_routes_json, users_json
from schemas.route import RouteDetailPublic, RouteOption, RouteSearchRequest, RouteSummaryPublic, SavedRouteCreate
from services.route_catalog import get_public_route, list_public_routes
from services.route_planner import search_routes
from services.autocomplete import autocomplete

from pydantic import ValidationError

import os
import json

router = APIRouter(prefix="/routes", tags=["routes"])

def route_owner(saved_route: dict) -> dict | None:
    return users_json.get_user_by_id(saved_route["user_id"])

def route_with_map_state(route: dict) -> dict:
    route = dict(route)
    filename = route.get("filename", "")
    route["map_available"] = bool(
        filename
        and filename == os.path.basename(filename)
        and (settings.maps_dir / filename).is_file()
    )
    return route


def route_with_owner(saved_route: dict, viewer_id: str | None = None) -> dict:
    route = route_with_map_state(
        saved_routes_json.route_with_social_fields(saved_route, viewer_id)
    )
    route["owner"] = route_owner(saved_route)
    return route

def get_route_record(route_id: str) -> tuple[dict | None, bool]:
    saved_route = saved_routes_json.get_saved_route(route_id)
    if saved_route:
        return route_with_owner(saved_route), True
    generated_route = generated_routes_json.get_generated_route(route_id)
    if generated_route:
        return route_with_map_state(generated_route), False
    return None, False

@router.get("", response_model=list[RouteSummaryPublic])
async def gallery_routes(
    request: Request,
    route_type: str = Query("all"),
    focus: str = Query("all"),
    sort: str = Query("recent"),
) -> list[RouteSummaryPublic]:
    user = get_current_user(request)
    return list_public_routes(
        route_type=(
            route_type if route_type in saved_routes_json.VALID_ROUTE_TYPES else "all"
        ),
        focus=(focus if focus in saved_routes_json.VALID_FOCUS_FILTERS else "all"),
        sort=(sort if sort in saved_routes_json.VALID_SORTS else "recent"),
        viewer_id=user.id if user else None,
    )


@router.post("/search", response_model=list[RouteOption])
async def search_route_options(search: RouteSearchRequest) -> list[RouteOption]:
    try:
        routes = search_routes(search)
        error = None
    except ValidationError:
        routes = []
        error = "Enter a valid start, destination, and route type."

    generated_routes_json.store_generated_routes(routes)

    return routes
    # return {
    #     "routes": routes,
    #     "start": search.start,
    #     "destination": search.destination,
    #     "route_type": search.route_type,
    #     "error": error,
    # }

@router.get("/autocomplete", response_model=dict)
async def autocomplete_route(q: str = Query(...)):
    return autocomplete(q)

@router.get("/get-saved", response_model=list[dict])
async def get_saved_routes(request: Request) -> RouteDetailPublic:
    user = get_current_user(request)
    routes = saved_routes_json.list_saved_routes()
    return [r for r in routes if user.id in r["user_id"]]

@router.post("/save-generated/{route_id}", response_model=RouteDetailPublic)
async def save_generated_route(request: Request, route_id: str) -> RouteDetailPublic:
    user = get_current_user(request)
    route = generated_routes_json.get_generated_route(route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    saved_routes_json.save_route_generated(SavedRouteCreate.model_validate(route), user.id)
    return route

@router.post("/save-shared/{route_id}", response_model=dict)
async def save_shared_route(request: Request, route_id: str) -> RouteDetailPublic:
    user = get_current_user(request)
    return saved_routes_json.save_route_shared(route_id, user.id)

@router.get("/results/{route_id}", response_model=RouteDetailPublic)
async def generated_route_detail(request: Request, route_id: str) -> RouteDetailPublic:
    route = generated_routes_json.get_generated_route(route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return route

@router.get("/{route_id}", response_model=RouteDetailPublic)
async def route_detail(request: Request, route_id: str) -> RouteDetailPublic:
    user = get_current_user(request)
    route = get_public_route(route_id, user.id if user else None)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return route