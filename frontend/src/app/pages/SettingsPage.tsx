import { useState } from "react";
import { cardBase, Toggle } from "@/app/components/ui";

type Settings = {
  pushNotifications: boolean;
  safetyAlerts:      boolean;
  friendActivity:    boolean;
  locationTracking:  boolean;
  shareLocation:     boolean;
  anonymousMode:     boolean;
  darkMode:          boolean;
  hapticsEnabled:    boolean;
  autoSave:          boolean;
};

const sections: { title: string; items: { key: keyof Settings; label: string; desc: string }[] }[] = [
  // {
  //   title: "Notifications",
  //   items: [
  //     { key: "pushNotifications", label: "Push Notifications", desc: "Receive alerts and updates" },
  //     { key: "safetyAlerts",      label: "Safety Alerts",      desc: "Real-time warnings for your area" },
  //     { key: "friendActivity",    label: "Friend Activity",    desc: "When friends complete routes" },
  //   ],
  // },
  // {
  //   title: "Privacy & Location",
  //   items: [
  //     { key: "locationTracking", label: "Location Tracking", desc: "Required for route safety" },
  //     { key: "shareLocation",    label: "Share with Friends", desc: "Let friends see your position" },
  //     { key: "anonymousMode",    label: "Anonymous Mode",    desc: "Hide your identity on social" },
  //   ],
  // },
  {
    title: "App Preferences",
    items: [
      { key: "darkMode",       label: "Dark Mode",         desc: "Always-on dark interface" },
      // { key: "hapticsEnabled", label: "Haptic Feedback",   desc: "Vibration on interactions" },
      // { key: "autoSave",       label: "Auto-Save Routes",  desc: "Save completed routes automatically" },
    ],
  },
];

export default function SettingsPage() {
  const [s, setS] = useState<Settings>({
    pushNotifications: true,  safetyAlerts: true,  friendActivity: false,
    locationTracking:  true,  shareLocation: false, anonymousMode: false,
    darkMode:          true,  hapticsEnabled: true, autoSave: true,
  });

  const toggle = (key: keyof Settings) => setS((p) => ({ ...p, [key]: !p[key] }));

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="pb-[17px] pt-[28px] px-[32px]">
          <p className="font-['Inter',sans-serif] font-bold text-[38px] text-white tracking-[-0.8px]">Settings</p>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Customize your SafeWalkers experience.</p>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[24px] max-w-[700px]">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="font-['Inter',sans-serif] font-medium text-[11px] text-[rgba(255,255,255,0.3)] uppercase tracking-[1px] mb-[10px] px-[4px]">{section.title}</p>
            <div className={`${cardBase} overflow-hidden`}>
              {section.items.map((item, i) => (
                <div key={item.key} className={`flex items-center gap-[16px] px-[20px] py-[16px] ${i < section.items.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}>
                  <div className="flex-1">
                    <p className="font-['Inter',sans-serif] font-medium text-[14px] text-white">{item.label}</p>
                    <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.35)] mt-[2px]">{item.desc}</p>
                  </div>
                  <Toggle on={s[item.key]} onToggle={() => toggle(item.key)} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Account */}
        <div>
          <p className="font-['Inter',sans-serif] font-medium text-[11px] text-[rgba(255,255,255,0.3)] uppercase tracking-[1px] mb-[10px] px-[4px]">Account</p>
          <div className={`${cardBase} overflow-hidden`}>
            {[
              { label: "Change Password", color: "rgba(255,255,255,0.7)" },
              { label: "Export My Data",  color: "rgba(255,255,255,0.7)" },
              { label: "Delete Account",  color: "#ef4444"               },
            ].map((a, i, arr) => (
              <div key={a.label} className={`flex items-center justify-between px-[20px] py-[16px] cursor-pointer hover:bg-[rgba(255,255,255,0.03)] transition-colors ${i < arr.length - 1 ? "border-b border-[rgba(255,255,255,0.06)]" : ""}`}>
                <span className="font-['Inter',sans-serif] font-medium text-[14px]" style={{ color: a.color }}>{a.label}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="rgba(255,255,255,0.2)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pb-[8px]">
          <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.2)]">SafeWalkers v1.0.0 · © 2026 The Internovators</p>
        </div>
      </div>
    </>
  );
}
