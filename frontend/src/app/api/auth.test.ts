import assert from "node:assert/strict";
import test from "node:test";

import { loginAndRefresh } from "./auth.ts";


test("login refreshes authenticated user state after the cookie is set", async () => {
  const events: string[] = [];
  const fetcher: typeof fetch = async () => {
    events.push("login");
    return Response.json({ status: "ok" });
  };
  const refreshUser = async () => {
    events.push("refresh");
  };

  await loginAndRefresh("walker", "password", refreshUser, fetcher);

  assert.deepEqual(events, ["login", "refresh"]);
});


test("login surfaces backend errors without refreshing state", async () => {
  let refreshed = false;
  const fetcher: typeof fetch = async () =>
    Response.json({ detail: "Invalid username or password." }, { status: 401 });

  await assert.rejects(
    () => loginAndRefresh("walker", "wrong", async () => { refreshed = true; }, fetcher),
    /Invalid username or password/,
  );
  assert.equal(refreshed, false);
});
