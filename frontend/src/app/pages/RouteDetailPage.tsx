import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { resolveRoute, type RouteDetail } from "@/app/api/routes";
import InteractiveRouteMap from "@/app/components/InteractiveRouteMap";
import { cardBase, SafetyBadge, Tabs, IconBookmark } from "@/app/components/ui";
import { imgRouteMap, loadingGif } from "@/app/assets";
import RouteDiscussion from "@/app/components/RouteDiscussion";


const timeOfDay = [
  { time: "6 AM – 12 PM", score: 9.4 },
  { time: "12 PM – 6 PM", score: 8.7 },
  { time: "6 PM – 10 PM", score: 7.9 },
  { time: "10 PM – 6 AM", score: 6.2 },
];

function toPercentScore(score: number) {
  return Math.round(score > 10 ? score : score * 10);
}

function fallbackBreakdown(score: number) {
  const percentScore = toPercentScore(score);
  return {
    overall_score: percentScore,
    traffic_score: percentScore,
    incident_score: percentScore,
    crime_score: percentScore,
    water_proximity_score: percentScore,
    crowding_score: percentScore,
    signals: ["Detailed safety metrics are not available for this older route."],
  };
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 70 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex items-center gap-[12px]">
      <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] w-[130px] shrink-0">{label}</span>
      <div className="flex-1 h-[6px] rounded-full bg-[rgba(255,255,255,0.07)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="font-['Inter',sans-serif] font-semibold text-[12px] w-[32px] text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function RouteDetailPage() {
  const navigate   = useNavigate();
  const location = useLocation();
  const source = location.state?.source ?? (location.pathname.startsWith("/route/") ? "saved" : "generated");
  const navigationRoute = (location.state?.route ?? null) as RouteDetail | null;
  
  const { id }     = useParams<{ id: string }>();
  const [saved, setSaved]       = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      setError("Route not found");
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError("");
    resolveRoute(id, source, navigationRoute)
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
  }, [id, source, navigationRoute]);

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
          if (saved_route.route_id === id || saved_route.id === id) {
            setSaved(true);
            return true;
          }
        });

      } catch (err) {
        console.error(err);
      }
    };

    loadSavedRoutes();
  }, [id]);

  const saveRoute = async (routeId: string) => {
    setSaved(true);
    await fetch(`/api/routes/save-${source == "generated" ? "generated" : "shared"}/${routeId}`, {
      method: "POST",
      credentials: "include",
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      
      setTimeout(() => setLinkCopied(false), 2000); 
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] p-[32px] flex items-center justify-center">
        <div className={`${cardBase} w-full max-w-[460px] p-[32px] text-center`} role="status" aria-live="polite">
          <img src={loadingGif} alt="" className="mx-auto size-[54px] object-contain" />
          <h1 className="mt-[18px] text-[20px] font-semibold text-white">Preparing your route</h1>
          <p className="mt-[8px] text-[13px] leading-[1.6] text-[rgba(255,255,255,0.5)]">
            Loading the map, safety details, and directions. This can take a moment.
          </p>
        </div>
      </div>
    );
  }
  if (error || !route) {
    return (
      <div className="p-[32px] flex flex-col gap-[16px]">
        <p role="alert" className="text-[#fca5a5]">{error || "Route not found"}</p>
        <button onClick={() => navigate("/explore")} className="text-left text-[#0a84ff] cursor-pointer">Back to Explore</button>
      </div>
    );
  }

  const routeCoordinates = route.coordinates ?? [];
  const hasInteractiveMap = routeCoordinates.length >= 2;
  const fallbackMapImage =
    source == "generated"
      ? route.filename
        ? `/maps/${route.filename}`
        : imgRouteMap
      : route.image_url ?? imgRouteMap;
  const safetyBreakdown = route.safety_breakdown ?? fallbackBreakdown(route.safety_score);
  const safetyRadarData = [
    { subject: "Traffic", score: safetyBreakdown.traffic_score },
    { subject: "Incidents", score: safetyBreakdown.incident_score },
    { subject: "Crime", score: safetyBreakdown.crime_score },
    { subject: "Water", score: safetyBreakdown.water_proximity_score },
    { subject: "Crowding", score: safetyBreakdown.crowding_score },
  ];

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
          {hasInteractiveMap ? (
            <InteractiveRouteMap coordinates={routeCoordinates} routeName={route.name} />
          ) : (
            <>
              <img alt={`Map of ${route.name}`} className="w-full h-full object-cover" src={fallbackMapImage} />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.4)] to-transparent" />
            </>
          )}
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
          {(source === "saved") ? (
            <button 
              className="flex items-center gap-[8px] h-[52px] px-[20px] rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] cursor-pointer hover:border-[rgba(255,255,255,0.2)] transition-colors"
              onClick={copyLink}
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <circle cx="14" cy="5" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <circle cx="14" cy="15" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <circle cx="5" cy="10" r="2.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
                <path d="M11.5 6.5l-5 2M11.5 13.5l-5-2" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span className="font-['Inter',sans-serif] font-semibold text-[15px] text-[rgba(255,255,255,0.55)]">{linkCopied ? "Link copied!" : "Share"}</span>
            </button>
          ) : (<></>)}

        </div>

        {/* Tabs */}
        <Tabs tabs={["Overview", "Safety", ...(source === "generated" ? [] : ["Discussion"]), "Directions"]} active={activeTab} onChange={setActiveTab} />

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
                <RadarChart data={safetyRadarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "Inter" }} />
                  <Radar dataKey="score" stroke="#c42050" fill="#c42050" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className={`${cardBase} p-[20px] flex-1`}>
              <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white mb-[16px]">Route Signals</p>
              <div className="flex flex-col gap-[12px]">
                <ScoreRow label="Traffic" score={safetyBreakdown.traffic_score} />
                <ScoreRow label="Incidents" score={safetyBreakdown.incident_score} />
                <ScoreRow label="Crime" score={safetyBreakdown.crime_score} />
                <ScoreRow label="Water / Scenic" score={safetyBreakdown.water_proximity_score} />
                <ScoreRow label="Crowding" score={safetyBreakdown.crowding_score} />
                <div className="pt-[4px] flex flex-col gap-[6px]">
                  {safetyBreakdown.signals.map((signal) => (
                    <p key={signal} className="text-[12px] leading-[18px] text-[rgba(255,255,255,0.48)]">{signal}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "Discussion" && id && <div className={`${cardBase} p-[20px]`}><RouteDiscussion routeId={id} /></div>}

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
                <span className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.25)]">{step.distance_miles} mi</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
