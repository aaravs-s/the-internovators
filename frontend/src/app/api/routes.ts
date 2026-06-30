export interface RouteSummary {
  id: string;
  name: string;
  distance_miles: number;
  estimated_minutes: number;
  safety_score: number;
  tags: string[];
  image_url: string | null;
  safety_breakdown: SafetyBreakdown | null;
  route_profile: string;
  tradeoff_summary: string;
  preference_score: number;
  preference_summary: string;
  coordinates: RouteCoordinate[];
  is_demo: boolean;
}

export interface SafetyBreakdown {
  overall_score: number;
  traffic_score: number;
  incident_score: number;
  crime_score: number;
  water_proximity_score: number;
  crowding_score: number;
  signals: string[];
}

export interface DirectionStep {
  instruction: string;
  distance_miles: number;
  kind: "start" | "step" | "end";
}

export type RouteCoordinate = [number, number];

type RouteMapRecord = {
  coordinates?: RouteCoordinate[];
  image_url?: string | null;
  filename?: string | null;
};

export type RouteMapDisplay =
  | { kind: "map"; coordinates: RouteCoordinate[] }
  | { kind: "image"; src: string }
  | { kind: "unavailable" };

function isValidCoordinate(point: unknown): point is RouteCoordinate {
  if (!Array.isArray(point) || point.length !== 2) return false;
  const [longitude, latitude] = point;
  return (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    longitude >= -180 &&
    longitude <= 180 &&
    latitude >= -90 &&
    latitude <= 90
  );
}

export function routeMapDisplay(route: RouteMapRecord): RouteMapDisplay {
  const coordinates = (route.coordinates ?? []).filter(isValidCoordinate);
  if (coordinates.length >= 2) {
    return { kind: "map", coordinates };
  }
  if (route.filename) {
    return { kind: "image", src: `/maps/${route.filename}` };
  }
  if (route.image_url) {
    return { kind: "image", src: route.image_url };
  }
  return { kind: "unavailable" };
}

export interface RouteDetail extends RouteSummary {
  start: string;
  destination: string;
  summary: string;
  highlights: string[];
  directions: DirectionStep[];
  coordinates: RouteCoordinate[];
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
  source: string,
  fetcher: typeof fetch = fetch,
): Promise<RouteDetail> {
  if (source === "saved"){
    return requestJson<RouteDetail>(`/api/routes/${encodeURIComponent(routeId)}`, fetcher);
  } else {
    return requestJson<RouteDetail>(`/api/routes/results/${encodeURIComponent(routeId)}`, fetcher);
  }
}


export async function resolveRoute(
  routeId: string,
  source: string,
  navigationRoute: RouteDetail | null = null,
  fetcher: typeof fetch = fetch,
  retryDelays: number[] = [0, 500, 1000, 1500],
): Promise<RouteDetail> {
  if (source === "generated" && navigationRoute?.id === routeId) {
    return navigationRoute;
  }

  let lastError: unknown;
  for (const delay of retryDelays) {
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      return await getRoute(routeId, source, fetcher);
    } catch (reason) {
      lastError = reason;
      const isTransientGeneratedRouteMiss =
        source === "generated" &&
        reason instanceof Error &&
        reason.message === "Route not found";

      if (!isTransientGeneratedRouteMiss) {
        throw reason;
      }
    }
  }

  throw lastError;
}
