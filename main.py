from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from api.router import api_router
from core.config import settings
from web.pages import router as pages_router


def create_app() -> FastAPI:
    settings.ensure_storage()

    app = FastAPI(title=settings.app_name)
    app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
    app.include_router(pages_router)
    app.include_router(api_router, prefix="/api")
    return app


app = create_app()
