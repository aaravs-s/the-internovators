from fastapi import APIRouter, HTTPException, Query, Request

from core.dependencies import get_current_user
from repositories import saved_routes_json
from schemas.route import (
    RouteDetailPublic,
    RouteOption,
    RouteSearchRequest,
    RouteSummaryPublic,
)
from services.route_catalog import get_public_route, list_public_routes
from services.route_planner import search_routes

router = APIRouter(prefix="/routes", tags=["routes"])


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
    return search_routes(search)


@router.get("/{route_id}", response_model=RouteDetailPublic)
async def route_detail(request: Request, route_id: str) -> RouteDetailPublic:
    user = get_current_user(request)
    route = get_public_route(route_id, user.id if user else None)
    if route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return route
