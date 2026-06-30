import assert from "node:assert/strict";
import test from "node:test";

import * as routesApi from "./routes.ts";

const { getRoute, getRoutes, resolveRoute } = routesApi;


const generatedRoute = {
  id: "generated-1",
  name: "Scenic",
  distance_miles: 1.5,
  estimated_minutes: 30,
  safety_score: 8.8,
  tags: [],
  image_url: null,
  route_profile: "scenic",
  tradeoff_summary: "Scenic route",
  preference_score: 88,
  preference_summary: "88% match",
  safety_breakdown: null,
  start: "UT Austin",
  destination: "Texas Capitol",
  summary: "Comfortable route",
  highlights: [],
  directions: [],
  coordinates: [[-97.733, 30.286], [-97.745, 30.271]] as [number, number][],
  is_demo: false,
};


test("route map display prefers geometry and falls back to images", () => {
  const routeMapDisplay = (routesApi as typeof routesApi & {
    routeMapDisplay?: (route: {
      coordinates?: [number, number][];
      image_url?: string | null;
      filename?: string;
    }) => { kind: string; coordinates?: [number, number][]; src?: string };
  }).routeMapDisplay;

  assert.equal(typeof routeMapDisplay, "function");
  assert.deepEqual(
    routeMapDisplay?.({
      coordinates: [[-97.733, 30.286], [-97.745, 30.271]],
      image_url: "/maps/legacy.png",
    }),
    {
      kind: "map",
      coordinates: [[-97.733, 30.286], [-97.745, 30.271]],
    },
  );
  assert.deepEqual(
    routeMapDisplay?.({ coordinates: [], filename: "legacy.png" }),
    { kind: "image", src: "/maps/legacy.png" },
  );
  assert.deepEqual(
    routeMapDisplay?.({
      coordinates: [],
      filename: "legacy.png",
      image_url: "/generic.png",
    }),
    { kind: "image", src: "/maps/legacy.png" },
  );
});


test("getRoutes returns typed route summaries", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(
      JSON.stringify([
        {
          id: "route-1",
          name: "Downtown",
          distance_miles: 1.5,
          estimated_minutes: 30,
          safety_score: 8.8,
          tags: ["lit"],
          image_url: null,
          route_profile: "quickest",
          tradeoff_summary: "Fastest available route",
          preference_score: 88,
          preference_summary: "88% match for safety preferences",
          safety_breakdown: {
            overall_score: 88,
            traffic_score: 90,
            incident_score: 100,
            crime_score: 85,
            water_proximity_score: 80,
            crowding_score: 75,
            signals: ["Low nearby traffic"],
          },
        },
      ]),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  const routes = await getRoutes(new URLSearchParams(), fetcher);

  assert.equal(routes[0].name, "Downtown");
  assert.equal(routes[0].safety_score, 8.8);
});


test("getRoute exposes the backend error detail", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(JSON.stringify({ detail: "Route not found" }), {
      status: 404,
      headers: { "content-type": "application/json" },
    });

  await assert.rejects(() => getRoute("missing", "saved", fetcher), /Route not found/);
});


test("getRoute preserves route coordinates", async () => {
  const fetcher: typeof fetch = async () =>
    new Response(
      JSON.stringify({
        id: "route-1",
        name: "Downtown",
        distance_miles: 1.5,
        estimated_minutes: 30,
        safety_score: 8.8,
        tags: [],
        image_url: null,
        route_profile: "quickest",
        tradeoff_summary: "Fastest available route",
        preference_score: 88,
        preference_summary: "88% match for safety preferences",
        safety_breakdown: {
          overall_score: 88,
          traffic_score: 90,
          incident_score: 100,
          crime_score: 85,
          water_proximity_score: 80,
          crowding_score: 75,
          signals: ["Low nearby traffic"],
        },
        start: "UT Austin, Austin, TX",
        destination: "Austin Central Library, Austin, TX",
        summary: "Austin route",
        highlights: [],
        directions: [],
        coordinates: [[-97.733, 30.286], [-97.745, 30.271]],
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );

  const route = await getRoute("route-1", "generated", fetcher);

  assert.deepEqual(route.coordinates, [[-97.733, 30.286], [-97.745, 30.271]]);
});


test("resolveRoute uses the generated route already carried by navigation", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => {
    requests += 1;
    return Response.json({ detail: "Route not found" }, { status: 404 });
  };

  const route = await resolveRoute(
    "generated-1",
    "generated",
    generatedRoute,
    fetcher,
    [0],
  );

  assert.equal(route.id, "generated-1");
  assert.equal(requests, 0);
});


test("resolveRoute retries transient generated-route 404 responses", async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => {
    requests += 1;
    if (requests < 3) {
      return Response.json({ detail: "Route not found" }, { status: 404 });
    }
    return Response.json(generatedRoute);
  };

  const route = await resolveRoute(
    "generated-1",
    "generated",
    null,
    fetcher,
    [0, 0, 0],
  );

  assert.equal(route.id, "generated-1");
  assert.equal(requests, 3);
});
