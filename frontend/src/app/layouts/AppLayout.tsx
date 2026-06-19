import { Outlet, NavLink, useNavigate } from "react-router";
import { DarkBackground, IconHome, IconBookmark, IconCompass, IconSocial, IconGear, IconBell } from "@/app/components/ui";
import { imgSWLogo, imgProfile } from "@/app/assets";

const UNREAD = 3; // In a real app this would come from global state / context

type NavDef = { to: string; label: string; icon: (c: string) => React.ReactNode; badge?: number };

const navItems: NavDef[] = [
  { to: "/home",    label: "Home",    icon: (c) => <IconHome     color={c} /> },
  { to: "/saved",   label: "Saved",   icon: (c) => <IconBookmark color={c} />, badge: 12 },
  { to: "/explore", label: "Explore", icon: (c) => <IconCompass  color={c} /> },
  { to: "/social",  label: "Social",  icon: (c) => <IconSocial   color={c} />, badge: 3 },
  { to: "/about",   label: "About",   icon: (c) => <IconHome     color={c} /> },
];

function Sidebar() {
  const navigate = useNavigate();

  return (
    <div
      className="absolute flex flex-col items-start left-0 top-0 w-[256px] h-full z-10"
      style={{ background: "rgba(10,6,8,0.65)", backdropFilter: "blur(20px)" }}
    >
      <div aria-hidden className="absolute border-[rgba(255,255,255,0.07)] border-r border-solid inset-0 pointer-events-none" />

      {/* Logo + bell */}
      <div className="relative shrink-0 w-full flex items-center justify-between pb-[20px] pt-[32px] px-[24px]">
        <div className="h-[54px] w-[81px]">
          <img alt="SafeWalkers" className="w-full h-full object-contain" src={imgSWLogo} />
        </div>
        <NavLink to="/notifications" className="cursor-pointer p-[6px] rounded-[10px] hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          <IconBell color="rgba(255,255,255,0.45)" badge={UNREAD} />
        </NavLink>
      </div>

      {/* Section label */}
      <div className="px-[24px] mb-[6px]">
        <p className="font-['Inter',sans-serif] font-medium text-[10px] text-[rgba(255,255,255,0.2)] tracking-[1px] uppercase">Navigation</p>
      </div>

      {/* Nav items */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="flex flex-col gap-[2px] px-[12px]">
          {navItems.map(({ to, label, icon, badge }) => (
            <NavLink key={to} to={to} end={to === "/home"}
              className={({ isActive }) =>
                `relative rounded-[14px] w-full text-left flex items-center gap-[12px] px-[17px] py-[12px] cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[rgba(196,32,80,0.15)] border border-[rgba(196,32,80,0.25)]"
                    : "hover:bg-[rgba(255,255,255,0.04)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon(isActive ? "#c42050" : "rgba(255,255,255,0.35)")}
                  <span className={`font-['Inter',sans-serif] font-medium text-[15px] tracking-[-0.15px] flex-1 ${isActive ? "text-[#c42050]" : "text-[rgba(255,255,255,0.55)]"}`}>
                    {label}
                  </span>
                  {badge && (
                    <div className={`rounded-full px-[7px] py-[1px] border ${label === "Saved" ? "bg-[rgba(196,32,80,0.2)] border-[rgba(196,32,80,0.3)]" : "bg-[rgba(10,132,255,0.15)] border-[rgba(10,132,255,0.25)]"}`}>
                      <span className={`font-['Inter',sans-serif] font-semibold text-[10px] ${label === "Saved" ? "text-[#c42050]" : "text-[#0a84ff]"}`}>{badge}</span>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full px-[24px] my-[8px]">
        <div className="h-px bg-[rgba(255,255,255,0.06)]" />
      </div>

      {/* Settings + sign out */}
      <div className="w-full px-[12px] pb-[16px] flex flex-col gap-[2px]">
        <NavLink to="/settings"
          className={({ isActive }) =>
            `relative rounded-[14px] w-full flex items-center gap-[12px] px-[17px] py-[12px] cursor-pointer transition-colors ${isActive ? "bg-[rgba(196,32,80,0.15)] border border-[rgba(196,32,80,0.25)]" : "hover:bg-[rgba(255,255,255,0.04)]"}`
          }
        >
          {({ isActive }) => (
            <>
              <IconGear color={isActive ? "#c42050" : "rgba(255,255,255,0.35)"} />
              <span className={`font-['Inter',sans-serif] font-medium text-[15px] ${isActive ? "text-[#c42050]" : "text-[rgba(255,255,255,0.55)]"}`}>Settings</span>
            </>
          )}
        </NavLink>

        <button onClick={() => navigate("/")}
          className="flex gap-[12px] items-center px-[17px] py-[11px] cursor-pointer w-full rounded-[14px] hover:bg-[rgba(255,255,255,0.04)] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 2H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M12 13l4-4-4-4M16 9H7" stroke="rgba(255,255,255,0.3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          </svg>
          <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.3)]">Sign out</span>
        </button>
      </div>
    </div>
  );
}

function AppHeader() {
  const navigate = useNavigate();
  return (
    <div className="absolute top-[16px] right-[24px] flex items-center gap-[10px] z-10">
      <NavLink to="/notifications"
        className="p-[10px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors"
      >
        <IconBell color="rgba(255,255,255,0.6)" badge={UNREAD} />
      </NavLink>
      <button onClick={() => navigate("/profile")}
        className="size-[40px] rounded-full overflow-hidden border border-[rgba(255,255,255,0.15)] cursor-pointer shrink-0 hover:border-[rgba(255,255,255,0.3)] transition-colors"
      >
        <img alt="" className="w-full h-full object-cover" src={imgProfile} />
      </button>
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="bg-[#0a0608] relative size-full">
      {/* <DarkBackground /> */}
      <Sidebar />
      {/* Main content area */}
      <div className="absolute flex flex-col left-[256px] top-0 h-[944px] w-[1293px] overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
