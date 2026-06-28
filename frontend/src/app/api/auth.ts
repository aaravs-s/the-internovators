export async function loginAndRefresh(
  username: string,
  password: string,
  refreshUser: () => Promise<void>,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    let message = "Login failed";
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) message = payload.detail;
    } catch {
      // Keep the generic message for non-JSON failures.
    }
    throw new Error(message);
  }
  await refreshUser();
}
