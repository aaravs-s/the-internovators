# SafeWalkers Architecture

SafeWalkers is intentionally simple for the first 1-2 months: FastAPI renders
Jinja pages, JSON files store prototype data, and service modules isolate map
and safety logic from the web layer.

## Main boundaries

- `main.py` creates the FastAPI app, mounts static files, and registers routers.
- `web` owns server-rendered pages and form handling.
- `api` owns JSON endpoints for future frontend or map interactions.
- `services` owns routing, geocoding, and safety scoring decisions.
- `repositories` owns JSON file reads and writes.
- `schemas` owns validated request and response shapes.
- `templates` owns Jinja HTML files.
- `static` owns CSS, JavaScript, and images.

Route handlers should not open JSON files directly. They should call a service
or repository so the storage layer can be replaced later without rewriting the
whole app.

JSON is fine for this 1-2 month prototype, but passwords should not be stored
as plain text. The hashing logic is isolated in `core/security.py`, so the rest
of the app stays easy to read while `data/users.json` avoids raw passwords.
