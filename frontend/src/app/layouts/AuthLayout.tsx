import { Outlet } from "react-router";
import { DarkBackground, AuthLeftPanel } from "@/app/components/ui";

export default function AuthLayout() {
  return (
    <div className="bg-[#0a0608] min-h-screen flex">
      {/* <DarkBackground /> */}
      <div className="w-1/2"><AuthLeftPanel /></div>
      {/* Right panel — each auth page fills this slot */}
      <div className="flex-1 flex items-center justify-center px-12">
        <div className="w-full max-w-[384px]">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
