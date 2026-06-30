import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";

import { imgRouteMap, homeSvg } from "@/app/assets";
import { cardBase, SafetyBadge } from "@/app/components/ui";
import { useAuth } from "../../auth/AuthContext";
import RouteMap from "@/app/components/InteractiveRouteMap";

function scoreLabel(score?: number) {
    if (typeof score !== "number") return "N/A";
    return `${Math.round(score)}`;
}

function ScoreChip({ label, score }: { label: string; score?: number }) {
    return (
        <span className="text-[10px] px-[7px] py-[3px] rounded-full bg-[var(--option-bg-hover)] border border-[var(--select-border)] text-[var(--text-body)]">
            {label} {scoreLabel(score)}
        </span>
    );
}

function profileLabel(profile?: string) {
    const labels: Record<string, string> = {
        quickest: "Quickest",
        safest: "Safest",
        scenic: "Scenic",
        quiet: "Quiet",
        balanced: "Balanced",
    };
    return labels[profile ?? ""] ?? "Route Option";
}

export default function RouteResultsPage() {
    const navigate = useNavigate();
    const { state } = useLocation();

    const [saved, setSaved] = useState<Set<string>>(new Set());
    // const [routes, setRoutes] = useState<RouteSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const routes = state.routes;

    const saveRoute = async (routeId: string) => {
        await fetch(`/api/routes/save-generated/${routeId}`, {
            method: "POST",
            credentials: "include",
        });
    };

    const toggle = async (id: string) => {
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
                    return new Set<string>(saved_routes.map((route) => route.route_id))
                });
            } catch (err) {
                console.error(err);
            }
        };

        loadSavedRoutes();
    }, []);

    return (
        <>
        <div className="relative shrink-0 w-full">
            <div aria-hidden className="absolute border-[var(--section-divide-border)] border-b border-solid inset-0 pointer-events-none" />
            <div className="pb-[17px] pt-[28px] px-[32px]">
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Results</p>
            {(routes.length > 0) && (
                <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">The best routes from {routes[0].start} to {routes[0].destination}. </p>
            )}
            </div>
        </div>

        <div className="px-[32px] py-[24px] flex flex-col gap-[20px]">
            {routes.some((route) => route.is_demo) && (
                <div className="rounded-[14px] border border-[var(--yellow-border)] bg-[var(--yellow-bg)] px-[16px] py-[12px] text-[13px] text-[var(--yellow)]">
                    Live routing is temporarily unavailable. These are fixed Austin demo routes between UT Tower and Austin Central Library.
                </div>
            )}
            <div className="grid grid-cols-2 gap-[20px]">

                {(routes.length > 0) ? (
                    routes.map((route) => (
                        <div key={route.id} className={`${cardBase} overflow-hidden`}>
                            <div className="w-full h-[220px] overflow-hidden relative">
                                <RouteMap
                                    coordinates={route.coordinates}
                                    fallbackImage={imgRouteMap}
                                    filename={route.filename}
                                    mode="preview"
                                    routeName={route.name}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--route-card-gradient-black)] to-transparent" />
                                <div className="absolute bottom-[10px] left-[14px]"><SafetyBadge score={route.safety_score} /></div>
                                {route.is_demo && (
                                    <span className="absolute left-[14px] top-[12px] rounded-full border border-[var(--demo-color-light)] bg-[var(--card-black)] px-[8px] py-[3px] text-[10px] font-semibold uppercase tracking-[0.5px] text-[var(--yellow)]">Demo</span>
                                )}
                                <button onClick={() => toggle(route.id)} aria-label={saved.has(route.id) ? "Unsave route" : "Save route"}
                                disabled={saved.has(route.id)}
                                className={`absolute top-[10px] right-[10px] size-[30px] rounded-full bg-[var(--save-btn-bg)] border border-[var(--select-border)] flex items-center justify-center cursor-${saved.has(route.id) ? "default" : "pointer"} hover:border-[var(--primary-border-dark-hover)] transition-colors`}>
                                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                                    <path d={homeSvg.p2f4e1d80} stroke={saved.has(route.id) ? "var(--primary)" : "var(--small-text-grey)"}
                                    strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.83333"
                                    fill={saved.has(route.id) ? "var(--primary-selected-border)" : "none"} />
                                </svg>
                                </button>
                            </div>
                            <div className="p-[14px]">
                                <div className="flex items-start justify-between gap-[10px] mb-[6px]">
                                <div>
                                <p className="font-['Inter',sans-serif] font-semibold text-[14px] text-white">{profileLabel(route.route_profile)}</p>
                                {route.tradeoff_summary && (
                                    <p className="text-[11px] text-[var(--text-note-subtitle)] mt-[2px]">{route.tradeoff_summary}</p>
                                )}
                                {route.preference_summary && (
                                    <p className="text-[11px] text-[var(--primary)] mt-[2px]">{route.preference_summary}</p>
                                )}
                                </div>
                                </div>
                                <div className="flex items-center gap-[8px] mb-[10px]">
                                <span className="text-[12px] text-[var(--small-text-grey)]">{route.distance_miles} mi</span>
                                <div className="size-[3px] rounded-full bg-[var(--card-border-focus)]" />
                                <span className="text-[12px] text-[var(--small-text-grey)]">{route.estimated_minutes} min</span>
                                </div>
                                <div className="flex items-center justify-between gap-[12px]">
                                <div className="flex gap-[4px] flex-wrap">
                                    <ScoreChip label="Safety" score={route.safety_breakdown?.overall_score ?? route.safety_score} />
                                    <ScoreChip label="Traffic" score={route.safety_breakdown?.traffic_score} />
                                    <ScoreChip label="Crime" score={route.safety_breakdown?.crime_score} />
                                    <ScoreChip label="Crowding" score={route.safety_breakdown?.crowding_score} />
                                </div>
                                <button onClick={() => navigate(`/results/${route.id}`, {state: { source: "generated", route }})} className="cursor-pointer shrink-0">
                                    <span className="font-semibold text-[12px] text-[var(--back-text-color)]">View →</span>
                                </button>
                                </div>
                            </div>
                            </div>
                    ))
                ) : (
                    <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">Error: No routes generated</p>
                )}

            </div>
        </div>
        </>
    );
}
