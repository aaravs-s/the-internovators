import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FormInput, PrimaryButton } from "@/app/components/ui";
import { useAuth } from "../../auth/AuthContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [username, setUser]     = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPass]     = useState("");
  const [passConf, setPassConf] = useState("");
  const [error, setError]       = useState("");
  const { refreshUser } = useAuth();

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 5 ? 2 : password.length > 0 ? 1 : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"][strength];

  const createAccount = async () => {
    setError("");
    if (username === "" || email === "" || password === "" || passConf === "") {
      setError("Please fill out all fields.");
      return;
    } else if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    } else if (password !== passConf) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.detail ?? "Signup failed.");
        return;
      }

      await refreshUser();
      navigate("/explore");
    } catch {
      setError("Unable to create your account. Please try again.");
    }
  };

  return (
    <div className="flex flex-col">
      <p className="font-['Inter',sans-serif] font-bold text-[28px] text-white tracking-[-0.7px] mb-[4px]">Create Account</p>
      <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)] mb-[22px]">Join SafeWalkers and walk smarter.</p>

      <div className="flex flex-col gap-[14px]">
        <FormInput label="Username"          placeholder="Choose a username"            value={username} onChange={setUser} />
        <FormInput label="Email Address"     placeholder="Enter your email"            value={email}    onChange={setEmail} />
        <FormInput label="Password"          placeholder="Create a password (8+ chars)" type="password" value={password} onChange={setPass} />
        <FormInput label="Confirm Password"  placeholder="Enter your password again" type="password" value={passConf} onChange={setPassConf} />
      </div>

      {/* Password strength meter */}
      {password.length > 0 && (
        <div className="mt-[10px]">
          <div className="flex gap-[4px]">
            {[1, 2, 3, 4].map((lvl) => (
              <div key={lvl} className="flex-1 h-[3px] rounded-full transition-colors duration-300"
                style={{ background: lvl <= strength ? strengthColor : "rgba(255,255,255,0.1)" }} />
            ))}
          </div>
          <p className="font-['Inter',sans-serif] font-normal text-[11px] mt-[4px]" style={{ color: strengthColor }}>{strengthLabel} password</p>
        </div>
      )}

      {/* Error */}
      {error &&
        <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[#c42050] leading-[18px] mt-3">
          {error}
        </span>
      }

      <div className="mt-[18px]">
        <PrimaryButton label="Create Account" onClick={createAccount} wide />
      </div>

      <div className="mt-[16px] flex items-center gap-[6px]">
        <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.32)]">Already have an account?</span>
        <Link to="/" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[rgba(255,255,255,0.7)]">Sign In</Link>
      </div>
    </div>
  );
}
