import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient
from shapely.geometry import Polygon

from core.config import load_env_file, settings
from core.security import sign_user_id
from main import app, create_app
from repositories import generated_routes_json, saved_routes_json
from schemas.route import RouteOption, RouteSearchRequest, SavedRouteCreate
from services.geocoding import normalize_place_name
from services import autocomplete, route_planner, safety_scoring


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


class AuthApiTests(unittest.TestCase):
    def test_signup_authenticates_without_exposing_the_user_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            users_file = Path(directory) / "users.json"
            users_file.write_text("[]", encoding="utf-8")
            with patch.object(settings, "users_file", users_file):
                client = TestClient(app, raise_server_exceptions=False)
                response = client.post(
                    "/api/auth/signup",
                    json={
                        "username": "new-walker",
                        "email": "walker@example.com",
                        "password": "secure-password",
                    },
                )

                self.assertEqual(response.status_code, 200)
                self.assertIn(settings.session_cookie_name, response.cookies)
                self.assertEqual(client.get("/api/auth/me").status_code, 200)
                self.assertEqual(
                    client.get("/api/auth/get-other-users").status_code,
                    404,
                )
                self.assertEqual(
                    client.get(
                        "/api/auth/other-user",
                        params={"id": response.json()["id"]},
                    ).status_code,
                    404,
                )


class RouteApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app, raise_server_exceptions=False)

    def setUp(self):
        self.routes_directory = tempfile.TemporaryDirectory()
        self.saved_routes_file = Path(self.routes_directory.name) / "saved_routes.json"
        self.saved_routes_file.write_text(
            json.dumps(
                [
                    {
                        "id": COMMUNITY_ROUTE_ID,
                        "route_id": "legacy-source",
                        "user_id": ["fixture-owner"],
                        "name": "Legacy community route",
                        "start": "A",
                        "destination": "B",
                        "distance_miles": 1.0,
                        "estimated_minutes": 20,
                        "safety_score": 88,
                        "coordinates": [[-97.742, 30.274], [-97.739, 30.286]],
                        "is_demo": True,
                        "is_shared": True,
                        "liked_by": [],
                        "ratings": [],
                    },
                    {
                        "id": DIRECTIONS_ROUTE_ID,
                        "route_id": "directions-source",
                        "user_id": ["fixture-owner"],
                        "name": "Route with directions",
                        "start": "A",
                        "destination": "B",
                        "distance_miles": 1.5,
                        "estimated_minutes": 30,
                        "safety_score": 8.9,
                        "directions": [
                            {"instruction": "Head north", "distance": 100},
                            {"instruction": "Turn right", "distance": 250},
                        ],
                        "is_shared": True,
                        "liked_by": [],
                        "ratings": [],
                    },
                ]
            ),
            encoding="utf-8",
        )
        self.saved_routes_patch = patch.object(
            settings,
            "saved_routes_file",
            self.saved_routes_file,
        )
        self.saved_routes_patch.start()

    def tearDown(self):
        self.saved_routes_patch.stop()
        self.routes_directory.cleanup()

    def test_gallery_returns_both_merged_route_sets(self):
        response = self.client.get("/api/routes")

        self.assertEqual(response.status_code, 200)
        routes = response.json()
        route_ids = {route["id"] for route in routes}
        self.assertIn(COMMUNITY_ROUTE_ID, route_ids)
        self.assertIn(DIRECTIONS_ROUTE_ID, route_ids)
        self.assertTrue(all(0 <= route["safety_score"] <= 100 for route in routes))
        demo_route = next(route for route in routes if route["id"] == COMMUNITY_ROUTE_ID)
        self.assertEqual(
            demo_route.get("coordinates"),
            [[-97.742, 30.274], [-97.739, 30.286]],
        )
        self.assertTrue(demo_route.get("is_demo", False))

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
                results_response = self.client.get(
                    "/api/routes/results/coordinate-route"
                )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(results_response.status_code, 200)
        self.assertEqual(
            response.json()["coordinates"],
            [[-97.733, 30.286], [-97.745, 30.271]],
        )
        self.assertEqual(
            results_response.json()["coordinates"],
            [[-97.733, 30.286], [-97.745, 30.271]],
        )

    def test_search_response_uses_the_normalized_stored_route(self):
        generated_route = RouteOption(
            id="normalized-route",
            name="Normalized route",
            start="UT Austin",
            destination="Texas Capitol",
            distance_miles=1.0,
            estimated_minutes=20,
            safety_score=90,
            summary="Good route",
            directions=[
                {
                    "instruction": "Head north",
                    "distance": 1609,
                    "type": 0,
                }
            ],
            coordinates=[[-97.733, 30.286], [-97.745, 30.271]],
        )
        with tempfile.TemporaryDirectory() as directory:
            generated_routes_file = Path(directory) / "generated_routes.json"
            generated_routes_file.write_text("[]", encoding="utf-8")
            with (
                patch.object(settings, "generated_routes_file", generated_routes_file),
                patch("api.routes.search_routes", return_value=[generated_route]),
            ):
                response = self.client.post(
                    "/api/routes/search",
                    json={
                        "start": "UT Austin",
                        "destination": "Texas Capitol",
                        "route_type": "walking",
                    },
                )

        self.assertEqual(response.status_code, 200)
        direction = response.json()[0]["directions"][0]
        self.assertIn("kind", direction)
        self.assertIn("distance_miles", direction)
        self.assertEqual(direction["kind"], "step")
        self.assertAlmostEqual(direction["distance_miles"], 1.0, places=2)


class CommunityApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        root = Path(self.directory.name)
        self.users_file = root / "users.json"
        self.saved_routes_file = root / "saved_routes.json"
        self.follows_file = root / "follows.json"
        self.route_comments_file = root / "route_comments.json"
        self.users = [
            {
                "id": "walker-one",
                "username": "walkerone",
                "email": "one@example.com",
                "password_hash": "secret-one",
                "bio": "Morning walker",
                "picture_url": "",
                "is_verified": True,
                "created_at": "2026-01-01T00:00:00+00:00",
            },
            {
                "id": "walker-two",
                "username": "walkertwo",
                "email": "two@example.com",
                "password_hash": "secret-two",
                "bio": "Night walker",
                "picture_url": "",
                "is_verified": True,
                "created_at": "2026-01-02T00:00:00+00:00",
            },
            {
                "id": "walker-three",
                "username": "thirdwalker",
                "email": "three@example.com",
                "password_hash": "secret-three",
                "bio": "Trail walker",
                "picture_url": "",
                "is_verified": True,
                "created_at": "2026-01-03T00:00:00+00:00",
            },
        ]
        self.routes = [
            {
                "id": "shared-route",
                "route_id": "shared-source",
                "user_id": "walker-two",
                "name": "Capitol Loop",
                "start": "A",
                "destination": "B",
                "distance_miles": 2.4,
                "estimated_minutes": 42,
                "safety_score": 89,
                "coordinates": [[-97.742, 30.274], [-97.739, 30.286]],
                "is_demo": True,
                "summary": "A bright downtown loop.",
                "tags": ["lit"],
                "is_shared": True,
                "liked_by": [],
                "ratings": [],
                "created_at": "2026-02-01T00:00:00+00:00",
            },
            {
                "id": "hidden-route",
                "route_id": "hidden-source",
                "user_id": "walker-two",
                "name": "Private Loop",
                "start": "A",
                "destination": "C",
                "distance_miles": 1.0,
                "estimated_minutes": 20,
                "safety_score": 75,
                "summary": "Private.",
                "tags": [],
                "is_shared": False,
                "liked_by": [],
                "ratings": [],
                "created_at": "2026-02-02T00:00:00+00:00",
            },
        ]
        self.users_file.write_text(json.dumps(self.users), encoding="utf-8")
        self.saved_routes_file.write_text(json.dumps(self.routes), encoding="utf-8")
        self.follows_file.write_text("[]", encoding="utf-8")
        self.route_comments_file.write_text("[]", encoding="utf-8")
        self.patchers = [
            patch.object(settings, "users_file", self.users_file),
            patch.object(settings, "saved_routes_file", self.saved_routes_file),
            patch.object(settings, "follows_file", self.follows_file, create=True),
            patch.object(
                settings,
                "route_comments_file",
                self.route_comments_file,
                create=True,
            ),
        ]
        for patcher in self.patchers:
            patcher.start()
        self.client = TestClient(app, raise_server_exceptions=False)

    def tearDown(self):
        for patcher in reversed(self.patchers):
            patcher.stop()
        self.directory.cleanup()

    def authenticated_client(self, user_id: str) -> TestClient:
        return TestClient(
            app,
            raise_server_exceptions=False,
            cookies={settings.session_cookie_name: sign_user_id(user_id)},
        )

    def test_follow_is_idempotent_and_filters_activity_feed(self):
        client = self.authenticated_client("walker-one")

        first = client.put("/api/community/follows/walker-two")
        second = client.put("/api/community/follows/walker-two")
        feed = client.get("/api/community/feed?scope=following")

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertTrue(second.json()["is_following"])
        self.assertEqual(len(json.loads(self.follows_file.read_text())), 1)
        self.assertEqual(feed.status_code, 200)
        self.assertEqual([route["id"] for route in feed.json()], ["shared-route"])
        owner = feed.json()[0]["owner"]
        self.assertEqual(owner["username"], "walkertwo")
        self.assertNotIn("email", owner)
        self.assertNotIn("password_hash", owner)
        self.assertEqual(
            feed.json()[0].get("coordinates"),
            [[-97.742, 30.274], [-97.739, 30.286]],
        )
        self.assertTrue(feed.json()[0].get("is_demo", False))

    def test_self_follow_is_rejected_and_user_search_is_public_only(self):
        client = self.authenticated_client("walker-one")

        self_follow = client.put("/api/community/follows/walker-one")
        search = client.get("/api/community/users?view=discover&query=night")

        self.assertEqual(self_follow.status_code, 400)
        self.assertEqual([user["id"] for user in search.json()], ["walker-two"])
        self.assertNotIn("email", search.json()[0])

    def test_like_put_and_delete_are_idempotent(self):
        client = self.authenticated_client("walker-one")

        client.put("/api/community/routes/shared-route/like")
        liked_twice = client.put("/api/community/routes/shared-route/like")
        client.delete("/api/community/routes/shared-route/like")
        unliked_twice = client.delete("/api/community/routes/shared-route/like")

        self.assertEqual(liked_twice.status_code, 200)
        self.assertEqual(liked_twice.json()["like_count"], 1)
        self.assertTrue(liked_twice.json()["is_liked"])
        self.assertEqual(unliked_twice.status_code, 200)
        self.assertEqual(unliked_twice.json()["like_count"], 0)
        self.assertFalse(unliked_twice.json()["is_liked"])

    def test_comments_support_one_reply_level_and_route_owner_deletion(self):
        commenter = self.authenticated_client("walker-one")
        replier = self.authenticated_client("walker-three")
        owner = self.authenticated_client("walker-two")

        created = commenter.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "  Well lit after sunset.  "},
        )
        self.assertEqual(created.status_code, 201)
        parent_id = created.json()["id"]
        reply = replier.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "Thanks for the tip!", "parent_id": parent_id},
        )
        nested = commenter.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "Nested", "parent_id": reply.json()["id"]},
        )
        discussion = commenter.get(
            "/api/community/routes/shared-route/comments"
        )
        deleted = owner.delete(f"/api/community/comments/{parent_id}")

        self.assertEqual(created.json()["body"], "Well lit after sunset.")
        self.assertEqual(reply.status_code, 201)
        self.assertEqual(nested.status_code, 400)
        self.assertEqual(len(discussion.json()), 1)
        self.assertEqual(len(discussion.json()[0]["replies"]), 1)
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(json.loads(self.route_comments_file.read_text()), [])

    def test_hidden_routes_reject_social_interactions(self):
        client = self.authenticated_client("walker-one")

        like = client.put("/api/community/routes/hidden-route/like")
        comment = client.post(
            "/api/community/routes/hidden-route/comments",
            json={"body": "I should not see this."},
        )
        discussion = client.get("/api/community/routes/hidden-route/comments")

        self.assertEqual(like.status_code, 404)
        self.assertEqual(comment.status_code, 404)
        self.assertEqual(discussion.status_code, 404)

    def test_social_writes_require_authentication(self):
        follow = self.client.put("/api/community/follows/walker-two")
        like = self.client.put("/api/community/routes/shared-route/like")
        comment = self.client.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "Hello"},
        )

        self.assertEqual(follow.status_code, 401)
        self.assertEqual(like.status_code, 401)
        self.assertEqual(comment.status_code, 401)

    def test_legacy_user_id_lists_use_the_canonical_first_owner(self):
        routes = json.loads(self.saved_routes_file.read_text())
        routes[0]["user_id"] = ["walker-two", "walker-three"]
        self.saved_routes_file.write_text(json.dumps(routes), encoding="utf-8")
        client = self.authenticated_client("walker-one")
        client.put("/api/community/follows/walker-two")

        feed = client.get("/api/community/feed?scope=following")
        profile = client.get("/api/community/users/walker-two")

        self.assertEqual(feed.status_code, 200)
        self.assertEqual(feed.json()[0]["owner"]["id"], "walker-two")
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(profile.json()["shared_route_count"], 1)

    def test_comment_validation_and_delete_permissions(self):
        author = self.authenticated_client("walker-one")
        outsider = self.authenticated_client("walker-three")
        blank = author.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "   "},
        )
        created = author.post(
            "/api/community/routes/shared-route/comments",
            json={"body": "Useful context"},
        )

        forbidden = outsider.delete(
            f"/api/community/comments/{created.json()['id']}"
        )
        still_present = author.get(
            "/api/community/routes/shared-route/comments"
        )

        self.assertEqual(blank.status_code, 422)
        self.assertEqual(forbidden.status_code, 403)
        self.assertEqual(len(still_present.json()), 1)


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
    def test_sample_routes_have_fixed_real_geometry_and_demo_metadata(self):
        with patch.object(
            route_planner,
            "calculate_safety_breakdown",
            return_value={
                "overall_score": 1,
                "traffic_score": 1,
                "incident_score": 1,
                "crime_score": 1,
                "water_proximity_score": 1,
                "crowding_score": 1,
                "signals": [],
            },
        ) as calculate_safety_breakdown:
            routes = route_planner.build_sample_routes(
                RouteSearchRequest(
                    start="Somewhere else",
                    destination="Another place",
                    route_type="walking",
                )
            )

        calculate_safety_breakdown.assert_not_called()

        self.assertEqual(len(routes), 4)
        self.assertEqual({route.start for route in routes}, {"UT Tower, Austin, TX"})
        self.assertEqual(
            {route.destination for route in routes},
            {"Austin Central Library, Austin, TX"},
        )
        self.assertTrue(all(getattr(route, "is_demo", False) for route in routes))
        self.assertTrue(all(len(route.coordinates) >= 2 for route in routes))
        self.assertEqual(
            len({tuple(map(tuple, route.coordinates)) for route in routes}),
            4,
        )

    def test_ors_key_without_tomtom_key_uses_live_routes_before_samples(self):
        ors_route = RouteOption(
            id="ors-route",
            name="ORS route",
            start="Texas Capitol, Austin, TX",
            destination="UT Tower, Austin, TX",
            distance_miles=1.2,
            estimated_minutes=24,
            safety_score=87,
            summary="Live ORS route.",
            coordinates=[[-97.742, 30.274], [-97.739, 30.286]],
        )
        search = RouteSearchRequest(
            start="Texas Capitol",
            destination="UT Tower",
            route_type="walking",
        )

        with (
            patch.object(route_planner, "TT_API_KEY", None),
            patch.object(route_planner, "ORS_API_KEY", "ors-key"),
            patch.object(
                route_planner,
                "get_coordinates",
                side_effect=[[-97.742, 30.274], [-97.739, 30.286]],
            ) as get_coordinates,
            patch.object(route_planner, "get_crime_polygons", return_value=[]),
            patch.object(route_planner, "get_incident_polygons", return_value=[]),
            patch.object(
                route_planner,
                "ors_profile_candidates",
                return_value=[
                    {
                        "coordinates": [[-97.742, 30.274], [-97.739, 30.286]],
                        "distance_miles": 1.2,
                        "estimated_minutes": 24,
                        "route_profile": "quickest",
                        "directions": [],
                    }
                ],
            ),
            patch.object(
                route_planner,
                "finalize_route_options",
                return_value=[ors_route],
            ),
        ):
            routes = route_planner.search_routes(search)

        self.assertEqual(routes, [ors_route])
        self.assertEqual(get_coordinates.call_count, 2)

    def test_incidents_lower_incident_score(self):
        with patch.object(
            safety_scoring,
            "fetch_incidents",
            return_value=[
                {
                    "properties": {
                        "iconCategory": "Accident",
                        "magnitudeOfDelay": 3,
                        "delay": 600,
                    }
                }
            ],
        ):
            score, signals = safety_scoring.calculate_incident_score(
                {"coordinates": [[-97.742, 30.274], [-97.739, 30.286]]}
            )

        self.assertLess(score, 100)
        self.assertIn("1 current traffic incident nearby", signals)

    def test_crime_polygon_intersection_lowers_crime_score(self):
        crime_polygon = Polygon(
            [
                (-97.7425, 30.2735),
                (-97.7415, 30.2735),
                (-97.7415, 30.2745),
                (-97.7425, 30.2745),
            ]
        )

        with patch.object(
            safety_scoring, "load_crime_polygons", return_value=[crime_polygon]
        ):
            score, signals = safety_scoring.calculate_crime_score(
                {"coordinates": [[-97.743, 30.274], [-97.741, 30.274]]}
            )

        self.assertLess(score, 100)
        self.assertIn("crosses", signals[0])

    def test_poi_context_improves_water_score_and_lowers_crowding_score(self):
        pois = {
            "park": {"name": "Shoal Creek Trail", "categories": ["park", "trail"]},
            "water": {"name": "Lady Bird Lake", "categories": ["lake"]},
            "bar": {"name": "Busy Bar", "categories": ["nightlife", "bar"]},
            "bus": {"name": "Bus Stop", "categories": ["public transport stop"]},
        }

        with (
            patch.object(safety_scoring, "TT_API_KEY", "tomtom-key"),
            patch.object(safety_scoring, "collect_route_pois", return_value=(pois, False)),
        ):
            water_score, crowding_score, signals = safety_scoring.calculate_environment_scores(
                [safety_scoring.LineString([[-97.743, 30.274], [-97.741, 30.274]]).interpolate(0)]
            )

        self.assertGreater(water_score, 55)
        self.assertLess(crowding_score, 95)
        self.assertTrue(any("park, trail" in signal for signal in signals))

    def test_missing_tomtom_key_returns_partial_fallback_breakdown(self):
        route = {"coordinates": [[-97.743, 30.274], [-97.741, 30.274]]}

        with (
            patch.object(safety_scoring, "TT_API_KEY", None),
            patch.object(safety_scoring, "load_crime_polygons", return_value=[]),
        ):
            breakdown = safety_scoring.calculate_safety_breakdown(route)

        self.assertEqual(breakdown["traffic_score"], 75)
        self.assertEqual(breakdown["incident_score"], 80)
        self.assertEqual(breakdown["water_proximity_score"], 70)
        self.assertIn("Traffic data unavailable", breakdown["signals"])

    def test_tomtom_autocomplete_returns_normalized_suggestions(self):
        class FakeResponse:
            def raise_for_status(self):
                return None

            def json(self):
                return {
                    "results": [
                        {
                            "poi": {"name": "Austin Central Library"},
                            "address": {
                                "freeformAddress": "710 W Cesar Chavez St, Austin, TX"
                            },
                            "position": {"lat": 30.2653, "lon": -97.7518},
                        }
                    ]
                }

        with (
            patch.dict(os.environ, {"TT_API_KEY": "tomtom-key"}, clear=True),
            patch.object(autocomplete.requests, "get", return_value=FakeResponse()),
        ):
            suggestions = autocomplete.autocomplete("central library")

        self.assertEqual(
            suggestions,
            [
                {
                    "label": "Austin Central Library, 710 W Cesar Chavez St, Austin, TX",
                    "address": "710 W Cesar Chavez St, Austin, TX",
                    "lat": 30.2653,
                    "lon": -97.7518,
                }
            ],
        )

    def test_missing_provider_directions_fall_back_to_an_empty_list(self):
        self.assertEqual(route_planner.extract_directions({"properties": {}}), [])

    def test_overlapping_route_candidates_are_deduplicated(self):
        candidates = [
            {
                "route_profile": "quickest",
                "coordinates": [[0, 0], [0.01, 0.01]],
                "distance_miles": 1.0,
                "estimated_minutes": 10,
                "safety_score": 80,
            },
            {
                "route_profile": "balanced",
                "coordinates": [[0, 0], [0.0101, 0.0101]],
                "distance_miles": 1.05,
                "estimated_minutes": 11,
                "safety_score": 82,
            },
            {
                "route_profile": "scenic",
                "coordinates": [[0, 0], [0.0, 0.01], [0.01, 0.01]],
                "distance_miles": 1.2,
                "estimated_minutes": 12,
                "safety_score": 84,
            },
        ]

        selected = route_planner.distinct_route_candidates(candidates)

        self.assertEqual(
            [route["route_profile"] for route in selected],
            ["quickest", "scenic"],
        )

    def test_four_unique_route_candidates_are_returned_when_available(self):
        candidates = [
            {
                "route_profile": "quickest",
                "coordinates": [[0, 0], [0.01, 0]],
                "distance_miles": 1.0,
                "estimated_minutes": 10,
                "safety_score": 80,
            },
            {
                "route_profile": "safest",
                "coordinates": [[0, 0], [0, 0.01], [0.01, 0.01]],
                "distance_miles": 1.4,
                "estimated_minutes": 14,
                "safety_score": 90,
            },
            {
                "route_profile": "scenic",
                "coordinates": [[0, 0], [-0.01, 0], [-0.01, 0.01]],
                "distance_miles": 1.5,
                "estimated_minutes": 15,
                "safety_score": 88,
            },
            {
                "route_profile": "quiet",
                "coordinates": [[0, 0], [0, -0.01], [0.01, -0.01]],
                "distance_miles": 1.3,
                "estimated_minutes": 13,
                "safety_score": 86,
            },
        ]

        selected = route_planner.distinct_route_candidates(candidates)

        self.assertGreaterEqual(len(selected), 4)

    def test_detour_over_limit_is_rejected_when_enough_routes_exist(self):
        candidates = [
            {
                "route_profile": "quickest",
                "coordinates": [[0, 0], [0.01, 0]],
                "distance_miles": 1.0,
                "estimated_minutes": 10,
                "safety_score": 80,
            },
            {
                "route_profile": "safest",
                "coordinates": [[0, 0], [0.0, 0.01], [0.01, 0.01]],
                "distance_miles": 1.2,
                "estimated_minutes": 12,
                "safety_score": 90,
            },
            {
                "route_profile": "quiet",
                "coordinates": [[0, 0], [0.0, -0.01], [0.01, -0.01]],
                "distance_miles": 1.1,
                "estimated_minutes": 11,
                "safety_score": 88,
            },
            {
                "route_profile": "balanced",
                "coordinates": [[0, 0], [0.01, -0.005], [0.02, -0.005]],
                "distance_miles": 1.15,
                "estimated_minutes": 12,
                "safety_score": 86,
            },
            {
                "route_profile": "scenic",
                "coordinates": [[0, 0], [-0.01, 0], [-0.01, 0.01]],
                "distance_miles": 2.0,
                "estimated_minutes": 25,
                "safety_score": 95,
            },
        ]

        selected = route_planner.distinct_route_candidates(candidates)

        self.assertNotIn("scenic", {route["route_profile"] for route in selected})

    def test_safest_ors_body_uses_more_avoid_polygons_than_balanced(self):
        with (
            patch.object(route_planner, "get_crime_polygons", return_value=[["crime"]]),
            patch.object(route_planner, "get_incident_polygons", return_value=[["incident"]]),
        ):
            balanced = route_planner.build_ors_body([0, 0], [1, 1], "balanced")
            safest = route_planner.build_ors_body([0, 0], [1, 1], "safest")

        self.assertEqual(
            balanced["options"]["avoid_polygons"]["coordinates"],
            [["crime"]],
        )
        self.assertEqual(
            safest["options"]["avoid_polygons"]["coordinates"],
            [["crime"], ["incident"]],
        )

    def test_scenic_ors_body_uses_tomtom_waypoint_when_available(self):
        with patch.object(
            route_planner, "get_scenic_waypoint", return_value=[0.5, 0.5]
        ):
            body = route_planner.build_ors_body([0, 0], [1, 1], "scenic")

        self.assertEqual(body["coordinates"], [[0, 0], [0.5, 0.5], [1, 1]])

    def test_user_preferences_rank_routes_by_match_score(self):
        search = RouteSearchRequest(
            start="AA",
            destination="BB",
            preferences_description=(
                "I want a quiet scenic walk near water and parks, not crowded."
            ),
        )
        watery_quiet = {
            "route_profile": "scenic",
            "safety_score": 80,
            "estimated_minutes": 16,
            "safety_breakdown": {
                "water_proximity_score": 95,
                "crowding_score": 90,
            },
        }
        direct_busy = {
            "route_profile": "quickest",
            "safety_score": 90,
            "estimated_minutes": 10,
            "safety_breakdown": {
                "water_proximity_score": 40,
                "crowding_score": 45,
            },
        }

        watery_score, watery_summary = route_planner.route_preference_score(
            watery_quiet, search
        )
        direct_score, _ = route_planner.route_preference_score(direct_busy, search)

        self.assertGreater(watery_score, direct_score)
        self.assertIn("water", watery_summary)
        self.assertIn("low-crowd", watery_summary)

    def test_user_preferences_avoid_water_rank_low_water_routes_higher(self):
        search = RouteSearchRequest(
            start="AA",
            destination="BB",
            preferences_description=(
                "I don't want to walk near water. I prefer normal streets."
            ),
        )
        water_heavy_route = {
            "route_profile": "scenic",
            "safety_score": 85,
            "estimated_minutes": 12,
            "safety_breakdown": {
                "water_proximity_score": 95,
                "crowding_score": 80,
            },
        }
        dry_route = {
            "route_profile": "balanced",
            "safety_score": 80,
            "estimated_minutes": 14,
            "safety_breakdown": {
                "water_proximity_score": 20,
                "crowding_score": 75,
            },
        }

        water_heavy_score, _ = route_planner.route_preference_score(
            water_heavy_route, search
        )
        dry_score, dry_summary = route_planner.route_preference_score(
            dry_route, search
        )

        self.assertGreater(dry_score, water_heavy_score)
        self.assertIn("away from water", dry_summary)

    def test_preference_description_infers_route_weights(self):
        search = RouteSearchRequest(
            start="AA",
            destination="BB",
            preferences_description="I care about safe quiet paths near a lake at night.",
        )

        weights = route_planner.inferred_preference_weights(search)

        self.assertGreater(weights["water"], 0)
        self.assertGreater(weights["crowds"], 0)
        self.assertGreater(weights["safety"], 0)

    def test_preference_description_infers_avoid_water_mode(self):
        search = RouteSearchRequest(
            start="AA",
            destination="BB",
            preferences_description="Please avoid lakes and don't take me near water.",
        )

        weights = route_planner.inferred_preference_weights(search)

        self.assertGreater(weights["water"], 0)
        self.assertEqual(weights["water_mode"], "avoid")

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
            patch.object(
                route_planner,
                "calculate_safety_breakdown",
                return_value={
                    "overall_score": 88,
                    "traffic_score": 90,
                    "incident_score": 100,
                    "crime_score": 85,
                    "water_proximity_score": 80,
                    "crowding_score": 75,
                    "signals": ["Test score"],
                },
            ),
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

        self.assertGreaterEqual(len(routes), 4)
        self.assertEqual(routes[0].name, "Quickest")
        self.assertEqual(routes[0].route_profile, "quickest")
        self.assertEqual(routes[0].tradeoff_summary, "Fastest available route")
        self.assertEqual(routes[0].filename, "")
        self.assertEqual(routes[0].safety_breakdown.overall_score, 88)
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
            safety_breakdown={
                "overall_score": 91,
                "traffic_score": 88,
                "incident_score": 100,
                "crime_score": 90,
                "water_proximity_score": 80,
                "crowding_score": 75,
                "signals": ["Stored breakdown"],
            },
            route_profile="safest",
            tradeoff_summary="+3 min, safer corridor",
            preference_score=87,
            preference_summary="87% match for safety preferences",
            is_demo=True,
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
        self.assertEqual(saved_route["safety_breakdown"]["overall_score"], 91)
        self.assertEqual(saved_route["safety_breakdown"]["signals"], ["Stored breakdown"])
        self.assertEqual(saved_route["route_profile"], "safest")
        self.assertEqual(saved_route["tradeoff_summary"], "+3 min, safer corridor")
        self.assertEqual(saved_route["preference_score"], 87)
        self.assertEqual(
            saved_route["preference_summary"],
            "87% match for safety preferences",
        )
        self.assertTrue(saved_route.get("is_demo", False))

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
