import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { FormInput, PrimaryButton } from "@/app/components/ui";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]   = useState("");
  const [sent, setSent]     = useState(false);

  return (
    <div className="flex flex-col">
      <Link to="/" className="flex items-center gap-[6px] mb-[32px] w-fit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 4L6 8L10 12" stroke="#0a84ff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        <span className="font-['Inter',sans-serif] font-semibold text-[14px] text-[#0a84ff]">Back to Login</span>
      </Link>

      <p className="font-['Inter',sans-serif] font-bold text-[32px] text-white tracking-[-0.8px] leading-[40px] mb-[8px]">Reset Password</p>
      <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)] leading-[21px] mb-[28px]">
        Enter your email and we'll send you a reset link within minutes.
      </p>

      {!sent ? (
        <>
          <FormInput label="Email Address" placeholder="Enter your email" type="email" value={email} onChange={setEmail} />
          <div className="mt-[20px]">
            <PrimaryButton label="Send Reset Link" onClick={() => setSent(true)} wide />
          </div>
        </>
      ) : (
        <div className="bg-[rgba(10,132,255,0.08)] border border-[rgba(10,132,255,0.2)] rounded-[16px] p-[20px]">
          <div className="flex items-center gap-[12px] mb-[10px]">
            <div className="size-[36px] rounded-full bg-[rgba(10,132,255,0.15)] flex items-center justify-center shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4 4 8-8" stroke="#0a84ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="font-['Inter',sans-serif] font-semibold text-[15px] text-white">Email sent!</p>
          </div>
          <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.55)] leading-[20px]">
            We sent a reset link to{" "}
            <span className="text-[#0a84ff]">{email || "your email"}</span>. Check your spam folder if it doesn't arrive.
          </p>
          <button onClick={() => setSent(false)} className="mt-[14px] cursor-pointer">
            <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.35)]">
              Didn't get it? <span className="text-[#0a84ff]">Resend</span>
            </span>
          </button>
        </div>
      )}

      <div className="mt-[20px] flex items-center gap-[6px]">
        <span className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.32)]">Remember your password?</span>
        <Link to="/" className="font-['Inter',sans-serif] font-semibold text-[14px] text-[rgba(255,255,255,0.7)]">Sign In</Link>
      </div>
    </div>
  );
}
