import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { cardBase, SafetyBadge, RouteCard, IconCompass, IconBookmark } from "@/app/components/ui";
import { imgProfile } from "@/app/assets";
import { weekActivity } from "@/app/data";
import { getCommunityProfile, type CommunityProfile } from "@/app/api/community";
import { useAuth } from "../../auth/AuthContext";

const primaryGradient = "linear-gradient(179.019deg, rgb(176,24,72) 8.2137%, rgb(122,15,46) 91.786%)";

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [communityProfile, setCommunityProfile] = useState<CommunityProfile | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCommunityProfile(user.id)
      .then((profile) => { if (!cancelled) setCommunityProfile(profile); })
      .catch(() => { if (!cancelled) setCommunityProfile(null); });
    return () => { cancelled = true; };
  }, [user]);

  return (
    <>
      {/* Header */}
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[var(--section-divide-border)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center justify-between pb-[17px] pt-[28px] px-[32px]">
          <div>
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Welcome!</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">Stay safe on every route.</p>
          </div>
          <div className="flex items-center gap-[12px]">
            <button onClick={() => navigate("/explore")}
              className="flex items-center gap-[8px] h-[40px] px-[16px] bg-[var(--card-background-secondary)] border border-[var(--select-border)] rounded-[12px] cursor-pointer hover:bg-[var(--select-border)] transition-colors">
              <IconCompass color="var(--text-body)" />
              <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[var(--text-body)]">Find Route</span>
            </button>
            <button onClick={() => navigate("/profile")} className="size-[40px] rounded-full overflow-hidden border border-[var(--grey-light-border-hover)] cursor-pointer shrink-0">
              <img alt="" className="w-full h-full object-cover" src={imgProfile} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[28px]">
        {/* Safety index + Quick stats */}
        <div className="flex gap-[16px]">
          {/* Safety Index */}
          <div className="flex-1 rounded-[20px] p-[24px] relative overflow-hidden" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
            <div className="flex items-start justify-between mb-[16px]">
              <div>
                <p className="font-['Inter',sans-serif] font-medium text-[11px] text-[var(--text-note-subtitle)] uppercase tracking-[0.8px] mb-[4px]">Area Safety Index</p>
                <p className="font-['Inter',sans-serif] font-bold text-[42px] text-white tracking-[-1px] leading-none">9.1</p>
                <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(34,197,94,0.8)] mt-[4px]">↑ +0.3 from yesterday</p>
              </div>
              <div className="size-[52px] rounded-[14px] flex items-center justify-center" style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <div className="size-[10px] rounded-full bg-[var(--green)]" />
              </div>
            </div>
            <div className="flex gap-[8px] flex-wrap">
              {["Low Crime", "Well Lit", "Clear Path"].map((tag) => (
                <span key={tag} className="font-['Inter',sans-serif] font-medium text-[11px] px-[8px] py-[3px] rounded-full" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "rgba(34,197,94,0.8)" }}>{tag}</span>
              ))}
            </div>
          </div>

          {/* Today stats */}
          <div className="flex flex-col gap-[10px]">
            {[
              { label: "Distance today",  value: "5.5 mi",  sub: "+2.1 from avg" },
              { label: "Routes walked",   value: "2",       sub: "This week: 12" },
              { label: "Calories burned", value: "412",     sub: "↑ Active day"  },
            ].map((s) => (
              <div key={s.label} className={`${cardBase} px-[18px] py-[13px] flex-1`} style={{ minWidth: "230px" }}>
                <p className="font-['Inter',sans-serif] font-normal text-[10px] text-[var(--grey-muted)] uppercase tracking-[0.6px]">{s.label}</p>
                <p className="font-['Inter',sans-serif] font-bold text-[22px] text-white tracking-[-0.5px] leading-tight">{s.value}</p>
                <p className="font-['Inter',sans-serif] font-normal text-[11px] text-[var(--grey-muted)] mt-[2px]">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly activity bar chart */}
        <div className={`${cardBase} p-[24px]`}>
          <div className="flex items-center justify-between mb-[16px]">
            <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white tracking-[-0.3px]">This Week's Activity</p>
            <div className="flex gap-[8px]">
              {["km", "routes"].map((t, i) => (
                <button key={t} className={`px-[12px] py-[5px] rounded-[10px] font-['Inter',sans-serif] font-medium text-[12px] cursor-pointer ${i === 0 ? "bg-[var(--primary-bg-dark)] text-[var(--primary)] border border-[var(--primary-selected-border)]" : "text-[var(--text-note-subtitle)]"}`}>{t}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={weekActivity} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fill: "var(--grey-muted)", fontSize: 11, fontFamily: "Inter" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "rgba(20,10,15,0.95)", border: "1px solid var(--select-border)", borderRadius: "10px", color: "white", fontSize: "12px" }} cursor={{ fill: "var(--option-bg-dark-grey)" }} />
              <Bar dataKey="km" radius={[5, 5, 0, 0]}>
                {weekActivity.map((_, i) => (
                  <Cell key={i} fill={i === 5 ? "url(#barGrad)" : "var(--select-border)"} />
                ))}
              </Bar>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(176,24,72)" />
                  <stop offset="100%" stopColor="rgb(122,15,46)" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent routes */}
        <div>
          <div className="flex items-center justify-between mb-[16px]">
            <p className="font-['Inter',sans-serif] font-semibold text-[17px] text-white tracking-[-0.34px]">Recent Routes</p>
            <button onClick={() => navigate("/saved")} className="font-['Inter',sans-serif] font-medium text-[13px] text-[var(--back-text-color)] cursor-pointer">See all</button>
          </div>
          <div className="flex gap-[16px] overflow-x-auto pb-[4px]">
            {[
              { label: "Downtown Loop",  distance: "8.7 mi", duration: "25 min", safety: 9.2 },
              { label: "Riverside Walk", distance: "3.2 mi", duration: "42 min", safety: 8.4 },
              { label: "Park Ring",      distance: "4.1 mi", duration: "28 min", safety: 9.1 },
            ].map((r) => (
              <RouteCard key={r.label} {...r} onClick={() => navigate("/route/1")} />
            ))}
          </div>
        </div>

        {/* Profile card */}
        <div>
          <p className="font-['Inter',sans-serif] font-semibold text-[17px] text-white tracking-[-0.34px] mb-[12px]">Your Profile</p>
          <button onClick={() => navigate("/profile")} className={`${cardBase} w-full text-left cursor-pointer hover:border-[var(--grey-light-border-hover)] transition-colors`}>
            <div className="flex gap-[16px] items-center p-[17px]">
              <div className="rounded-full shrink-0 size-[54px] overflow-hidden">
                <img alt="" className="w-full h-full object-cover" src={imgProfile} />
              </div>
              <div className="flex-1">
                <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white tracking-[-0.3px]">@{communityProfile?.username ?? user?.username ?? "walker"}</p>
                <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[var(--text-note-subtitle)]">View your community profile</p>
              </div>
              <div className="flex items-center gap-[20px]">
                {[{ label: "Shared", val: communityProfile?.shared_route_count ?? "–" }, { label: "Followers", val: communityProfile?.follower_count ?? "–" }, { label: "Following", val: communityProfile?.following_count ?? "–" }].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="font-['Inter',sans-serif] font-bold text-[16px] text-white">{s.val}</p>
                    <p className="font-['Inter',sans-serif] font-normal text-[11px] text-[var(--grey-muted)]">{s.label}</p>
                  </div>
                ))}
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.33333" />
              </svg>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
