from pathlib import Path
import os
import shutil
import tempfile


def load_env_file(path: Path) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("\"'")
        if key and key not in os.environ:
            os.environ[key] = value

    if "TT_API_KEY" not in os.environ and "TOMTOM_API_KEY" in os.environ:
        os.environ["TT_API_KEY"] = os.environ["TOMTOM_API_KEY"]
    if "TOMTOM_API_KEY" not in os.environ and "TT_API_KEY" in os.environ:
        os.environ["TOMTOM_API_KEY"] = os.environ["TT_API_KEY"]


ROOT_DIR = Path(__file__).resolve().parents[1]
load_env_file(ROOT_DIR / ".env")


class Settings:
    app_name = "SafeWalkers"
    session_cookie_name = "safewalkers_session"
    secret_key = os.getenv("SAFEWALKERS_SECRET_KEY", "dev-only-change-me")

    root_dir = ROOT_DIR
    source_data_dir = root_dir / "data"
    data_dir = (
        Path(tempfile.gettempdir()) / "safewalkers-data"
        if os.getenv("VERCEL")
        else source_data_dir
    )
    templates_dir = root_dir / "templates"
    static_dir = root_dir / "static"
    frontend_dist_dir = root_dir / "frontend" / "dist"
    maps_dir = (
        Path(tempfile.gettempdir()) / "safewalkers-maps"
        if os.getenv("VERCEL")
        else root_dir / "maps"
    )

    users_file = data_dir / "users.json"
    reports_file = data_dir / "reports.json"
    saved_routes_file = data_dir / "saved_routes.json"
    generated_routes_file = data_dir / "generated_routes.json"
    sample_routes_file = data_dir / "sample_routes.json"

    def ensure_storage(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.maps_dir.mkdir(parents=True, exist_ok=True)
        for path in [
            self.users_file,
            self.reports_file,
            self.saved_routes_file,
            self.generated_routes_file,
            self.sample_routes_file,
        ]:
            if not path.exists():
                source_path = self.source_data_dir / path.name
                if source_path.exists():
                    shutil.copyfile(source_path, path)
                else:
                    path.write_text("[]\n", encoding="utf-8")


settings = Settings()
