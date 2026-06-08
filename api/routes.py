from fastapi import APIRouter

from schemas.route import RouteOption, RouteSearchRequest
from services.route_planner import search_routes

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post("/search", response_model=list[RouteOption])
async def search_route_options(search: RouteSearchRequest) -> list[RouteOption]:
    return search_routes(search)
