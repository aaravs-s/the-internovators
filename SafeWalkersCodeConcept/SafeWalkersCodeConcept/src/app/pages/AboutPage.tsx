import { useState } from "react";
import { cardBase } from "@/app/components/ui";
import { imgSWLogo } from "@/app/assets";

const faqs = [
  { q: "How is the safety score calculated?",  a: "We aggregate crime reports, lighting data, traffic density, community reports, and historical incident data from multiple sources, updated every 15 minutes." },
  { q: "Is my location data stored?",          a: "Location data is only used in real-time for route generation. We do not store precise location history unless you explicitly enable route saving." },
  { q: "How do I report an unsafe area?",      a: "Tap the flag icon on any map view or route detail screen. Reports are reviewed within 30 minutes during peak hours." },
  { q: "Does the app work offline?",           a: "Downloaded routes work fully offline. Real-time safety data requires a connection, but cached safety scores from your last sync remain available." },
];

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">About</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">SafeWalkers v2.4.1</p>
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
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Version 2.4.1 · © 2024 SafeWalkers Inc.</p>
          </div>
          <div className="flex gap-[8px]">
            {["Twitter", "Instagram"].map((s) => (
              <div key={s} className="h-[36px] px-[14px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[10px] flex items-center cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                <span className="font-['Inter',sans-serif] font-medium text-[12px] text-[rgba(255,255,255,0.4)]">{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-3 gap-[12px]">
          {[{ label: "Active Users", value: "128K" }, { label: "Routes Mapped", value: "42K" }, { label: "Safety Reports", value: "1.2M" }].map((s) => (
            <div key={s.label} className={`${cardBase} px-[24px] py-[20px] text-center`}>
              <p className="font-['Inter',sans-serif] font-bold text-[30px] text-white tracking-[-0.8px]">{s.value}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.4)] mt-[4px]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className={`${cardBase} p-[24px]`}>
          <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white mb-[12px]">Our Mission</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.55)] leading-[22px]">
            SafeWalkers is dedicated to helping pedestrians navigate cities safely. We analyse crime reports, traffic patterns, lighting conditions, and community feedback to suggest the safest routes — so every walk is a confident one.
          </p>
        </div>

        {/* FAQ accordion */}
        <div>
          <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white mb-[12px]">Frequently Asked Questions</p>
          <div className={`${cardBase} overflow-hidden`}>
            {faqs.map((f, i) => (
              <div key={i} className={i < faqs.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-[20px] py-[16px] cursor-pointer text-left hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                  <span className="font-['Inter',sans-serif] font-medium text-[14px] text-white">{f.q}</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 ml-[12px] transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    <path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-[20px] pb-[16px]">
                    <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.45)] leading-[20px]">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-[10px]">
          {["Privacy Policy", "Terms of Service", "Contact Support", "Rate the App"].map((link) => (
            <div key={link} className={`${cardBase} px-[18px] py-[14px] flex items-center justify-between cursor-pointer hover:border-[rgba(255,255,255,0.15)] transition-colors`}>
              <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[#0a84ff]">{link}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 12L10 8L6 4" stroke="rgba(10,132,255,0.5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
