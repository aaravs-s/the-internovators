export interface CommunityUser {
  id: string;
  username: string;
  bio: string;
  picture_url: string;
  created_at: string;
  shared_route_count: number;
  follower_count: number;
  following_count: number;
  is_following: boolean;
}

export interface CommunityRoute {
  id: string;
  name: string;
  summary: string;
  distance_miles: number;
  estimated_minutes: number;
  safety_score: number;
  tags: string[];
  image_url: string | null;
  created_at: string;
  owner: CommunityUser;
  like_count: number;
  comment_count: number;
  is_liked: boolean;
  is_owner: boolean;
}

export interface CommunityComment {
  id: string;
  route_id: string;
  body: string;
  created_at: string;
  author: CommunityUser;
  can_delete: boolean;
  replies: CommunityComment[];
}

export interface CommunityProfile extends CommunityUser {
  shared_routes: CommunityRoute[];
}

export interface FollowState {
  user_id: string;
  is_following: boolean;
  follower_count: number;
}

export interface LikeState {
  route_id: string;
  is_liked: boolean;
  like_count: number;
}


async function requestJson<T>(
  url: string,
  init: RequestInit = {},
  fetcher: typeof fetch = fetch,
): Promise<T> {
  const response = await fetcher(url, {
    credentials: "include",
    ...init,
    headers: {
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { detail?: string };
      if (payload.detail) message = payload.detail;
    } catch {
      // Keep the status-based fallback for non-JSON errors.
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}


export function getCommunityFeed(
  scope: "following" | "everyone",
  fetcher: typeof fetch = fetch,
): Promise<CommunityRoute[]> {
  return requestJson(`/api/community/feed?scope=${scope}`, {}, fetcher);
}


export function getCommunityUsers(
  view: "following" | "discover",
  query = "",
  fetcher: typeof fetch = fetch,
): Promise<CommunityUser[]> {
  const params = new URLSearchParams({ view });
  if (query.trim()) params.set("query", query.trim());
  return requestJson(`/api/community/users?${params}`, {}, fetcher);
}


export function getCommunityProfile(
  userId: string,
  fetcher: typeof fetch = fetch,
): Promise<CommunityProfile> {
  return requestJson(
    `/api/community/users/${encodeURIComponent(userId)}`,
    {},
    fetcher,
  );
}


export function setFollowing(
  userId: string,
  isFollowing: boolean,
  fetcher: typeof fetch = fetch,
): Promise<FollowState> {
  return requestJson(
    `/api/community/follows/${encodeURIComponent(userId)}`,
    { method: isFollowing ? "PUT" : "DELETE" },
    fetcher,
  );
}


export function setRouteLiked(
  routeId: string,
  isLiked: boolean,
  fetcher: typeof fetch = fetch,
): Promise<LikeState> {
  return requestJson(
    `/api/community/routes/${encodeURIComponent(routeId)}/like`,
    { method: isLiked ? "PUT" : "DELETE" },
    fetcher,
  );
}


export function getComments(
  routeId: string,
  fetcher: typeof fetch = fetch,
): Promise<CommunityComment[]> {
  return requestJson(
    `/api/community/routes/${encodeURIComponent(routeId)}/comments`,
    {},
    fetcher,
  );
}


export function createComment(
  routeId: string,
  body: string,
  parentId: string | null = null,
  fetcher: typeof fetch = fetch,
): Promise<CommunityComment> {
  return requestJson(
    `/api/community/routes/${encodeURIComponent(routeId)}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body, parent_id: parentId }),
    },
    fetcher,
  );
}


export function deleteComment(
  commentId: string,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  return requestJson(
    `/api/community/comments/${encodeURIComponent(commentId)}`,
    { method: "DELETE" },
    fetcher,
  );
}
