import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getCommunityProfile, type CommunityProfile } from "@/app/api/community";
import { cardBase, SafetyBadge, IconGear } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import RouteMap from "@/app/components/InteractiveRouteMap";
import { useAuth } from "../../auth/AuthContext";


export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setLoading(false);
      return;
    }
    getCommunityProfile(user.id)
      .then((result) => {
        if (!cancelled) {
          setProfile(result);
          setBio(result.bio);
        }
      })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Unable to load your profile"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const saveBio = async () => {
    setError("");
    const params = new URLSearchParams({ new_bio: bio });
    const response = await fetch(`/api/users/update-bio?${params}`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { detail?: string };
      setError(payload.detail ?? "Unable to update your bio");
      return;
    }
    setProfile((current) => current ? { ...current, bio } : current);
    await refreshUser();
    setEditing(false);
  };

  return (
    <>
      <header className="flex items-center justify-between border-b border-[rgba(255,255,255,0.05)] px-[32px] pb-[17px] pt-[28px]">
        <div><h1 className="text-[38px] font-bold tracking-[-0.8px] text-white">My Profile</h1><p className="text-[14px] text-[rgba(255,255,255,0.4)]">Your public Walking Community presence.</p></div>
        <button onClick={() => navigate("/settings")} className="flex h-[40px] items-center gap-[8px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.06)] px-[14px] text-[13px] text-[rgba(255,255,255,0.6)]"><IconGear color="rgba(255,255,255,0.5)" />Settings</button>
      </header>
      <main className="max-w-[900px] p-[32px] flex flex-col gap-[18px]">
        {loading && <p className="text-[13px] text-[rgba(255,255,255,0.4)]">Loading your community profile…</p>}
        {error && <p role="alert" className="rounded-[10px] bg-[rgba(239,68,68,0.1)] px-[12px] py-[9px] text-[12px] text-[#fca5a5]">{error}</p>}
        {!loading && profile && (
          <>
            <section className={`${cardBase} p-[24px]`}>
              <div className="flex items-center gap-[18px]">
                <div className="size-[76px] rounded-full bg-[rgba(196,32,80,0.18)] flex items-center justify-center text-[28px] font-bold text-[#ef7098]">{profile.username.slice(0, 1).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><h2 className="text-[21px] font-bold text-white">@{profile.username}</h2>{!editing && <p className="mt-[5px] text-[13px] leading-[20px] text-[rgba(255,255,255,0.55)]">{profile.bio || "Add a bio to introduce yourself."}</p>}<p className="mt-[7px] text-[11px] text-[rgba(255,255,255,0.3)]">Joined {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "recently"}</p></div>
                <button onClick={() => editing ? void saveBio() : setEditing(true)} className="rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] px-[16px] py-[8px] text-[13px] font-semibold text-[rgba(255,255,255,0.7)]">{editing ? "Save" : "Edit Profile"}</button>
              </div>
              {editing && <textarea aria-label="Profile bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={2} className="mt-[16px] w-full resize-none rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.07)] px-[12px] py-[8px] text-[14px] leading-[22px] text-[rgba(255,255,255,0.7)] outline-none" />}
            </section>
            <section className="grid grid-cols-3 gap-[12px]">
              {[{ label: "Shared routes", value: profile.shared_route_count }, { label: "Followers", value: profile.follower_count }, { label: "Following", value: profile.following_count }].map((stat) => <div key={stat.label} className={`${cardBase} p-[16px] text-center`}><p className="text-[25px] font-bold text-white">{stat.value}</p><p className="text-[11px] text-[rgba(255,255,255,0.4)]">{stat.label}</p></div>)}
            </section>
            <section><div className="mb-[12px] flex items-center justify-between"><h2 className="text-[15px] font-semibold text-white">Your shared routes</h2><button onClick={() => navigate("/saved")} className="text-[12px] font-semibold text-[#5ea8ff]">Manage saved routes</button></div>{profile.shared_routes.length === 0 ? <div className={`${cardBase} p-[24px] text-center text-[13px] text-[rgba(255,255,255,0.4)]`}>Share a saved route to make it visible here.</div> : <div className="grid grid-cols-2 gap-[14px]">{profile.shared_routes.map((route) => <button key={route.id} onClick={() => navigate(`/route/${route.id}`, { state: { source: "saved" } })} className={`${cardBase} overflow-hidden text-left`}><div className="h-[120px] w-full"><RouteMap coordinates={route.coordinates} fallbackImage={route.image_url ?? imgRouteMap} mode="preview" routeName={route.name} /></div><div className="p-[14px]"><div className="flex items-start justify-between gap-[10px]"><div><p className="font-semibold text-white">{route.name}</p><p className="mt-[2px] text-[11px] text-[rgba(255,255,255,0.4)]">{route.distance_miles} mi · {route.estimated_minutes} min</p></div><SafetyBadge score={route.safety_score} /></div><p className="mt-[8px] text-[11px] text-[rgba(255,255,255,0.35)]">{route.like_count} likes · {route.comment_count} messages</p></div></button>)}</div>}</section>
          </>
        )}
      </main>
    </>
  );
}
