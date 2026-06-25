import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from core.config import load_env_file, settings
from core.security import sign_user_id
from main import app, create_app
from repositories import generated_routes_json, saved_routes_json
from schemas.route import RouteOption, RouteSearchRequest, SavedRouteCreate
from services.geocoding import normalize_place_name
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


class EnvironmentConfigTests(unittest.TestCase):
    def test_env_file_loads_tomtom_alias_without_overwriting_shell_values(self):
        with tempfile.TemporaryDirectory() as directory:
            env_file = Path(directory) / ".env"
            env_file.write_text(
                "TOMTOM_API_KEY=tomtom-from-file\n"
                "SAFEWALKERS_SECRET_KEY=file-secret\n",
                encoding="utf-8",
            )

            with patch.dict(
                os.environ,
                {"SAFEWALKERS_SECRET_KEY": "shell-secret"},
                clear=True,
            ):
                load_env_file(env_file)

                self.assertEqual(os.environ["TT_API_KEY"], "tomtom-from-file")
                self.assertEqual(os.environ["TOMTOM_API_KEY"], "tomtom-from-file")
                self.assertEqual(os.environ["SAFEWALKERS_SECRET_KEY"], "shell-secret")


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
        self.assertEqual(owner.json()["coordinates"], [])

    def test_generated_route_detail_returns_coordinates(self):
        generated_route = {
            "id": "coordinate-route",
            "name": "Coordinate Route",
            "start": "UT Austin, Austin, TX",
            "destination": "Austin Central Library, Austin, TX",
            "distance_miles": 1.8,
            "estimated_minutes": 35,
            "safety_score": 91,
            "summary": "Strong route.",
            "highlights": [],
            "route_type": "walking",
            "map_style": "balanced",
            "filename": "",
            "directions": [],
            "coordinates": [[-97.733, 30.286], [-97.745, 30.271]],
        }
        with tempfile.TemporaryDirectory() as directory:
            generated_routes_file = Path(directory) / "generated_routes.json"
            generated_routes_file.write_text(
                json.dumps([generated_route]),
                encoding="utf-8",
            )
            with patch.object(settings, "generated_routes_file", generated_routes_file):
                response = self.client.get("/api/routes/coordinate-route")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()["coordinates"],
            [[-97.733, 30.286], [-97.745, 30.271]],
        )


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

    def test_local_place_names_are_scoped_to_austin_tx(self):
        self.assertEqual(normalize_place_name("UT Austin"), "UT Austin, Austin, TX")
        self.assertEqual(
            normalize_place_name("Austin Central Library"),
            "Austin Central Library, Austin, TX",
        )
        self.assertEqual(
            normalize_place_name("1100 Congress Ave, Austin, TX"),
            "1100 Congress Ave, Austin, TX",
        )

    def test_tomtom_key_without_ors_key_generates_routes_from_tomtom(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "routes": [
                        {
                            "summary": {
                                "lengthInMeters": 1609,
                                "travelTimeInSeconds": 900,
                            },
                            "legs": [
                                {
                                    "points": [
                                        {"longitude": -97.742, "latitude": 30.274},
                                        {"longitude": -97.739, "latitude": 30.286},
                                    ]
                                }
                            ],
                            "guidance": {
                                "instructions": [
                                    {
                                        "message": "Head north on Congress Avenue",
                                        "routeOffsetInMeters": 200,
                                    }
                                ]
                            },
                        }
                    ]
                }

        search = RouteSearchRequest(
            start="Texas Capitol",
            destination="UT Tower",
            route_type="walking",
        )
        with (
            patch.object(route_planner, "ORS_API_KEY", None),
            patch.object(route_planner, "TT_API_KEY", "tomtom-key"),
            patch.object(route_planner, "get_coordinates") as get_coordinates,
            patch.object(route_planner.requests, "get", return_value=FakeResponse()),
            patch.object(route_planner, "calculate_safety_score", return_value=88),
            patch.object(route_planner, "generate_map_image", return_value="map_1.png"),
            patch.object(route_planner, "find_pois", return_value=[]),
        ):
            get_coordinates.side_effect = [
                [-97.742, 30.274],
                [-97.739, 30.286],
            ]

            routes = route_planner.search_routes(search)
            with tempfile.TemporaryDirectory() as directory:
                generated_routes_file = Path(directory) / "generated_routes.json"
                generated_routes_file.write_text("[]", encoding="utf-8")
                with patch.object(
                    settings, "generated_routes_file", generated_routes_file
                ):
                    stored_routes = generated_routes_json.store_generated_routes(routes)

        self.assertEqual(len(routes), 1)
        self.assertEqual(routes[0].name, "Quickest")
        self.assertEqual(routes[0].filename, "map_1.png")
        self.assertEqual(
            routes[0].coordinates,
            [[-97.742, 30.274], [-97.739, 30.286]],
        )
        self.assertEqual(routes[0].directions[0]["instruction"], "Head north on Congress Avenue")
        self.assertNotIn("well-lit", routes[0].name.lower())
        self.assertEqual(
            stored_routes[0]["coordinates"],
            [[-97.742, 30.274], [-97.739, 30.286]],
        )
        self.assertEqual(stored_routes[0]["directions"][0]["kind"], "step")

    def test_saved_generated_route_retains_coordinates(self):
        route = RouteOption(
            id="generated-with-coordinates",
            name="Generated With Coordinates",
            start="UT Austin, Austin, TX",
            destination="Austin Central Library, Austin, TX",
            distance_miles=1.8,
            estimated_minutes=35,
            safety_score=91,
            summary="Strong route.",
            coordinates=[[-97.733, 30.286], [-97.745, 30.271]],
        )

        with tempfile.TemporaryDirectory() as directory:
            saved_routes_file = Path(directory) / "saved_routes.json"
            saved_routes_file.write_text("[]", encoding="utf-8")
            with patch.object(settings, "saved_routes_file", saved_routes_file):
                saved_route = saved_routes_json.save_route_generated(
                    SavedRouteCreate.model_validate(route.model_dump()),
                    "user-1",
                )

        self.assertEqual(
            saved_route["coordinates"],
            [[-97.733, 30.286], [-97.745, 30.271]],
        )

    def test_failed_ors_request_falls_back_to_tomtom_before_samples(self):
        tomtom_route = RouteOption(
            id="tomtom-route",
            name="TomTom route",
            start="Texas Capitol, Austin, TX",
            destination="UT Tower, Austin, TX",
            distance_miles=2.0,
            estimated_minutes=30,
            safety_score=82,
            summary="TomTom fallback route.",
            route_type="walking",
        )
        search = RouteSearchRequest(
            start="Texas Capitol",
            destination="UT Tower",
            route_type="walking",
        )

        with (
            patch.object(route_planner, "ORS_API_KEY", "bad-ors-key"),
            patch.object(route_planner, "TT_API_KEY", "tomtom-key"),
            patch.object(route_planner, "get_coordinates") as get_coordinates,
            patch.object(route_planner, "get_crime_polygons", return_value=[]),
            patch.object(route_planner, "get_incident_polygons", return_value=[]),
            patch.object(
                route_planner.requests,
                "post",
                side_effect=route_planner.requests.RequestException("ORS failed"),
            ),
            patch.object(
                route_planner, "build_tomtom_routes", return_value=[tomtom_route]
            ),
        ):
            get_coordinates.side_effect = [
                [-97.742, 30.274],
                [-97.739, 30.286],
            ]

            routes = route_planner.search_routes(search)

        self.assertEqual(routes, [tomtom_route])


if __name__ == "__main__":
    unittest.main()
