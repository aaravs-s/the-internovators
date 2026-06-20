export interface RouteSummary {
  id: string;
  name: string;
  distance_miles: number;
  estimated_minutes: number;
  safety_score: number;
  tags: string[];
  image_url: string | null;
}

export interface DirectionStep {
  instruction: string;
  distance_miles: number;
  kind: "start" | "step" | "end";
}

export interface RouteDetail extends RouteSummary {
  start: string;
  destination: string;
  summary: string;
  highlights: string[];
  directions: DirectionStep[];
}


async function requestJson<T>(url: string, fetcher: typeof fetch): Promise<T> {
  const response = await fetcher(url);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) message = payload.detail;
    } catch {
      // The status-based message remains useful for non-JSON failures.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}


export function getRoutes(
  params: URLSearchParams,
  fetcher: typeof fetch = fetch,
): Promise<RouteSummary[]> {
  const query = params.toString();
  return requestJson<RouteSummary[]>(`/api/routes${query ? `?${query}` : ""}`, fetcher);
}


export function getRoute(
  routeId: string,
  fetcher: typeof fetch = fetch,
): Promise<RouteDetail> {
  return requestJson<RouteDetail>(`/api/routes/${encodeURIComponent(routeId)}`, fetcher);
}
