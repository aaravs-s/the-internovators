import { useState } from "react";
import { cardBase } from "@/app/components/ui";
import { homeSvg } from "@/app/assets";
import { notifications as initial } from "@/app/data";

const typeColor: Record<string, string> = {
  safety:      "#ef4444",
  social:      "#0a84ff",
  route:       "#22c55e",
  achievement: "#f59e0b",
  system:      "rgba(255,255,255,0.35)",
};

function NotifIcon({ type, color }: { type: string; color: string }) {
  if (type === "safety") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 2L3 6v5c0 4.418 3.134 7.93 7 8.9C16.866 18.93 20 15.418 20 11V6l-7-4H10z" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 8v3M10 13.5v.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
  if (type === "social") return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d={homeSvg.p80127a0}  stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={homeSvg.p11b7c570} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={homeSvg.p35b71ef0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
  if (type === "route") return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
      <path d={homeSvg.p7c73480} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d={homeSvg.p2d617c80} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
  if (type === "achievement") return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="8" r="5.5" stroke={color} strokeWidth="1.4" />
      <path d="M7 14.5l-2 4.5 5-2 5 2-2-4.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
      <path d="M8 8l1.5 1.5L12 6.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
    </svg>
  );
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke={color} strokeWidth="1.4" />
      <path d="M10 9v5" stroke={color} strokeLinecap="round" strokeWidth="1.6" />
      <circle cx="10" cy="6.5" r="0.8" fill={color} />
    </svg>
  );
}

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState(initial);
  const unread = notifs.filter((n) => !n.read).length;

  const markRead  = (id: number) => setNotifs((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll   = () => setNotifs((p) => p.map((n) => ({ ...n, read: true })));

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center justify-between pb-[17px] pt-[28px] px-[32px]">
          <div>
            <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Notifications</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">{unread} unread</p>
          </div>
          {unread > 0 && (
            <button onClick={markAll} className="px-[14px] py-[8px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.09)] transition-colors">
              <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.5)]">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[8px] max-w-[720px]">
        {notifs.map((n) => {
          const color = typeColor[n.type];
          return (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={`${cardBase} text-left w-full cursor-pointer flex items-start gap-[14px] p-[16px] relative hover:border-[rgba(255,255,255,0.15)] transition-colors ${!n.read ? "bg-[rgba(255,255,255,0.07)]" : ""}`}>
              <div className="size-[40px] rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <NotifIcon type={n.type} color={color} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-[8px]">
                  <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-white">{n.title}</p>
                  <span className="font-['Inter',sans-serif] font-normal text-[11px] text-[rgba(255,255,255,0.3)] whitespace-nowrap">{n.time}</span>
                </div>
                <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.45)] leading-[18px] mt-[2px]">{n.body}</p>
              </div>
              {!n.read && <div className="size-[8px] rounded-full bg-[#c42050] mt-[6px] shrink-0" />}
            </button>
          );
        })}
      </div>
    </>
  );
}
