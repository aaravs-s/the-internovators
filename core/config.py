from pathlib import Path
import os


class Settings:
    app_name = "SafeWalkers"
    session_cookie_name = "safewalkers_session"
    secret_key = os.getenv("SAFEWALKERS_SECRET_KEY", "dev-only-change-me")

    root_dir = Path(__file__).resolve().parents[1]
    data_dir = root_dir / "data"
    templates_dir = root_dir / "templates"
    static_dir = root_dir / "static"

    users_file = data_dir / "users.json"
    reports_file = data_dir / "reports.json"
    saved_routes_file = data_dir / "saved_routes.json"
    sample_routes_file = data_dir / "sample_routes.json"

    def ensure_storage(self) -> None:
        self.data_dir.mkdir(parents=True, exist_ok=True)
        for path in [
            self.users_file,
            self.reports_file,
            self.saved_routes_file,
            self.sample_routes_file,
        ]:
            if not path.exists():
                path.write_text("[]\n", encoding="utf-8")


settings = Settings()
