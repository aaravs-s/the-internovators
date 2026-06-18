import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { cardBase, SafetyBadge, Tabs, StarRating, PrimaryButton, IconBookmark } from "@/app/components/ui";
import { imgRouteMap, homeSvg } from "@/app/assets";
import { safetyRadar, reviews } from "@/app/data";

const timeOfDay = [
  { time: "6 AM – 12 PM", score: 9.4 },
  { time: "12 PM – 6 PM", score: 8.7 },
  { time: "6 PM – 10 PM", score: 7.9 },
  { time: "10 PM – 6 AM", score: 6.2 },
];

const waypoints = [
  { name: "Start — City Hall Plaza",     type: "start",    note: "Well-lit, CCTV covered" },
  { name: "Market Street Crossing",      type: "waypoint", note: "Pedestrian-only zone" },
  { name: "Riverside Embankment",        type: "waypoint", note: "Scenic, footpath 3m wide" },
  { name: "Main Bridge",                 type: "waypoint", note: "Busy at peak hours" },
  { name: "End — Central Park Gate",     type: "end",      note: "Staffed entrance, safe" },
];

export default function RouteDetailPage() {
  const navigate   = useNavigate();
  const { id }     = useParams();
  const [saved, setSaved]       = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

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
            <p className="font-['Inter',sans-serif] font-bold text-[32px] text-white tracking-[-0.7px] leading-[40px]">Downtown Loop</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">8.7 mi · Safety score 9.2</p>
          </div>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[900px]">
        {/* Map */}
        <div className="rounded-[20px] overflow-hidden h-[220px] relative border border-[rgba(255,255,255,0.08)]">
          <img alt="Route map" className="w-full h-full object-cover" src={imgRouteMap} />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,6,8,0.4)] to-transparent" />
          <div className="absolute bottom-[16px] left-[16px] flex gap-[8px]">
            <SafetyBadge score={9.2} />
            <span className="font-['Inter',sans-serif] font-medium text-[12px] px-[10px] py-[4px] rounded-[20px] bg-[rgba(10,6,8,0.6)] border border-[rgba(255,255,255,0.15)] text-white">Scenic Route</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-[12px]">
          <PrimaryButton label="Start Navigation" onClick={() => {}} />
          <button onClick={() => setSaved(!saved)}
            className={`flex items-center gap-[8px] h-[52px] px-[24px] rounded-[16px] border cursor-pointer transition-colors ${saved ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.35)]" : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]"}`}>
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
        <Tabs tabs={["Overview", "Safety", "Reviews", "Waypoints"]} active={activeTab} onChange={setActiveTab} />

        {activeTab === "Overview" && (
          <div className="flex gap-[14px]">
            {[
              { label: "Distance",   value: "8.7 mi" },
              { label: "Duration",   value: "25 min"  },
              { label: "Elevation",  value: "+124 ft"  },
              { label: "Difficulty", value: "Easy"     },
            ].map((s) => (
              <div key={s.label} className={`${cardBase} px-[20px] py-[16px] flex-1`}>
                <p className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.4)] uppercase tracking-[0.6px] mb-[4px]">{s.label}</p>
                <p className="font-['Inter',sans-serif] font-bold text-[20px] text-white tracking-[-0.4px]">{s.value}</p>
              </div>
            ))}
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

        {activeTab === "Waypoints" && (
          <div className={`${cardBase} overflow-hidden`}>
            {waypoints.map((w, i) => (
              <div key={w.name} className={`flex items-center gap-[16px] px-[20px] py-[14px] ${i < waypoints.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}>
                <div className={`size-[10px] rounded-full shrink-0 ${w.type === "start" ? "bg-[#22c55e]" : w.type === "end" ? "bg-[#c42050]" : "bg-[rgba(255,255,255,0.25)]"}`} />
                <div className="flex-1">
                  <p className="font-['Inter',sans-serif] font-medium text-[13px] text-white">{w.name}</p>
                  <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.35)]">{w.note}</p>
                </div>
                <span className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.25)]">{(i * 1.8 + 0.5).toFixed(1)} mi</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
