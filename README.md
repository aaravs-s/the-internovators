# SafeWalkers  

SafeWalkers helps Austin residents, commuters, and visitors find safer and more
enjoyable walking routes to their destinations.

## Project shape

This is a lightweight React + FastAPI app for a 1-2 month prototype. React is
the primary website, FastAPI provides the JSON API and serves production builds,
and prototype storage remains in JSON files behind repository modules.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
npm ci --prefix frontend
npm run build --prefix frontend
fastapi dev main.py
```

Then open `http://127.0.0.1:8000`
a
For frontend hot reload, keep FastAPI running and start Vite in a second terminal:

```powershell
npm run dev --prefix frontend
```

Then open `http://127.0.0.1:5173`. Vite proxies API, map, and static requests to
FastAPI on port 8000.

## Important folders

- `main.py`: creates and launches the FastAPI app
- `frontend`: primary React website and Vite configuration
- `web`: unmounted legacy Jinja pages retained as migration reference
- `api`: JSON endpoints
- `services`: route planning, geocoding, safety scoring
- `repositories`: JSON storage access
- `schemas`: Pydantic validation models
- `templates`: legacy Jinja HTML pages
- `static`: shared and legacy static assets
- `data`: prototype JSON data
- `docs`: architecture and team notes

Passwords are still hashed before they are saved. That keeps the prototype
simple for the team while avoiding plain text passwords in `data/users.json`.
