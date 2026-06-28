import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FormInput, PrimaryButton } from "@/app/components/ui";
import { loginAndRefresh } from "@/app/api/auth";
import { useAuth } from "../../auth/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      await loginAndRefresh(username, password, refreshUser);
      navigate("/home");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
    }
  };

  return (
    <div className="flex flex-col gap-[0]">
      <div className="mb-[28px]">
        <p className="font-['Inter',sans-serif] font-bold text-[28px] text-white tracking-[-0.7px] mb-[6px]">Sign in</p>
        <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">Welcome back — your city awaits.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput label="Username" placeholder="Enter your username" value={username} onChange={setUsername} />
        <div className="mt-[16px]">
          <FormInput label="Password" placeholder="Enter your password" type="password" value={password} onChange={setPassword} />
        </div>

        <div className="mt-[12px]">
          <Link to="/forgot-password" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#0a84ff]">
            Forgot Password?
          </Link>
        </div>

        {/* Error display */}
        {error && (
          <p className="text-red-400">
            {error}
          </p>
        )}

        <div className="mt-[20px]">
          <PrimaryButton label="Sign In" wide />
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-[12px] mt-[20px]">
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
        <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.25)]">or continue with</span>
        <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
      </div>

      {/* Social auth */}
      <div className="flex gap-[10px] mt-[16px]">
        {["Google", "Apple"].map((p) => (
          <button key={p} onClick={() => navigate("/home")}
            className="flex-1 h-[44px] bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.1)] rounded-[12px] flex items-center justify-center gap-[8px] cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors">
            <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[rgba(255,255,255,0.6)]">{p}</span>
          </button>
        ))}
      </div>

      <div className="mt-[20px] flex items-center gap-[6px]">
        <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.32)]">{"Don't have an account?"}</span>
        <Link to="/signup" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[rgba(255,255,255,0.7)]">Sign Up</Link>
      </div>
    </div>
  );
}
