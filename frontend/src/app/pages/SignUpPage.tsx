import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { FormInput, PrimaryButton } from "@/app/components/ui";
import { useAuth } from "../../auth/AuthContext";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [username, setUser]     = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPass]     = useState("");
  const [passConf, setPassConf] = useState("");
  const [agree, setAgree]       = useState(false);
  const [error, setError]       = useState("");
  const { user, user_loading, refreshUser, logout } = useAuth();

  const [otherUsernames, setOtherUsernames] = useState<Set<string>>(new Set());
  const [otherEmails, setOtherEmails] = useState<Set<string>>(new Set());

  const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 5 ? 2 : password.length > 0 ? 1 : 0;
  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#f59e0b", "#22c55e"][strength];

  useEffect(() => {
    const loadOtherUsers = async () => {
      try {
        const response = await fetch(`/api/auth/get-other-users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load other users");
        }

        const other_users = await response.json();

        setOtherUsernames((_) => {
          return new Set<string>(other_users.map((user) => user.username))
        });
        setOtherEmails((_) => {
          return new Set<string>(other_users.map((user) => user.email))
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadOtherUsers();
  }, []);

  const createAccount = async () => {
    if (otherUsernames.has(username)) {
      setError(`The username "${username}" is already taken.`);
      return;
    } else if (otherEmails.has(email)) {
      setError(`There is already an account associated with the email ${email}.`);
      return;
    } else if (username === "" || email === "" || password === "" || passConf === "") {
      setError("Please fill out all fields.");
      return;
    } else if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    } else if (password !== passConf) {
      setError("Passwords do not match.");
      return;
    }

    console.log(password)

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
        username,
        password
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      // const error = await res.json();
      // console.error(error.detail);
      setError(data.detail ?? "Signup failed.");
      return;
    }

    refreshUser();

    navigate("/explore")
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
      {error === "" ? <></> : 
        <span className="font-['Inter',sans-serif] font-normal text-[12px] text-[#c42050] leading-[18px] mt-3">
          {error}
        </span>
      }

      {/* Terms */}
      {/* <button onClick={() => setAgree(!agree)} className="flex items-center gap-[10px] mt-[16px] cursor-pointer text-left">
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
      </button> */}

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
