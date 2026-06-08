from fastapi import APIRouter

from api import auth, health, reports, routes

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(routes.router)
api_router.include_router(reports.router)
