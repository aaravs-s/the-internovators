import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FormInput, PrimaryButton } from "@/app/components/ui";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [name, setName]       = useState("");
  const [username, setUser]   = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [agree, setAgree]     = useState(false);

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 5 ? 2 : password.length > 0 ? 1 : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"][strength];

  return (
    <div className="flex flex-col">
      <p className="font-['Inter',sans-serif] font-bold text-[28px] text-white tracking-[-0.7px] mb-[4px]">Create Account</p>
      <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)] mb-[22px]">Join SafeWalkers and walk smarter.</p>

      <div className="flex flex-col gap-[14px]">
        <FormInput label="Full Name"       placeholder="Enter your full name"        value={name}     onChange={setName} />
        <FormInput label="Username"        placeholder="Choose a username"            value={username} onChange={setUser} />
        <FormInput label="Email Address"   placeholder="Enter your email"            value={email}    onChange={setEmail} />
        <FormInput label="Password"        placeholder="Create a password (8+ chars)" type="password" value={password} onChange={setPass} />
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

      {/* Terms */}
      <button onClick={() => setAgree(!agree)} className="flex items-center gap-[10px] mt-[16px] cursor-pointer text-left">
        <div className={`size-[18px] rounded-[5px] border flex items-center justify-center shrink-0 transition-colors ${agree ? "border-[#c42050] bg-[rgba(196,32,80,0.2)]" : "border-[rgba(255,255,255,0.2)]"}`}>
          {agree && (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#c42050" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] leading-[18px]">
          I agree to the <span className="text-[#0a84ff]">Terms of Service</span> and <span className="text-[#0a84ff]">Privacy Policy</span>
        </span>
      </button>

      <div className="mt-[18px]">
        <PrimaryButton label="Create Account" onClick={() => navigate("/home")} wide />
      </div>

      <div className="mt-[16px] flex items-center gap-[6px]">
        <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.32)]">Already have an account?</span>
        <Link to="/" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[rgba(255,255,255,0.7)]">Sign In</Link>
      </div>
    </div>
  );
}
