import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import {
  getCommunityFeed,
  getCommunityUsers,
  setFollowing,
  setRouteLiked,
  type CommunityRoute,
  type CommunityUser,
} from "@/app/api/community";
import RouteDiscussion from "@/app/components/RouteDiscussion";
import RouteMap from "@/app/components/InteractiveRouteMap";
import { cardBase, SafetyBadge, Tabs } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";


type CommunityTab = "Activity" | "Following" | "Discover";


export default function SocialPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<CommunityTab>("Activity");
  const [scope, setScope] = useState<"following" | "everyone">("following");
  const [search, setSearch] = useState("");
  const [routes, setRoutes] = useState<CommunityRoute[]>([]);
  const [users, setUsers] = useState<CommunityUser[]>([]);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        if (tab === "Activity") {
          const result = await getCommunityFeed(scope);
          if (!cancelled) setRoutes(result);
        } else {
          const result = await getCommunityUsers(
            tab === "Following" ? "following" : "discover",
            search,
          );
          if (!cancelled) setUsers(result);
        }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load the community");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, tab === "Discover" ? 200 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [tab, scope, search]);

  async function toggleFollow(user: CommunityUser) {
    const next = !user.is_following;
    const previous = users;
    setUsers((current) => current.map((item) => item.id === user.id ? {
      ...item,
      is_following: next,
      follower_count: Math.max(0, item.follower_count + (next ? 1 : -1)),
    } : item));
    setError("");
    try {
      const state = await setFollowing(user.id, next);
      setUsers((current) => current
        .map((item) => item.id === user.id ? { ...item, is_following: state.is_following, follower_count: state.follower_count } : item)
        .filter((item) => tab !== "Following" || item.is_following));
    } catch (reason) {
      setUsers(previous);
      setError(reason instanceof Error ? reason.message : "Unable to update follow");
    }
  }

  async function toggleLike(route: CommunityRoute) {
    if (route.is_owner) return;
    const next = !route.is_liked;
    const previous = routes;
    setRoutes((current) => current.map((item) => item.id === route.id ? {
      ...item,
      is_liked: next,
      like_count: Math.max(0, item.like_count + (next ? 1 : -1)),
    } : item));
    setError("");
    try {
      const state = await setRouteLiked(route.id, next);
      setRoutes((current) => current.map((item) => item.id === route.id ? { ...item, is_liked: state.is_liked, like_count: state.like_count } : item));
    } catch (reason) {
      setRoutes(previous);
      setError(reason instanceof Error ? reason.message : "Unable to update like");
    }
  }

  return (
    <>
      <header className="relative shrink-0 border-b border-[var(--section-divide-border)] px-[32px] pb-[17px] pt-[28px]">
        <h1 className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Walking Community</h1>
        <p className="text-[14px] text-[var(--text-note-subtitle)]">Follow local walkers and trade useful route knowledge.</p>
      </header>

      <main className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[960px]">
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <Tabs tabs={["Activity", "Following", "Discover"]} active={tab} onChange={(value) => setTab(value as CommunityTab)} />
          {tab === "Activity" ? (
            <div className="flex rounded-[12px] border border-[var(--select-border)] p-[3px]">
              {(["following", "everyone"] as const).map((value) => (
                <button key={value} onClick={() => setScope(value)} className={`rounded-[9px] px-[12px] py-[6px] text-[12px] font-semibold capitalize ${scope === value ? "bg-[var(--primary-bg-dark)] text-[var(--initials-circle-text)]" : "text-[var(--text-note-subtitle)]"}`}>{value}</button>
              ))}
            </div>
          ) : (
            <input
              aria-label="Search walkers"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search walkers…"
              className="h-[38px] w-[220px] rounded-[12px] border border-[var(--select-border)] bg-[var(--card-background-secondary)] px-[14px] text-[13px] text-white outline-none"
            />
          )}
        </div>

        {error && <p role="alert" className="rounded-[12px] bg-[var(--error-bg-color)] px-[14px] py-[10px] text-[13px] text-[var(--error-text-color)]">{error}</p>}
        {loading && <p className="py-[32px] text-center text-[13px] text-[var(--text-note-subtitle)]">Loading the walking community…</p>}

        {!loading && tab === "Activity" && routes.length === 0 && (
          <div className={`${cardBase} p-[32px] text-center`}>
            <p className="font-semibold text-white">No shared routes here yet.</p>
            <p className="mt-[5px] text-[13px] text-[var(--text-note-subtitle)]">{scope === "following" ? "Follow walkers in Discover or switch to Everyone." : "Be the first to share a saved route."}</p>
          </div>
        )}

        {!loading && tab === "Activity" && routes.map((route) => (
          <article key={route.id} className={`${cardBase} overflow-hidden`}>
            <div className="flex items-center gap-[12px] px-[18px] pt-[16px]">
              <button onClick={() => navigate(`/social/${route.owner.id}`)} className="size-[40px] rounded-full bg-[var(--primary-bg-dark)] text-[var(--initials-circle-text)] font-bold">{route.owner.username.slice(0, 1).toUpperCase()}</button>
              <button onClick={() => navigate(`/social/${route.owner.id}`)} className="flex-1 text-left">
                <p className="text-[13px] font-semibold text-white">@{route.owner.username}</p>
                <p className="text-[11px] text-[var(--grey-muted)]">Shared {route.created_at ? new Date(route.created_at).toLocaleDateString() : "recently"}</p>
              </button>
              <SafetyBadge score={route.safety_score} />
            </div>
            <button onClick={() => navigate(`/route/${route.id}`, { state: { source: "saved" } })} className="mt-[14px] block w-full text-left">
              <div className="h-[160px] w-full">
                <RouteMap coordinates={route.coordinates} fallbackImage={route.image_url ?? imgRouteMap} mode="preview" routeName={route.name} />
              </div>
              <div className="px-[18px] pt-[14px]">
                <h2 className="font-bold text-[18px] text-white">{route.name}</h2>
                <p className="mt-[3px] text-[12px] text-[var(--text-note-subtitle)]">{route.distance_miles} mi · {route.estimated_minutes} min</p>
                {route.summary && <p className="mt-[8px] text-[13px] leading-[19px] text-[var(--text-body)]">{route.summary}</p>}
              </div>
            </button>
            <div className="flex items-center gap-[18px] px-[18px] py-[14px]">
              {!route.is_owner && (
                <button aria-label={`${route.is_liked ? "Unlike" : "Like"} ${route.name}`} onClick={() => void toggleLike(route)} className={`text-[12px] font-semibold ${route.is_liked ? "text-[var(--initials-circle-text)]" : "text-[var(--text-body)]"}`}>♥ {route.like_count}</button>
              )}
              {route.is_owner && <span className="text-[12px] text-[var(--grey-muted)]">{route.like_count} likes</span>}
              <button aria-label={`Open discussion for ${route.name}`} aria-expanded={expandedRoute === route.id} onClick={() => setExpandedRoute(expandedRoute === route.id ? null : route.id)} className="text-[12px] font-semibold text-[var(--text-body)]">Discussion · {route.comment_count}</button>
            </div>
            {expandedRoute === route.id && <div className="border-t border-[var(--card-background-secondary)] p-[18px]"><RouteDiscussion routeId={route.id} /></div>}
          </article>
        ))}

        {!loading && tab !== "Activity" && users.length === 0 && (
          <div className={`${cardBase} p-[32px] text-center`}>
            <p className="font-semibold text-white">{tab === "Following" ? "You are not following anyone yet." : "No walkers match that search."}</p>
            <p className="mt-[5px] text-[13px] text-[var(--text-note-subtitle)]">{tab === "Following" ? "Visit Discover to meet the community." : "Try another username or bio keyword."}</p>
          </div>
        )}

        {!loading && tab !== "Activity" && users.map((user) => (
          <article key={user.id} className={`${cardBase} flex items-center gap-[14px] p-[16px]`}>
            <button onClick={() => navigate(`/social/${user.id}`)} className="size-[50px] rounded-full bg-[var(--primary-bg-dark)] text-[var(--initials-circle-text)] font-bold text-[18px]">{user.username.slice(0, 1).toUpperCase()}</button>
            <button onClick={() => navigate(`/social/${user.id}`)} className="min-w-0 flex-1 text-left">
              <p className="truncate text-[14px] font-semibold text-white">@{user.username}</p>
              <p className="truncate text-[12px] text-[var(--text-note-subtitle)]">{user.bio || "SafeWalkers community member"}</p>
              <p className="mt-[4px] text-[11px] text-[var(--grey-muted)]">{user.shared_route_count} shared routes · {user.follower_count} followers</p>
            </button>
            <button aria-label={`${user.is_following ? "Unfollow" : "Follow"} @${user.username}`} onClick={() => void toggleFollow(user)} className={`rounded-[11px] border px-[14px] py-[7px] text-[12px] font-semibold ${user.is_following ? "border-[var(--primary-selected-border)] bg-[var(--primary-selected-bg)] text-[var(--initials-circle-text)]" : "border-[var(--grey-light-border-hover)] bg-[var(--section-divide-border)] text-white"}`}>{user.is_following ? "Following" : "Follow"}</button>
          </article>
        ))}
      </main>
    </>
  );
}
