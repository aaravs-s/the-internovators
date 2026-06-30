import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { cardBase, SafetyBadge, IconBookmark } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import RouteMap from "@/app/components/InteractiveRouteMap";

const filters = ["All", "Short", "Long", "Highly Rated"];

interface Direction {
  distance_miles: number,
  instruction: string,
  kind: string
}

interface SavedRoute {
  average_rating: number,
  comments: string,
  created_at: string,
  destination: string,
  directions: Direction[],
  distance_miles: number,
  estimated_minutes: number,
  filename: string,
  highlights: string[],
  id: string,
  is_shared: boolean,
  like_count: number,
  liked_by: string[],
  map_style: string,
  name: string,
  rating_count: number,
  ratings: number[],
  route_id: string,
  route_type: string,
  safety_score: number,
  start: number,
  summary: string,
  tags: string[],
  user_has_liked: boolean,
  user_id: string[],
  user_rating: number,
  coordinates: [number, number][],
  is_demo: boolean
}

export default function SavedPage() {
  const navigate = useNavigate();
  const [filter, setFilter]   = useState("All");
  const [saved, setSaved]     = useState<SavedRoute[]>([]);

  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const response = await fetch("/api/routes/get-user-saved", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load saved routes");
        }

        const saved_routes = await response.json();

        setSaved(saved_routes);
      } catch (err) {
        console.error(err);
      }
    };

    loadSavedRoutes();
  }, []);

  const visible = saved.filter((r) => {
    if (filter === "Short")        return r.distance_miles < 4;
    if (filter === "Long")         return r.distance_miles >= 4;
    if (filter === "Highly Rated") return r.safety_score >= 90;
    return true;
  });

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[var(--section-divide-border)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Saved Routes</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">{saved.length} routes saved</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
        {/* Filter chips */}
        <div className="flex items-center gap-[10px]">
          {filters.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-[16px] py-[8px] rounded-[12px] cursor-pointer font-['Inter',sans-serif] font-medium text-[13px] border transition-colors ${filter === f ? "bg-[var(--primary-selected-bg)] border-[var(--primary-selected-border)] text-[var(--primary)]" : "border-[var(--select-border)] text-[var(--small-text-grey)] bg-[var(--option-bg-dark-grey)] hover:bg-[var(--option-bg-hover)]"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Route list */}
        <div className="flex flex-col gap-[12px]">
          {visible.map((route) => (
            <button key={route.id} onClick={() => navigate(`/route/${route.route_id}`, {state: { source: "saved" }})}
              className={`${cardBase} text-left w-full cursor-pointer hover:border-[var(--grey-light-border-hover)] transition-colors relative`}>
              <div className="flex items-center gap-[16px] p-[16px]">
                <div className="size-[64px] rounded-[12px] overflow-hidden shrink-0">
                  <RouteMap
                    coordinates={route.coordinates}
                    fallbackImage={imgRouteMap}
                    filename={route.filename}
                    mode="preview"
                    routeName={route.name}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-[8px] mb-[4px]">
                    <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white">{route.name}</p>
                    <SafetyBadge score={route.safety_score} />
                  </div>
                  <div className="flex items-center gap-[10px]">
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[var(--small-text-grey)]">{route.distance_miles} mi</span>
                    <div className="size-[3px] rounded-full bg-[var(--card-border-focus)]" />
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[var(--small-text-grey)]">{route.estimated_minutes} min</span>
                    <div className="flex gap-[4px]">
                      {route.tags.map((t) => (
                        <span key={t} className="font-['Inter',sans-serif] font-normal text-[11px] px-[7px] py-[2px] rounded-full bg-[var(--option-bg-hover)] border border-[var(--select-border)] text-[var(--text-note-subtitle)]">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" strokeWidth="1.33333" />
                </svg>
              </div>
            </button>
          ))}
          {visible.length === 0 && (
            <div className="text-center py-[48px]">
              <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--grey-muted)]">{saved.length > 0 ? "No routes match this filter." : "You have no saved routes."}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
