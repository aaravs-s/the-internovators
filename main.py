from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from api.router import api_router
from core.config import settings


def create_app(frontend_dist_dir: Path | None = None) -> FastAPI:
    settings.ensure_storage()
    frontend_dist = frontend_dist_dir or settings.frontend_dist_dir

    app = FastAPI(title=settings.app_name)
    app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
    app.mount("/maps", StaticFiles(directory=settings.maps_dir), name="maps")
    app.include_router(api_router, prefix="/api")

    assets_dir = frontend_dist / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def react_spa(full_path: str):
        if full_path == "api" or full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")

        requested_file = (frontend_dist / full_path).resolve()
        try:
            requested_file.relative_to(frontend_dist.resolve())
        except ValueError:
            raise HTTPException(status_code=404, detail="Not Found") from None

        if full_path and requested_file.is_file():
            return FileResponse(requested_file)

        index_file = frontend_dist / "index.html"
        if index_file.is_file():
            return FileResponse(index_file)
        return PlainTextResponse(
            "React frontend is not built. Run `npm run build --prefix frontend`.",
            status_code=503,
        )

    return app


app = create_app()
