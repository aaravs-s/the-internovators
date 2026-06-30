import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { getCommunityProfile, setFollowing, type CommunityProfile } from "@/app/api/community";
import { cardBase, SafetyBadge } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import RouteMap from "@/app/components/InteractiveRouteMap";


export default function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setError("Walker not found");
      setLoading(false);
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError("");
    getCommunityProfile(userId)
      .then((result) => { if (!cancelled) setProfile(result); })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load profile"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  async function toggleFollow() {
    if (!profile) return;
    const previous = profile;
    const next = !profile.is_following;
    setProfile({ ...profile, is_following: next, follower_count: Math.max(0, profile.follower_count + (next ? 1 : -1)) });
    setError("");
    try {
      const state = await setFollowing(profile.id, next);
      setProfile((current) => current ? { ...current, is_following: state.is_following, follower_count: state.follower_count } : current);
    } catch (reason) {
      setProfile(previous);
      setError(reason instanceof Error ? reason.message : "Unable to update follow");
    }
  }

  if (loading) return <p className="p-[32px] text-[var(--text-body)]">Loading walker profile…</p>;
  if (!profile) return <div className="p-[32px]"><p role="alert" className="text-[var(--error-text-color)]">{error || "Walker not found"}</p><button onClick={() => navigate("/social")} className="mt-[12px] text-[var(--blue-light)]">Back to community</button></div>;

  return (
    <>
      <header className="flex items-center gap-[12px] border-b border-[var(--section-divide-border)] px-[32px] pb-[17px] pt-[28px]">
        <button onClick={() => navigate("/social")} className="rounded-[12px] border border-[var(--select-border)] bg-[var(--card-background-secondary)] px-[14px] py-[9px] text-[13px] text-[var(--text-body)]">← Back</button>
        <div><h1 className="text-[32px] font-bold text-white">@{profile.username}</h1><p className="text-[13px] text-[var(--text-note-subtitle)]">Walking Community profile</p></div>
      </header>
      <main className="max-w-[900px] p-[32px] flex flex-col gap-[18px]">
        {error && <p role="alert" className="rounded-[10px] bg-[var(--error-bg-color)] px-[12px] py-[9px] text-[12px] text-[var(--error-text-color)]">{error}</p>}
        <section className={`${cardBase} flex items-center gap-[18px] p-[24px]`}>
          <div className="size-[76px] rounded-full bg-[var(--primary-bg-dark)] flex items-center justify-center text-[28px] font-bold text-[var(--initials-circle-text)]">{profile.username.slice(0, 1).toUpperCase()}</div>
          <div className="min-w-0 flex-1"><h2 className="text-[21px] font-bold text-white">@{profile.username}</h2><p className="mt-[5px] text-[13px] leading-[20px] text-[var(--text-body)]">{profile.bio || "This walker has not added a bio yet."}</p><p className="mt-[7px] text-[11px] text-[var(--grey-muted)]">Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "recently"}</p></div>
          <button aria-label={`${profile.is_following ? "Unfollow" : "Follow"} @${profile.username}`} onClick={() => void toggleFollow()} className={`rounded-[12px] border px-[18px] py-[9px] text-[13px] font-semibold ${profile.is_following ? "border-[var(--primary-selected-border)] bg-[var(--primary-selected-bg)] text-[var(--initials-circle-text)]" : "border-[var(--grey-light-border-hover)] bg-[var(--option-bg-hover)] text-white"}`}>{profile.is_following ? "Following" : "Follow"}</button>
        </section>
        <section className="grid grid-cols-3 gap-[12px]">
          {[{ label: "Shared routes", value: profile.shared_route_count }, { label: "Followers", value: profile.follower_count }, { label: "Following", value: profile.following_count }].map((stat) => <div key={stat.label} className={`${cardBase} p-[16px] text-center`}><p className="text-[25px] font-bold text-white">{stat.value}</p><p className="text-[11px] text-[var(--text-note-subtitle)]">{stat.label}</p></div>)}
        </section>
        <section><h2 className="mb-[12px] text-[15px] font-semibold text-white">Shared routes</h2>{profile.shared_routes.length === 0 ? <div className={`${cardBase} p-[24px] text-center text-[13px] text-[var(--text-note-subtitle)]`}>No shared routes yet.</div> : <div className="grid grid-cols-2 gap-[14px]">{profile.shared_routes.map((route) => <button key={route.id} onClick={() => navigate(`/route/${route.id}`, { state: { source: "saved" } })} className={`${cardBase} overflow-hidden text-left`}><div className="h-[120px] w-full"><RouteMap coordinates={route.coordinates} fallbackImage={route.image_url ?? imgRouteMap} mode="preview" routeName={route.name} /></div><div className="p-[14px]"><div className="flex items-start justify-between gap-[10px]"><div><p className="font-semibold text-white">{route.name}</p><p className="mt-[2px] text-[11px] text-[var(--text-note-subtitle)]">{route.distance_miles} mi · {route.estimated_minutes} min</p></div><SafetyBadge score={route.safety_score} /></div><p className="mt-[8px] text-[11px] text-[var(--grey-muted)]">{route.like_count} likes · {route.comment_count} messages</p></div></button>)}</div>}</section>
      </main>
    </>
  );
}
