import { useState } from "react";
import { cardBase } from "@/app/components/ui";
import { imgSWLogo } from "@/app/assets";

const faqs = [
  { q: "How is the safety score calculated?",  a: "We aggregate crime reports and live traffic data from multiple sources, updated for every query." },
  { q: "Is my location data stored?",          a: "No, your location data is never stored. Only route endpoints are saved so that other users can find new routes." },
  // { q: "How do I report an unsafe area?",      a: "Tap the flag icon on any map view or route detail screen. Reports are reviewed within 30 minutes during peak hours." },
  // { q: "Does the app work offline?",           a: "Downloaded routes work fully offline. Real-time safety data requires a connection, but cached safety scores from your last sync remain available." },
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[var(--section-divide-border)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">About</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">SafeWalkers v1.0.0</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[800px]">
        {/* Hero */}
        <div className={`${cardBase} p-[28px] flex items-center gap-[24px]`}>
          <div className="h-[64px] w-[96px] shrink-0">
            <img alt="SafeWalkers" className="w-full h-full object-contain" src={imgSWLogo} />
          </div>
          <div className="flex-1">
            <p className="font-['Inter',sans-serif] font-bold text-[22px] text-white tracking-[-0.5px] mb-[4px]">SafeWalkers</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">Version 1.0.0 · © 2026 The Internovators</p>
          </div>
          <div className="flex gap-[8px]">
            <div key="Instagram" className="h-[36px] px-[14px] bg-[var(--section-divide-border)] border border-[var(--select-border)] rounded-[10px] flex items-center cursor-pointer hover:bg-[var(--card-bg-secondary-hover)] transition-colors">
              <a href="https://www.instagram.com/safe_walkers/" target="_blank"><span className="font-['Inter',sans-serif] font-medium text-[12px] text-[var(--text-note-subtitle)]">Instagram</span></a>
            </div>
          </div>
        </div>

        {/* Platform stats */}
        {/* <div className="grid grid-cols-3 gap-[12px]">
          {[{ label: "Active Users", value: "128K" }, { label: "Routes Mapped", value: "42K" }, { label: "Safety Reports", value: "1.2M" }].map((s) => (
            <div key={s.label} className={`${cardBase} px-[24px] py-[20px] text-center`}>
              <p className="font-['Inter',sans-serif] font-bold text-[30px] text-white tracking-[-0.8px]">{s.value}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[var(--text-note-subtitle)] mt-[4px]">{s.label}</p>
            </div>
          ))}
        </div> */}

        {/* Mission */}
        <div className={`${cardBase} p-[24px]`}>
          <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white mb-[12px]">Our Mission</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-body)] leading-[22px]">
            SafeWalkers is dedicated to helping pedestrians navigate Austin safely. We analyze crime reports and traffic patterns to suggest the safest routes — so every walk is a confident one.
          </p>
        </div>

        {/* FAQ accordion */}
        <div>
          <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white mb-[12px]">Frequently Asked Questions</p>
          <div className={`${cardBase} overflow-hidden`}>
            {faqs.map((f, i) => (
              <div key={i} className={i < faqs.length - 1 ? "border-b border-[var(--card-background-secondary)]" : ""}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-[20px] py-[16px] cursor-pointer text-left hover:bg-[var(--expand-card-hover-bg)] transition-colors">
                  <span className="font-['Inter',sans-serif] font-medium text-[14px] text-white">{f.q}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 ml-[12px] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    <path d="M4 6l4 4 4-4" stroke="var(--grey-muted)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-[20px] pb-[16px]">
                    <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[var(--text-body)] leading-[20px]">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-[10px]">
          {["Privacy Policy", "Terms of Service", "Contact Support", "Rate the App"].map((link) => (
            <div key={link} className={`${cardBase} px-[18px] py-[14px] flex items-center justify-between cursor-pointer hover:border-[var(--grey-light-border-hover)] transition-colors`}>
              <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[var(--back-text-color)]">{link}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="var(--blue)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
