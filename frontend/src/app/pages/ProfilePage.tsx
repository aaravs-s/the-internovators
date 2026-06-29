import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { cardBase, SafetyBadge, Tabs, IconGear } from "@/app/components/ui";
import { imgProfile, imgRouteMap } from "@/app/assets";
import { monthlyActivity, socialUsers } from "@/app/data";
import { useAuth } from "../../auth/AuthContext";

interface OtherUser {
  id: string,
  username: string
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [editing, setEditing]     = useState(false);
  const [activeTab, setActiveTab] = useState("Followers");
  const { user, user_loading, logout } = useAuth();
  const [bio, setBio] = useState("")
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [followers, setFollowers] = useState<OtherUser[]>([{id: "a3b21833-64b5-47d3-839b-d2f5a380141c", username: "password"}]);
  const [following, setFollowing] = useState<OtherUser[]>([]);


  useEffect(() => {
    setBio(user?.bio ?? "")
  }, [user]);

  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
      const response = await fetch("/api/routes/get-saved", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load saved routes");
      }

      const saved_routes = await response.json();

      setSaved((_) => {
        return new Set<string>(saved_routes.map((saved_route) => saved_route.id))
      });
      } catch (err) {
        console.error(err);
      }
    };

    loadSavedRoutes();
  }, []);

  const saveBio = async () => {
    const params = new URLSearchParams({
      new_bio: bio,
    });
    await fetch(`/api/users/update-bio?${params}`, {
      method: "POST",
      credentials: "include",
    });
  };
  
  if (user_loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center justify-between pb-[17px] pt-[28px] px-[32px]">
          <div>
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">My Profile</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Your walks, your stats, your routes.</p>
          </div>
          {/* <button onClick={() => navigate("/settings")}
            className="flex items-center gap-[8px] h-[40px] px-[14px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.09)] transition-colors">
            <IconGear color="rgba(255,255,255,0.5)" />
            <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.6)]">Settings</span>
          </button> */}
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[900px]">
        {/* Profile hero */}
        <div className={`${cardBase} p-[24px]`}>
          <div className="flex items-center gap-[20px] mb-[14px]">
            <div className="size-[80px] rounded-full overflow-hidden shrink-0" style={{ border: "2px solid rgba(196,32,80,0.3)" }}>
              <img alt="Profile" className="w-full h-full object-cover" src={imgProfile} />
            </div>
            <div className="flex-1">
              <p className="font-['Inter',sans-serif] font-bold text-[22px] text-white tracking-[-0.5px] mb-[4px]">{user?.username ?? "username"}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.4)]">{user?.email ? `${user?.email} · ` : ""}User since {user!.created_at}</p>
            </div>
            <button onClick={() => { 
              if (editing) {
                saveBio()
              }
              setEditing(!editing);
            }}
              className={`px-[16px] py-[8px] rounded-[12px] border cursor-pointer transition-colors ${editing ? "border-[rgba(196,32,80,0.35)] bg-[rgba(196,32,80,0.15)]" : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.08)]"}`}
            >
              <span className={`font-['Inter',sans-serif] font-semibold text-[13px] ${editing ? "text-[#c42050]" : "text-[rgba(255,255,255,0.6)]"}`}>{editing ? "Save" : "Edit Profile"}</span>
            </button>
          </div>
          {editing
            ? <textarea value={bio ?? ""} onChange={(e) => setBio(e.target.value)} rows={2} className="bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] rounded-[10px] px-[12px] py-[8px] text-[rgba(255,255,255,0.7)] text-[14px] w-full outline-none resize-none leading-[22px] mb-[14px]" />
            : <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.55)] leading-[22px] mb-[14px]">{bio}</p>}
          {/* Achievement badges */}
          {/* <div className="flex gap-[8px]">
            {[{ label: "Night Walker", color: "#8b5cf6" }, { label: "100 Routes", color: "#f59e0b" }, { label: "City Explorer", color: "#0a84ff" }].map((a) => (
              <div key={a.label} className="flex items-center gap-[5px] px-[10px] py-[4px] rounded-full border" style={{ background: `${a.color}15`, borderColor: `${a.color}30` }}>
                <div className="size-[5px] rounded-full" style={{ background: a.color }} />
                <span className="font-['Inter',sans-serif] font-medium text-[11px]" style={{ color: a.color }}>{a.label}</span>
              </div>
            ))}
          </div> */}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-[12px]">
          {[{ label: "Saved Routes", value: `${saved.size}` }, { label: "Followers", value: `${followers.length}` }, { label: "Following", value: `${following.length}` }].map((s) => (
            <div key={s.label} className={`${cardBase} px-[20px] py-[16px] text-center`}>
              <p className="font-['Inter',sans-serif] font-bold text-[26px] text-white tracking-[-0.6px]">{s.value}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] mt-[2px]">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs tabs={["Followers", "Following"]} active={activeTab} onChange={setActiveTab} />

        {activeTab === "Followers" && (
          <div className="flex flex-col gap-[10px]">
            {followers.length > 0 ? 
              followers.map((u) => (
                <div key={u.id} className={`${cardBase} flex items-center gap-[14px] p-[14px]`}>
                  <div className="size-[44px] rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.1)]">
                    <span className="font-['Inter',sans-serif] font-bold text-[16px] text-white opacity-60">{u.username[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white">{u.username}</p>
                    {/* <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)]">@{u.handle}</p> */}
                  </div>
                  <button onClick={() => navigate(`/social/${u.id}`)} className="cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12L10 8L6 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.33333" />
                    </svg>
                  </button>
                </div>
              )) : 
              <div className={`${cardBase} flex items-center gap-[14px] p-[14px]`}>
                <div className="flex-1">
                  <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white">You have no followers</p>
                </div>
              </div>
            }
          </div>
        )}
      </div>
    </>
  );
}
