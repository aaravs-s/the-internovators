import assert from "node:assert/strict";
import test from "node:test";

import {
  createComment,
  deleteComment,
  getCommunityFeed,
  getCommunityUsers,
  setFollowing,
  setRouteLiked,
} from "./community.ts";


test("community reads encode filters and include credentials", async () => {
  let request: Request | undefined;
  const fetcher: typeof fetch = async (input, init) => {
    request = new Request(new URL(String(input), "http://localhost"), init);
    return Response.json([]);
  };

  await getCommunityUsers("discover", "night walker", fetcher);

  assert.equal(
    request?.url,
    "http://localhost/api/community/users?view=discover&query=night+walker",
  );
  assert.equal(request?.credentials, "include");
});


test("follow and like writes use explicit idempotent methods", async () => {
  const requests: Request[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    requests.push(new Request(new URL(String(input), "http://localhost"), init));
    return Response.json({ is_following: true, is_liked: true, like_count: 1 });
  };

  await setFollowing("walker/two", true, fetcher);
  await setRouteLiked("route/one", false, fetcher);

  assert.equal(requests[0].method, "PUT");
  assert.match(requests[0].url, /follows\/walker%2Ftwo$/);
  assert.equal(requests[1].method, "DELETE");
  assert.match(requests[1].url, /routes\/route%2Fone\/like$/);
});


test("comment writes send JSON and deletion accepts an empty 204 response", async () => {
  const requests: Request[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const request = new Request(new URL(String(input), "http://localhost"), init);
    requests.push(request);
    if (request.method === "DELETE") return new Response(null, { status: 204 });
    return Response.json(
      {
        id: "comment-1",
        route_id: "route-1",
        body: "Useful note",
        created_at: "2026-01-01T00:00:00Z",
        author: { id: "walker-1", username: "walker" },
        can_delete: true,
        replies: [],
      },
      { status: 201 },
    );
  };

  await createComment("route-1", "Useful note", "parent-1", fetcher);
  await deleteComment("comment-1", fetcher);

  assert.equal(requests[0].headers.get("content-type"), "application/json");
  assert.deepEqual(await requests[0].json(), {
    body: "Useful note",
    parent_id: "parent-1",
  });
  assert.equal(requests[1].method, "DELETE");
});


test("community errors expose backend detail", async () => {
  const fetcher: typeof fetch = async () =>
    Response.json({ detail: "Not authenticated" }, { status: 401 });

  await assert.rejects(
    () => getCommunityFeed("following", fetcher),
    /Not authenticated/,
  );
});
