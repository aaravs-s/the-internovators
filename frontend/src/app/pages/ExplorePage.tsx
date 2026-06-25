import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { getRoutes, type RouteSummary } from "@/app/api/routes";
import { imgRouteMap, homeSvg } from "@/app/assets";
import { cardBase, SafetyBadge } from "@/app/components/ui";

const chips = ["All", "Short", "Long", "Highly Rated", "Nearby"];

export default function ExplorePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const saveRoute = async (routeId: string) => {
    await fetch(`/api/routes/save-shared/${routeId}`, {
      method: "POST",
      credentials: "include",
    });
  };


  const toggle = (id: string) => {
    setSaved((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        saveRoute(id);
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      route_type: "all",
      focus: "all",
      sort: "recent",
    });

    setLoading(true);
    setError("");
    getRoutes(params)
      .then((results) => {
        if (!cancelled) setRoutes(results);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setRoutes([]);
          setError(reason instanceof Error ? reason.message : "Unable to load routes");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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

  const normalizedSearch = search.trim().toLowerCase();
  const visible = routes.filter((route) => {
    const searchable = `${route.name} ${route.tags.join(" ")}`.toLowerCase();
    const matchSearch = searchable.includes(normalizedSearch);
    const matchFilter =
      filter === "All" || filter === "Nearby" ? true :
      filter === "Short" ? route.distance_miles < 4 :
      filter === "Long" ? route.distance_miles >= 4 :
      filter === "Highly Rated" ? route.safety_score >= 9 : true;
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
        <div className="relative">
          <div className="absolute left-[16px] top-1/2 -translate-y-1/2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeWidth="1.5" />
            </svg>
          </div>
          <input value={search} onChange={(event) => setSearch(event.target.value)}
            placeholder="Search routes, areas, or tags…"
            className="w-full h-[48px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[14px] pl-[44px] pr-[16px] font-['Inter',sans-serif] text-[15px] text-white placeholder-[rgba(255,255,255,0.25)] outline-none focus:border-[rgba(255,255,255,0.2)] transition-colors"
          />
        </div>

        <div className="flex gap-[8px] overflow-x-auto">
          {chips.map((chip) => (
            <button key={chip} onClick={() => setFilter(chip)}
              className={`px-[16px] py-[8px] rounded-[12px] cursor-pointer whitespace-nowrap font-['Inter',sans-serif] font-medium text-[13px] border shrink-0 transition-colors ${filter === chip ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.3)] text-[#c42050]" : "border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)]"}`}>
              {chip}
            </button>
          ))}
        </div>

        {loading && <p className="text-[rgba(255,255,255,0.5)]">Loading routes…</p>}
        {!loading && error && <p role="alert" className="text-[#fca5a5]">{error}</p>}
        {!loading && !error && visible.length === 0 && (
          <p className="text-[rgba(255,255,255,0.4)]">No routes match your search.</p>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
          {visible.map((route) => (
            <div key={route.id} className={`${cardBase} overflow-hidden`}>
              <div className="h-[100px] w-full overflow-hidden relative">
                <img alt={`Map preview for ${route.name}`} className="w-full h-full object-cover" src={route.image_url ?? imgRouteMap} />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.7)] to-transparent" />
                <div className="absolute bottom-[10px] left-[14px]"><SafetyBadge score={route.safety_score} /></div>
                <button onClick={() => toggle(route.id)} aria-label={saved.has(route.id) ? "Unsave route" : "Save route"}
                  disabled={saved.has(route.id)}
                  className={`absolute top-[10px] right-[10px] size-[30px] rounded-full bg-[rgba(10,6,8,0.6)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center cursor-${saved.has(route.id) ? "default" : "pointer"} hover:border-[rgba(196,32,80,0.4)] transition-colors`}>
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
                  <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{route.distance_miles} mi</span>
                  <div className="size-[3px] rounded-full bg-[rgba(255,255,255,0.2)]" />
                  <span className="text-[12px] text-[rgba(255,255,255,0.5)]">{route.estimated_minutes} min</span>
                </div>
                <div className="flex items-center justify-between gap-[12px]">
                  <div className="flex gap-[4px] flex-wrap">
                    {route.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-[7px] py-[2px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.4)]">{tag}</span>
                    ))}
                  </div>
                  <button onClick={() => navigate(`/route/${route.id}`, {state: { source: "saved" }})} className="cursor-pointer shrink-0">
                    <span className="font-semibold text-[12px] text-[#0a84ff]">View →</span>
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
