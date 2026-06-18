import { useState } from "react";
import { useNavigate } from "react-router";
import { cardBase, SafetyBadge, IconBookmark } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import { exploreRoutes } from "@/app/data";

const filters = ["All", "Short", "Long", "Highly Rated"];

export default function SavedPage() {
  const navigate = useNavigate();
  const [filter, setFilter]   = useState("All");
  const [saved, setSaved]     = useState(new Set([1, 2, 3, 4, 5, 6]));

  const toggle = (id: number) =>
    setSaved((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const visible = exploreRoutes.filter((r) => {
    if (!saved.has(r.id)) return false;
    if (filter === "Short")        return parseFloat(r.distance) < 4;
    if (filter === "Long")         return parseFloat(r.distance) >= 4;
    if (filter === "Highly Rated") return r.safety >= 9;
    return true;
  });

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Saved Routes</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">{saved.size} routes saved</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
        {/* Filter chips */}
        <div className="flex items-center gap-[10px]">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-[16px] py-[8px] rounded-[12px] cursor-pointer font-['Inter',sans-serif] font-medium text-[13px] border transition-colors ${filter === f ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.3)] text-[#c42050]" : "border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Route list */}
        <div className="flex flex-col gap-[12px]">
          {visible.map((route) => (
            <button key={route.id} onClick={() => navigate(`/route/${route.id}`)}
              className={`${cardBase} text-left w-full cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors relative`}>
              <div className="flex items-center gap-[16px] p-[16px]">
                <div className="size-[64px] rounded-[12px] overflow-hidden shrink-0">
                  <img alt="" className="w-full h-full object-cover" src={imgRouteMap} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white">{route.name}</p>
                    <SafetyBadge score={route.safety} />
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)]">{route.distance}</span>
                    <div className="size-[3px] rounded-full bg-[rgba(255,255,255,0.2)]" />
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)]">{route.duration}</span>
                    <div className="flex gap-[4px]">
                      {route.tags.map((t) => (
                        <span key={t} className="font-['Inter',sans-serif] font-normal text-[11px] px-[7px] py-[2px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggle(route.id); }}
                  className="p-[8px] rounded-[10px] bg-[rgba(196,32,80,0.1)] border border-[rgba(196,32,80,0.2)] cursor-pointer hover:bg-[rgba(196,32,80,0.2)] transition-colors">
                  <IconBookmark color="#c42050" />
                </button>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.33333" />
                </svg>
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-[48px]">
              <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.3)]">No routes match this filter.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
