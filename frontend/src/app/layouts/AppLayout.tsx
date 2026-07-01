import { Outlet, NavLink, useNavigate } from "react-router";

import { IconHome, IconBookmark, IconCompass, IconSocial, IconGear, IconAbout } from "@/app/components/ui";
import { imgSWLogo } from "@/app/assets";
import { useAuth } from "../../auth/AuthContext";

type NavDef = { to: string; label: string; icon: (c: string) => React.ReactNode; badge?: number };

const navItems: NavDef[] = [
  // { to: "/home",     label: "Home",     icon: (c) => <IconHome     color={c} /> },
  { to: "/explore",  label: "Explore",  icon: (c) => <IconHome  color={c} /> },
  { to: "/saved",    label: "Saved",    icon: (c) => <IconBookmark color={c} /> },
  { to: "/generate", label: "Generate", icon: (c) => <IconCompass color={c} /> },
  { to: "/social",  label: "Community",  icon: (c) => <IconSocial color={c} /> },
  { to: "/about",   label: "About",   icon: (c) => <IconAbout     color={c} /> },
];

function Sidebar() {
  const navigate = useNavigate();

  const { user, user_loading, refreshUser, logout } = useAuth();


  if (user_loading) {
    return <div>Loading...</div>;
  }

  return (
    <div
      className="fixed flex flex-col items-start left-0 top-0 w-[256px] h-full z-10"
      style={{ background: "var(--card-gradient-black)", backdropFilter: "blur(20px)" }}
    >
      <div aria-hidden className="absolute border-[var(--white-transparent)] border-r border-solid inset-0 pointer-events-none" />

      {/* Logo */}
      <div className="relative shrink-0 w-full flex items-center justify-between pb-[20px] pt-[32px] px-[24px]">
        {/* <div className="h-[100px] w-[81px]"> */}
          <img alt="SafeWalkers" className="w-full h-full object-contain" src={imgSWLogo} />
        {/* </div> */}
      </div>

      {/* Section label */}
      <div className="px-[24px] mb-[6px]">
        <p className="font-['Inter',sans-serif] font-medium text-[10px] text-[var(--grey-muted)] tracking-[1px] uppercase">Navigation</p>
      </div>

      {/* Nav items */}
      <div className="flex-1 min-h-0 w-full overflow-y-auto">
        <div className="flex flex-col gap-[2px] px-[12px]">
          {navItems.map(({ to, label, icon, badge }) => (
            <NavLink key={to} to={to} end={to === "/explore"}
              className={({ isActive }) =>
                `relative rounded-[14px] w-full text-left flex items-center gap-[12px] px-[17px] py-[12px] cursor-pointer transition-colors ${
                  isActive
                    ? "bg-[var(--primary-selected-bg)] border border-[var(--primary-dark)]"
                    : "hover:bg-[var(--white-transparent)]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {icon(isActive ? "var(--primary)" : "var(--grey-muted)")}
                  <span className={`font-['Inter',sans-serif] font-medium text-[15px] tracking-[-0.15px] flex-1 ${isActive ? "text-[var(--primary)]" : "text-[var(--text-body)]"}`}>
                    {label}
                  </span>
                  {badge && (
                    <div className={`rounded-full px-[7px] py-[1px] border ${label === "Saved" ? "bg-[var(--primary-dark)] border-[var(--primary-dark)]" : "bg-[var(--dark-blue-bg)] border-[var(--dark-blue-border)]"}`}>
                      <span className={`font-['Inter',sans-serif] font-semibold text-[10px] ${label === "Saved" ? "text-[var(--primary)]" : "text-[var(--back-text-color)]"}`}>{badge}</span>
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
        <div className="h-px bg-[var(--white-transparent)]" />
      </div>

      {/* Settings + sign out */}
      <div className="w-full px-[12px] pb-[16px] flex flex-col gap-[2px]">
        <NavLink to="/settings"
          className={({ isActive }) =>
            `relative rounded-[14px] w-full flex items-center gap-[12px] px-[17px] py-[12px] cursor-pointer transition-colors ${isActive ? "bg-[var(--primary-selected-bg)] border border-[var(--primary-dark)]" : "hover:bg-[var(--white-transparent)]"}`
          }
        >
          {({ isActive }) => (
            <>
              <IconGear color={isActive ? "var(--primary)" : "var(--grey-muted)"} />
              <span className={`font-['Inter',sans-serif] font-medium text-[15px] ${isActive ? "text-[var(--primary)]" : "text-[var(--text-body)]"}`}>Settings</span>
            </>
          )}
        </NavLink>

        <NavLink to="/profile"
          className={({ isActive }) =>
            `relative rounded-[14px] w-full flex items-center gap-[12px] px-[17px] py-[12px] cursor-pointer transition-colors ${isActive ? "bg-[var(--primary-selected-bg)] border border-[var(--primary-dark)]" : "hover:bg-[var(--white-transparent)]"}`
          }
        >
          {({ isActive }) => (
            <>
              <span className={`text-[15px] font-semibold text-[${isActive ? "var(--primary)" : "var(--grey-muted)"}]`}>
                {user?.username?.charAt(0).toUpperCase()}
              </span>
              <span className={`font-['Inter',sans-serif] font-medium text-[15px] ${isActive ? "text-[var(--primary)]" : "text-[var(--text-body)]"}`}>{ user?.username }</span>
            </>
          )}
        </NavLink>

        <button onClick={() => { logout(); navigate("/"); }}
          className="flex gap-[12px] items-center px-[17px] py-[11px] cursor-pointer w-full rounded-[14px] hover:bg-[var(--white-transparent)] transition-colors"
  
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M7 2H3a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4M12 13l4-4-4-4M16 9H7" stroke="var(--grey-muted)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
          </svg>
          <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[var(--grey-muted)]">Sign out</span>
        </button>
      </div>
    </div>
  );
}

export default function AppLayout() {
  return (
    <div className="bg-[#0a0608] relative min-h-screen w-full">
      {/* <DarkBackground /> */}
      <Sidebar />
      {/* Main content area */}
      <div className="absolute flex flex-col left-[256px] right-0 top-0 min-h-screen overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
