# SafeWalkers

SafeWalkers helps Austin residents, commuters, and visitors find safer and more
enjoyable walking routes to their destinations.

## Project shape

This is a lightweight FastAPI + Jinja app for a 1-2 month prototype. It uses
JSON files in `data/` for storage and keeps that storage behind repository
modules so the team can move to a database later if needed.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
fastapi dev main.py
```

Then open `http://127.0.0.1:8000`

## Important folders

- `main.py`: creates and launches the FastAPI app
- `web`: website pages and form handlers
- `api`: JSON endpoints
- `services`: route planning, geocoding, safety scoring
- `repositories`: JSON storage access
- `schemas`: Pydantic validation models
- `templates`: Jinja HTML pages
- `static`: CSS, JavaScript, and images
- `data`: prototype JSON data
- `docs`: architecture and team notes

Passwords are still hashed before they are saved. That keeps the prototype
simple for the team while avoiding plain text passwords in `data/users.json`.
