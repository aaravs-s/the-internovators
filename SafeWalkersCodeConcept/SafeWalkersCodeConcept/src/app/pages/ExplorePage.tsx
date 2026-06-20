import { useState } from "react";
import { useNavigate } from "react-router";
import { cardBase, SafetyBadge } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import { homeSvg } from "@/app/assets";
import { exploreRoutes } from "@/app/data";

const chips = ["All", "Short", "Long", "Highly Rated", "Nearby"];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [saved, setSaved]   = useState(new Set([2, 5]));

  const toggle = (id: number) =>
    setSaved((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const visible = exploreRoutes.filter((r) => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All"          ? true :
      filter === "Short"        ? parseFloat(r.distance) < 4 :
      filter === "Long"         ? parseFloat(r.distance) >= 4 :
      filter === "Highly Rated" ? r.safety >= 9 : true;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Explore</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Discover new safe routes near you.</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
        {/* Search */}
        <div className="relative">
          <div className="absolute left-[16px] top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </div>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search routes, areas, or tags…"
            className="w-full h-[48px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[14px] pl-[44px] pr-[16px] font-['Inter',sans-serif] text-[15px] text-white placeholder-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-[8px] overflow-x-auto">
          {chips.map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-[16px] py-[8px] rounded-[12px] cursor-pointer whitespace-nowrap font-['Inter',sans-serif] font-medium text-[13px] border shrink-0 transition-colors ${filter === c ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.3)] text-[#c42050]" : "border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-[14px]">
          {visible.map((route) => (
            <div key={route.id} className={`${cardBase} overflow-hidden`}>
              <div className="h-[100px] w-full overflow-hidden relative">
                <img alt="" className="w-full h-full object-cover" src={imgRouteMap} />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.7)] to-transparent" />
                <div className="absolute bottom-[10px] left-[14px]">
                  <SafetyBadge score={route.safety} />
                </div>
                <button onClick={() => toggle(route.id)}
                  className="absolute top-[10px] right-[10px] size-[30px] rounded-full bg-[rgba(10,6,8,0.6)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-pointer hover:border-[rgba(196,32,80,0.4)] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                    <path d={homeSvg.p2f4e1d80} stroke={saved.has(route.id) ? "#c42050" : "rgba(255,255,255,0.5)"}
                      strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.83333"
                      fill={saved.has(route.id) ? "rgba(196,32,80,0.3)" : "none"} />
                  </svg>
                </button>
              </div>
              <div className="p-[14px]">
                <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white mb-[6px]">{route.name}</p>
                <div className="flex items-center gap-[8px] mb-[10px]">
                  <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)]">{route.distance}</span>
                  <div className="size-[3px] rounded-full bg-[rgba(255,255,255,0.2)]" />
                  <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.5)]">{route.duration}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-[4px]">
                    {route.tags.map((t) => (
                      <span key={t} className="font-['Inter',sans-serif] font-normal text-[10px] px-[7px] py-[2px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]">{t}</span>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/route/${route.id}`)} className="cursor-pointer">
                    <span className="font-['Inter',sans-serif] font-semibold text-[12px] text-[#0a84ff]">View →</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
