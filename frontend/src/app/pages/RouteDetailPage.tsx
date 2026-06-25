import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { getRoute, type RouteDetail } from "@/app/api/routes";
import { cardBase, SafetyBadge, Tabs, StarRating, IconBookmark } from "@/app/components/ui";
import { imgRouteMap } from "@/app/assets";
import { safetyRadar, reviews } from "@/app/data";


const timeOfDay = [
  { time: "6 AM – 12 PM", score: 9.4 },
  { time: "12 PM – 6 PM", score: 8.7 },
  { time: "6 PM – 10 PM", score: 7.9 },
  { time: "10 PM – 6 AM", score: 6.2 },
];

export default function RouteDetailPage() {
  const navigate   = useNavigate();
  const location = useLocation();
  const source = location.state?.source;
  
  const { id }     = useParams<{ id: string }>();
  const [saved, setSaved]       = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setError("Route not found");
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError("");
    getRoute(id, source)
      .then((result) => {
        if (!cancelled) setRoute(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setRoute(null);
          setError(reason instanceof Error ? reason.message : "Unable to load route");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [id]);

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

      saved_routes.forEach((saved_route: any) => {
        if (saved_route.route_id === id) {
          setSaved(true);
          return true;
        }
      });

      } catch (err) {
        console.error(err);
      }
    };

    loadSavedRoutes();
  }, []);

  const saveRoute = async (routeId: string) => {
    setSaved(true);
    await fetch(`/api/routes/save-${source == "generated" ? "generated" : "shared"}/${routeId}`, {
      method: "POST",
      credentials: "include",
    });
  };

  if (loading) {
    return <div className="p-[32px] text-[rgba(255,255,255,0.5)]">Loading route…</div>;
  }
  if (error || !route) {
    return (
      <div className="p-[32px] flex flex-col gap-[16px]">
        <p role="alert" className="text-[#fca5a5]">{error || "Route not found"}</p>
        <button onClick={() => navigate("/explore")} className="text-left text-[#0a84ff] cursor-pointer">Back to Explore</button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center gap-[12px] pb-[17px] pt-[28px] px-[32px]">
          <button onClick={() => navigate(-1)}
            className="flex items-center gap-[6px] h-[40px] px-[14px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.09)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
            <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.6)]">Back</span>
          </button>
          <div>
            <p className="font-['Inter',sans-serif] font-bold text-[32px] text-white tracking-[-0.7px] leading-[40px]">{route.name}</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">{route.distance_miles} mi · Safety score {route.safety_score}</p>
          </div>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[900px]">
        {/* Map */}
        <div className="rounded-[20px] overflow-hidden h-[220px] relative border border-[rgba(255,255,255,0.08)]">
          <img alt={`Map of ${route.name}`} className="w-full h-full object-cover" 
            src={ source == "generated" ?
              (route.filename == null ? imgRouteMap : `/maps/${route.filename}`) : 
              (route.image_url == null ? imgRouteMap : route.image_url) } 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.4)] to-transparent" />
          <div className="absolute bottom-[16px] left-[16px] flex gap-[8px]">
            <SafetyBadge score={route.safety_score} />
            <span className="font-['Inter',sans-serif] font-medium text-[12px] px-[10px] py-[4px] rounded-[20px] bg-[rgba(10,6,8,0.6)] border border-[rgba(255,255,255,0.15)] text-white">Scenic Route</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-[12px]">
          <button onClick={() => saveRoute(id!)}
            disabled={saved}
            className={`flex items-center gap-[8px] h-[52px] px-[24px] rounded-[16px] border transition-colors ${saved ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.35)] cursor-default" : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)] cursor-pointer"}`}>
            <IconBookmark color={saved ? "#c42050" : "rgba(255,255,255,0.4)"} />
            <span className={`font-['Inter',sans-serif] font-semibold text-[15px] ${saved ? "text-[#c42050]" : "text-[rgba(255,255,255,0.55)]"}`}>{saved ? "Saved" : "Save"}</span>
          </button>
          <button className="flex items-center gap-[8px] h-[52px] px-[20px] rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] cursor-pointer hover:border-[rgba(255,255,255,0.2)] transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="14" cy="5" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <circle cx="14" cy="15" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <circle cx="5" cy="10" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
              <path d="M11.5 6.5l-5 2M11.5 13.5l-5-2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="font-['Inter',sans-serif] font-semibold text-[15px] text-[rgba(255,255,255,0.55)]">Share</span>
          </button>
        </div>

        {/* Tabs */}
        <Tabs tabs={["Overview", "Safety", "Reviews", "Directions"]} active={activeTab} onChange={setActiveTab} />

        {activeTab === "Overview" && (
          <div className="flex gap-[14px]">
            {[
              { label: "Distance", value: `${route.distance_miles} mi` },
              { label: "Duration", value: `${route.estimated_minutes} min` },
              { label: "Difficulty", value: route.distance_miles < 3 ? "Easy" : (route.distance_miles > 8 ? "Hard" : "Medium") },
            ].map((s) => (
              <div key={s.label} className={`${cardBase} px-[20px] py-[16px] flex-1`}>
                <p className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.4)] uppercase tracking-[0.6px] mb-[4px]">{s.label}</p>
                <p className="font-['Inter',sans-serif] font-bold text-[20px] text-white tracking-[-0.4px]">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Overview" && (
          <div className={`${cardBase} p-[20px]`}>
            <p className="font-semibold text-[14px] text-white mb-[8px]">About this route</p>
            <p className="text-[13px] leading-[20px] text-[rgba(255,255,255,0.55)]">{route.summary || `${route.start} to ${route.destination}`}</p>
            {route.highlights.length > 0 && (
              <div className="flex flex-wrap gap-[6px] mt-[12px]">
                {route.highlights.map((highlight) => (
                  <span key={highlight} className="text-[11px] px-[8px] py-[3px] rounded-full bg-[rgba(255,255,255,0.07)] text-[rgba(255,255,255,0.5)]">{highlight}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Safety" && (
          <div className="flex gap-[20px]">
            <div className={`${cardBase} p-[20px] flex-1`}>
              <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white mb-[12px]">Safety Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={safetyRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Inter" }} />
                  <Radar dataKey="score" stroke="#c42050" fill="#c42050" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className={`${cardBase} p-[20px] flex-1`}>
              <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white mb-[16px]">Safety by Time of Day</p>
              <div className="flex flex-col gap-[12px]">
                {timeOfDay.map((t) => (
                  <div key={t.time} className="flex items-center gap-[12px]">
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] w-[130px] shrink-0">{t.time}</span>
                    <div className="flex-1 h-[6px] rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(t.score / 10) * 100}%`, background: t.score >= 9 ? "#22c55e" : t.score >= 7.5 ? "#f59e0b" : "#ef4444" }} />
                    </div>
                    <SafetyBadge score={t.score} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Reviews" && (
          <div className="flex flex-col gap-[12px]">
            <div className={`${cardBase} p-[20px] flex items-center gap-[24px]`}>
              <div className="text-center">
                <p className="font-['Inter',sans-serif] font-bold text-[48px] text-white tracking-[-1px] leading-none">4.7</p>
                <StarRating value={5} />
                <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] mt-[4px]">128 reviews</p>
              </div>
              <div className="flex-1 flex flex-col gap-[6px]">
                {[5,4,3,2,1].map((s) => (
                  <div key={s} className="flex items-center gap-[8px]">
                    <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] w-[8px]">{s}</span>
                    <div className="flex-1 h-[5px] rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
                      <div className="h-full rounded-full bg-[#c42050]" style={{ width: `${[72,18,6,3,1][5-s]}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {reviews.map((r) => (
              <div key={r.author} className={`${cardBase} p-[18px]`}>
                <div className="flex items-center gap-[12px] mb-[10px]">
                  <div className="size-[36px] rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(196,32,80,0.2)", border: "1px solid rgba(196,32,80,0.3)" }}>
                    <span className="font-['Inter',sans-serif] font-bold text-[14px] text-[#c42050]">{r.initials}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-white">{r.author}</p>
                    <div className="flex items-center gap-[8px]">
                      <StarRating value={r.rating} />
                      <span className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.3)]">{r.time}</span>
                    </div>
                  </div>
                </div>
                <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.55)] leading-[20px]">{r.text}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === "Directions" && (
          <div className={`${cardBase} overflow-hidden`}>
            {route.directions.length === 0 && (
              <p className="px-[20px] py-[24px] text-[13px] text-[rgba(255,255,255,0.45)]">Turn-by-turn directions are not available for this saved route.</p>
            )}
            {route.directions.map((step, index) => (
              <div key={`${step.kind}-${index}`} className={`flex items-center gap-[16px] px-[20px] py-[14px] ${index < route.directions.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}>
                <div className={`size-[10px] rounded-full shrink-0 ${step.kind === "start" ? "bg-[#22c55e]" : step.kind === "end" ? "bg-[#c42050]" : "bg-[rgba(255,255,255,0.25)]"}`} />
                <div className="flex-1">
                  <p className="font-['Inter',sans-serif] font-medium text-[13px] text-white">{step.instruction}</p>
                </div>
                <span className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.25)]">{step.distance_miles.toFixed(2)} mi</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
