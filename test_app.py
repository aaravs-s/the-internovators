import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from core.config import settings
from core.security import sign_user_id
from main import app, create_app
from services import route_planner


ROOT = Path(__file__).resolve().parent
COMMUNITY_ROUTE_ID = "bb15d07f-3109-43ea-a4d5-8649ed241574"
DIRECTIONS_ROUTE_ID = "80e295ca-ecf6-49a2-ba62-20ec287dbec1"


class RepositoryIntegrityTests(unittest.TestCase):
    def test_json_data_files_are_valid(self):
        for path in (ROOT / "data").glob("*.json"):
            with self.subTest(path=path.name):
                json.loads(path.read_text(encoding="utf-8"))

    def test_merge_markers_are_absent_from_conflicted_files(self):
        paths = [
            ROOT / ".gitignore",
            ROOT / "data" / "saved_routes.json",
            ROOT / "templates" / "partials" / "route_card.html",
            ROOT / "templates" / "route_detail.html",
        ]
        for path in paths:
            with self.subTest(path=path.relative_to(ROOT)):
                content = path.read_text(encoding="utf-8")
                self.assertNotIn("<<<<<<<", content)
                self.assertNotIn(">>>>>>>", content)


class RouteApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)

    def test_gallery_returns_both_merged_route_sets(self):
        response = self.client.get("/api/routes")

        self.assertEqual(response.status_code, 200)
        routes = response.json()
        route_ids = {route["id"] for route in routes}
        self.assertIn(COMMUNITY_ROUTE_ID, route_ids)
        self.assertIn(DIRECTIONS_ROUTE_ID, route_ids)
        self.assertTrue(all(0 <= route["safety_score"] <= 10 for route in routes))

    def test_direction_route_returns_typed_steps(self):
        response = self.client.get(f"/api/routes/{DIRECTIONS_ROUTE_ID}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertGreater(len(payload["directions"]), 2)
        self.assertEqual(payload["directions"][0]["kind"], "start")
        self.assertEqual(payload["directions"][-1]["kind"], "end")
        self.assertIn("instruction", payload["directions"][1])
        self.assertIn("distance_miles", payload["directions"][1])

    def test_legacy_route_without_directions_returns_empty_list(self):
        response = self.client.get(f"/api/routes/{COMMUNITY_ROUTE_ID}")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["directions"], [])

    def test_missing_route_returns_json_404(self):
        response = self.client.get("/api/routes/not-a-route")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json(), {"detail": "Route not found"})

    def test_hidden_route_is_visible_only_to_its_owner(self):
        hidden_route = {
            "id": "hidden-route",
            "route_id": "hidden-source",
            "user_id": "a3b21833-64b5-47d3-839b-d2f5a380141c",
            "name": "Hidden route",
            "start": "A",
            "destination": "B",
            "distance_miles": 1.0,
            "estimated_minutes": 20,
            "safety_score": 80,
            "is_shared": False,
            "liked_by": [],
            "ratings": [],
        }
        with tempfile.TemporaryDirectory() as directory:
            saved_routes_file = Path(directory) / "saved_routes.json"
            saved_routes_file.write_text(json.dumps([hidden_route]), encoding="utf-8")
            with patch.object(settings, "saved_routes_file", saved_routes_file):
                anonymous = self.client.get("/api/routes/hidden-route")
                owner_client = TestClient(
                    app,
                    cookies={
                        settings.session_cookie_name: sign_user_id(
                            hidden_route["user_id"]
                        )
                    },
                )
                owner = owner_client.get("/api/routes/hidden-route")

        self.assertEqual(anonymous.status_code, 404)
        self.assertEqual(owner.status_code, 200)


class SpaHostingTests(unittest.TestCase):
    def test_spa_deep_links_return_the_react_index(self):
        with tempfile.TemporaryDirectory() as directory:
            dist = Path(directory)
            (dist / "index.html").write_text("<main>React app</main>", encoding="utf-8")
            client = TestClient(create_app(dist), raise_server_exceptions=False)

            response = client.get("/explore")

            self.assertEqual(response.status_code, 200)
            self.assertIn("React app", response.text)

    def test_unknown_api_path_stays_a_json_404(self):
        with tempfile.TemporaryDirectory() as directory:
            dist = Path(directory)
            (dist / "index.html").write_text("<main>React app</main>", encoding="utf-8")
            client = TestClient(create_app(dist), raise_server_exceptions=False)

            response = client.get("/api/not-a-real-endpoint")

            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json(), {"detail": "Not Found"})


class RoutePlanningTests(unittest.TestCase):
    def test_missing_provider_directions_fall_back_to_an_empty_list(self):
        self.assertEqual(route_planner.extract_directions({"properties": {}}), [])


if __name__ == "__main__":
    unittest.main()
