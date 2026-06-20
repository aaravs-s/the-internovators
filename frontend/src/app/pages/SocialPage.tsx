import { useState } from "react";
import { useNavigate } from "react-router";
import { cardBase, SafetyBadge, Tabs } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import { socialUsers, activityFeed } from "@/app/data";

export default function SocialPage() {
  const navigate = useNavigate();
  const [tab, setTab]             = useState("Friends");
  const [search, setSearch]       = useState("");
  const [following, setFollowing] = useState(new Set([1, 3]));
  const [liked, setLiked]         = useState(new Set<number>());

  const toggleFollow = (id: number) =>
    setFollowing((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleLike = (id: number) =>
    setLiked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = socialUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Social</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Connect with fellow walkers.</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
        <div className="flex items-center justify-between">
          <Tabs tabs={["Friends", "Activity", "Suggested"]} active={tab} onChange={setTab} />
          {tab !== "Activity" && (
            <div className="relative">
              <div className="absolute left-[14px] top-1/2 -translate-y-1/2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  <path d="M11 11l3 3" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
              </div>
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search walkers…"
                className="h-[38px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] pl-[36px] pr-[14px] font-['Inter',sans-serif] text-[13px] text-white placeholder-[rgba(255,255,255,0.25)] outline-none w-[200px]"
              />
            </div>
          )}
        </div>

        {tab === "Friends" && (
          <div className="flex flex-col gap-[10px]">
            {filtered.map((u) => (
              <div key={u.id} className={`${cardBase} flex items-center gap-[14px] p-[16px]`}>
                <button onClick={() => navigate(`/social/${u.id}`)} className="size-[50px] rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 cursor-pointer border border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] transition-colors">
                  <span className="font-['Inter',sans-serif] font-bold text-[18px] text-white opacity-60">{u.initials}</span>
                </button>
                <button onClick={() => navigate(`/social/${u.id}`)} className="flex-1 text-left cursor-pointer">
                  <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white">{u.name}</p>
                  <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)]">@{u.handle} · {u.routes} routes</p>
                </button>
                <button onClick={() => toggleFollow(u.id)}
                  className={`px-[14px] py-[7px] rounded-[11px] cursor-pointer border font-['Inter',sans-serif] font-semibold text-[13px] transition-colors ${following.has(u.id) ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.35)] text-[#c42050]" : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] text-white hover:bg-[rgba(255,255,255,0.09)]"}`}>
                  {following.has(u.id) ? "Following" : "Follow"}
                </button>
                <button onClick={() => navigate(`/social/${u.id}`)} className="cursor-pointer ml-[2px]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12L10 8L6 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.33333" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "Activity" && (
          <div className="flex flex-col gap-[12px]">
            {activityFeed.map((item) => (
              <div key={item.id} className={`${cardBase} p-[16px]`}>
                <div className="flex items-center gap-[12px] mb-[10px]">
                  <div className="size-[40px] rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.1)]">
                    <span className="font-['Inter',sans-serif] font-bold text-[15px] text-white opacity-60">{item.initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.7)]">
                      <span className="font-semibold text-white">{item.user}</span>{" "}
                      {item.action === "completed" ? "completed" : "saved"}{" "}
                      <button onClick={() => navigate("/route/1")} className="font-semibold text-[#0a84ff] cursor-pointer">{item.route}</button>
                    </p>
                    <p className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.3)] mt-[2px]">{item.time}</p>
                  </div>
                  <SafetyBadge score={8.7} />
                </div>
                <div className="h-[80px] rounded-[12px] overflow-hidden mb-[10px]">
                  <img alt="" className="w-full h-full object-cover" src={imgRouteMap} />
                </div>
                <div className="flex items-center gap-[16px]">
                  <button onClick={() => toggleLike(item.id)} className="flex items-center gap-[6px] cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 13.5s-6-3.5-6-7.5A3.5 3.5 0 0 1 5.5 2.5c1 0 2 .5 2.5 1.5.5-1 1.5-1.5 2.5-1.5A3.5 3.5 0 0 1 14 6c0 4-6 7.5-6 7.5Z"
                        stroke={liked.has(item.id) ? "#c42050" : "rgba(255,255,255,0.3)"}
                        fill={liked.has(item.id) ? "rgba(196,32,80,0.3)" : "none"} strokeWidth="1.3" />
                    </svg>
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)]">{item.likes + (liked.has(item.id) ? 1 : 0)}</span>
                  </button>
                  <button className="flex items-center gap-[6px] cursor-pointer">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M14 7.5A6 6 0 0 1 2 7.5C2 4.46 4.69 2 8 2s6 2.46 6 5.5v6l-3-2.5H5" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
                    </svg>
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)]">Reply</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "Suggested" && (
          <div className="grid grid-cols-2 gap-[12px]">
            {[...socialUsers, { id: 6, name: "Riley Young", handle: "rileyyoung", routes: 44, initials: "R" }].map((u) => (
              <div key={u.id} className={`${cardBase} p-[20px] flex flex-col items-center text-center gap-[12px]`}>
                <div className="size-[56px] rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center border border-[rgba(255,255,255,0.12)]">
                  <span className="font-['Inter',sans-serif] font-bold text-[20px] text-white opacity-60">{u.initials}</span>
                </div>
                <div>
                  <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white">{u.name}</p>
                  <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)]">{u.routes} routes walked</p>
                </div>
                <button onClick={() => navigate(`/social/${u.id}`)} className="w-full px-[14px] py-[8px] rounded-[11px] border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.05)] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                  <span className="font-['Inter',sans-serif] font-semibold text-[13px] text-[rgba(255,255,255,0.6)]">View Profile</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
