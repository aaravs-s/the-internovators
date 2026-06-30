import { useState } from "react";
import { loginSvg, homeSvg, imgBg, imgLogoBg, imgSwBadge, imgStores, imgRouteMap } from "@/app/assets";

// ── Design tokens ─────────────────────────────────────────────────────────────
export const primaryGradient = {
  backgroundImage: "linear-gradient(179.019deg, rgb(176,24,72) 8.2137%, rgb(122,15,46) 91.786%)",
};
export const cardBase = "bg-[var(--section-divide-border)] border border-[var(--card-bg-secondary-hover)] rounded-[20px]";

// ── Dark atmospheric background ───────────────────────────────────────────────
export function DarkBackground() {
  return (
    <div className="absolute h-[944px] left-0 overflow-clip top-0 w-[1549px]">
      <div className="absolute h-[1085.594px] left-[-0.77px] top-[-47.19px] w-[1703.891px]">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgBg} />
      </div>
    </div>
  );
}

// ── Left branding panel (auth screens) ───────────────────────────────────────
export function AuthLeftPanel() {
  return (
    <div className="absolute flex flex-col h-[944px] items-center justify-center left-0 px-[64px] top-0 w-[774.5px]">
      <div className="flex flex-col gap-[40px] items-center">
        <div className="h-[196px] relative w-[240px]">
          <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgLogoBg} />
          <div className="relative size-full">
            <div className="absolute h-[87px] left-[110px] top-[110px] w-[130px]">
              <img alt="" className="absolute inset-0 max-w-none object-contain pointer-events-none size-full" src={imgSwBadge} />
            </div>
          </div>
        </div>
        <div className="w-[282px] flex flex-col items-center">
          <div className="font-['Inter',sans-serif] font-bold text-[48px] text-center text-white tracking-[-1.2px]">
            <p className="leading-[60px] mb-0">Welcome to</p>
            <p className="leading-[60px]">SafeWalkers</p>
          </div>
          <p className="font-['Inter',sans-serif] font-normal text-[16px] text-[var(--text-note-subtitle)] text-center leading-[26px] pt-[16px]">
            Your trusted companion for safe<br />pedestrian routes.
          </p>
        </div>
        <div className="opacity-20 w-[50.406px]">
          <img alt="" className="h-[36px] w-full object-contain" src={imgStores} />
        </div>
      </div>
    </div>
  );
}

// ── Primary gradient button ───────────────────────────────────────────────────
export function PrimaryButton({ label, onClick, wide }: { label: string; onClick?: () => void; wide?: boolean }) {
  return (
    <button
      onClick={onClick}
      type="submit"
      className={`drop-shadow-[0px_6px_7px_var(--primary-shadow)] flex gap-[8px] h-[52px] items-center justify-center relative rounded-[16px] shrink-0 cursor-pointer transition-opacity hover:opacity-90 active:opacity-80 ${wide ? "w-full" : "w-[384px]"}`}
      style={primaryGradient}
    >
      <span className="font-['Inter',sans-serif] font-semibold text-[16px] text-white tracking-[-0.16px]">{label}</span>
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
        <path d="M3.54167 8.5H13.4583" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.77083" />
        <path d={loginSvg.p82c4780} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.77083" />
      </svg>
    </button>
  );
}

// ── Text input ────────────────────────────────────────────────────────────────
export function FormInput({ label, placeholder, type = "text", value, onChange }: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="relative w-full">
      <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-[var(--map-marker-border)] tracking-[0.065px] mb-[8px]">{label}</p>
      <div className="bg-[var(--option-bg-hover)] h-[50px] relative rounded-[14px] w-full">
        <div aria-hidden className="absolute border border-[var(--select-border)] border-solid inset-0 pointer-events-none rounded-[14px]" />
        <input
          type={isPassword && !show ? "password" : "text"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="absolute inset-0 bg-transparent px-[17px] text-[15px] font-['Inter',sans-serif] text-white placeholder-[var(--grey-muted)] tracking-[-0.15px] outline-none rounded-[14px]"
          style={{ paddingRight: isPassword ? "50px" : "17px" }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow(!show)} className="absolute right-[12px] top-1/2 -translate-y-1/2 opacity-60 p-[4px]">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d={loginSvg.p58c8400}  stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" strokeWidth="1.41667" />
              <path d={loginSvg.p27765100} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.35" strokeWidth="1.41667" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Safety badge ──────────────────────────────────────────────────────────────
export function SafetyBadge({ score }: { score: number }) {
  const normalizedScore = score > 10 ? score / 10 : score;
  const color  = normalizedScore >= 9 ? "var(--green)" : normalizedScore >= 7.5 ? "var(--orange)" : "#ef4444";
  const bg     = normalizedScore >= 9 ? "rgba(34,197,94,0.12)"  : normalizedScore >= 7.5 ? "rgba(245,158,11,0.12)" : "rgba(239,68,68,0.12)";
  const border = normalizedScore >= 9 ? "rgba(34,197,94,0.25)"  : normalizedScore >= 7.5 ? "rgba(245,158,11,0.25)" : "rgba(239,68,68,0.25)";
  return (
    <div className="flex items-center gap-[6px] px-[10px] py-[4px] rounded-[20px]" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="size-[6px] rounded-full" style={{ background: color }} />
      <span className="font-['Inter',sans-serif] font-semibold text-[12px]" style={{ color }}>{normalizedScore.toFixed(1)}</span>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-[2px] bg-[var(--section-divide-border)] rounded-[14px] p-[3px]">
      {tabs.map((t) => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-[16px] py-[7px] rounded-[11px] cursor-pointer font-['Inter',sans-serif] font-medium text-[13px] tracking-[-0.1px] transition-colors ${active === t ? "bg-[var(--primary-bg-dark)] text-[var(--primary)] border border-[var(--primary-selected-border)]" : "text-[var(--text-note-subtitle)]"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
export function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      className="relative w-[44px] h-[26px] rounded-full cursor-pointer transition-all"
      style={on ? primaryGradient : { background: "var(--grey-light-border-hover)" }}
    >
      <div className={`absolute top-[3px] size-[20px] rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-[21px]" : "translate-x-[3px]"}`} />
    </button>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────
export function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-[2px]">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.51L6 8.885L2.91 10.51L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
            fill={s <= value ? "var(--primary)" : "var(--grey-light-border-hover)"} />
        </svg>
      ))}
    </div>
  );
}

// ── Route card ────────────────────────────────────────────────────────────────
export function RouteCard({ distance, duration, label, safety, onClick }: {
  distance: string; duration: string; label: string; safety?: number; onClick: () => void;
}) {
  return (
    <div onClick={onClick} className="bg-[var(--section-divide-border)] rounded-[20px] w-[340px] flex-shrink-0 overflow-hidden relative border border-[var(--card-bg-secondary-hover)] cursor-pointer hover:border-[rgba(255,255,255,0.16)] transition-colors">
      <div className="flex items-center justify-between px-[16px] pt-[12px] pb-[8px]">
        <div>
          <p className="font-['Inter',sans-serif] font-semibold text-[13px] text-white mb-[4px]">{label}</p>
          <div className="flex gap-[10px] items-center">
            <div className="flex gap-[4px] items-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d={homeSvg.p7c73480} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
                <path d={homeSvg.p2d617c80} stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
              </svg>
              <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[var(--text-body)]">{distance}</span>
            </div>
            <div className="bg-[var(--select-border)] h-[10px] w-px" />
            <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[var(--text-body)]">{duration}</span>
          </div>
        </div>
        <div className="flex items-center gap-[8px]">
          {safety && <SafetyBadge score={safety} />}
          <span className="font-['Inter',sans-serif] font-semibold text-[12px] text-[var(--back-text-color)]">View →</span>
        </div>
      </div>
      <div className="h-[84px] w-full overflow-hidden">
        <img alt="" className="w-full h-full object-cover pointer-events-none" src={imgRouteMap} />
      </div>
    </div>
  );
}

// ── SVG icons ─────────────────────────────────────────────────────────────────
export function IconBookmark({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d={homeSvg.p2f4e1d80} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.83333" />
    </svg>
  );
}
export function IconCompass({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.4" />
      <path d="M14.5 7.5L12.5 12.5L7.5 14.5L9.5 9.5L14.5 7.5Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}
export function IconSocial({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d={homeSvg.p80127a0}  stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
      <path d={homeSvg.p11b7c570} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
      <path d={homeSvg.p1de049e0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
      <path d={homeSvg.p35b71ef0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
    </svg>
  );
}
export function IconHome({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d={homeSvg.p9bbea0}   stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
      <path d={homeSvg.p30314bf0} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.375" />
    </svg>
  );
}
export function IconGear({ color }: { color: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="11" r="3" stroke={color} strokeWidth="1.4" />
      <path d="M11 2v2M11 18v2M2 11h2M18 11h2M4.93 4.93l1.41 1.41M15.66 15.66l1.41 1.41M4.93 17.07l1.41-1.41M15.66 6.34l1.41-1.41" stroke={color} strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}
export function IconBell({ color, badge }: { color: string; badge?: number }) {
  return (
    <div className="relative">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M11 2a7 7 0 0 0-7 7v4l-2 2v1h18v-1l-2-2V9a7 7 0 0 0-7-7Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
        <path d="M9 18a2 2 0 0 0 4 0" stroke={color} strokeLinecap="round" strokeWidth="1.4" />
      </svg>
      {badge && badge > 0 ? (
        <div className="absolute -top-[4px] -right-[4px] size-[14px] rounded-full bg-[var(--primary)] flex items-center justify-center">
          <span className="font-['Inter',sans-serif] font-bold text-[8px] text-white leading-none">{badge > 9 ? "9+" : badge}</span>
        </div>
      ) : null}
    </div>
  );
}
