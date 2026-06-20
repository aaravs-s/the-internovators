import { Outlet } from "react-router";
import { DarkBackground, AuthLeftPanel } from "@/app/components/ui";

export default function AuthLayout() {
  return (
    <div className="bg-[#0a0608] relative size-full">
      <DarkBackground />
      <AuthLeftPanel />
      {/* Right panel — each auth page fills this slot */}
      <div className="absolute flex flex-col h-[944px] items-center justify-center left-[774.5px] px-[48px] top-0 w-[774.5px]">
        <div className="w-[384px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
