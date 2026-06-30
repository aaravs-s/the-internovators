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
    if (username === "" || password === "") {
      setError("Please fill out all fields.");
      return;
    }
    try {
      await loginAndRefresh(username, password, refreshUser);
      navigate("/explore");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login failed");
    }
  };

  return (
    <div className="flex flex-col gap-[0]">
      <div className="mb-[28px]">
        <p className="font-['Inter',sans-serif] font-bold text-[28px] text-white tracking-[-0.7px] mb-[6px]">Sign in</p>
        <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[var(--text-note-subtitle)]">Welcome back — your city awaits.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FormInput label="Username" placeholder="Enter your username" value={username} onChange={setUsername} />
        <div className="mt-[16px]">
          <FormInput label="Password" placeholder="Enter your password" type="password" value={password} onChange={setPassword} />
        </div>

        <div className="mt-[12px]">
          <Link to="/forgot-password" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[var(--back-text-color)]">
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
        <div className="flex-1 h-px bg-[var(--card-bg-secondary-hover)]" />
        <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[var(--placeholder-text)]">or continue with</span>
        <div className="flex-1 h-px bg-[var(--card-bg-secondary-hover)]" />
      </div>

      {/* Social auth */}
      <div className="flex gap-[10px] mt-[16px]">
        {["Google", "Apple"].map((p) => (
          <button key={p} onClick={() => navigate("/home")}
            className="flex-1 h-[44px] bg-[var(--option-bg-hover)] border border-[var(--select-border)] rounded-[12px] flex items-center justify-center gap-[8px] cursor-pointer hover:bg-[var(--select-border)] transition-colors">
            <span className="font-['Inter',sans-serif] font-medium text-[14px] text-[var(--text-body)]">{p}</span>
          </button>
        ))}
      </div>

      <div className="mt-[20px] flex items-center gap-[6px]">
        <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[var(--grey-muted)]">{"Don't have an account?"}</span>
        <Link to="/signup" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[var(--text-body)]">Sign Up</Link>
      </div>
    </div>
  );
}
