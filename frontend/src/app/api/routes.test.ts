import assert from "node:assert/strict";
import test from "node:test";

import { getRoute, getRoutes } from "./routes.ts";


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

  await assert.rejects(() => getRoute("missing", fetcher), /Route not found/);
});
