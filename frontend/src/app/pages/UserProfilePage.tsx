import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { cardBase, SafetyBadge, RouteCard } from "@/app/components/ui";
import { socialUsers } from "@/app/data";

interface OtherUser {
  id: string,
  username: string
}

interface UserPublic {
  id: string,
  username: string,
  bio: string,
  join_year: string,
  followers: OtherUser[],
  following: OtherUser[]
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState<UserPublic>({ 
    id: userId ?? "",
    username: "",
    bio: "",
    join_year: "2026",
    followers: [],
    following: []
  });
  const [following, setFollowing] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadUser = async () => {
      try {
      const response = await fetch(`/api/auth/other-user?id=${userId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to load user.");
      }

      const user_public = await response.json();

      setUser({
        id: userId ?? "",
        username: user_public.username,
        bio: user_public.bio,
        join_year: user_public.created_at.split("-")[0],
        followers: [],
        following: []
      });
      } catch (err) {
        console.error(err);
      }
    };

    loadUser();
  }, []);

  useEffect(() => {
    const loadSavedRoutes = async () => {
      try {
        const response = await fetch(`/api/routes/get-other-user-saved/${userId}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to load saved routes");
        }

        const saved_routes = await response.json();

        setSaved((_) => {
          return new Set<string>(saved_routes.map((saved_route) => saved_route.id))
        });
      } catch (err) {
        console.error(err);
      }
    };

    loadSavedRoutes();
  }, []);

  return (
    <>
      <div className="relative shrink-0 w-full">
        <div aria-hidden className="absolute border-[rgba(255,255,255,0.05)] border-b border-solid inset-0 pointer-events-none" />
        <div className="flex items-center gap-[12px] pb-[17px] pt-[28px] px-[32px]">
          <button onClick={() => navigate("/social")}
            className="flex items-center gap-[6px] h-[40px] px-[14px] bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.1)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.09)] transition-colors">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8L10 12" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
            </svg>
            <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.6)]">Back</span>
          </button>
          <div>
            <p className="font-['Inter',sans-serif] font-bold text-[32px] text-white tracking-[-0.7px] leading-[40px]">{user.username}</p>
            <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.4)]">{saved.size} routes saved</p>
          </div>
        </div>
      </div>

      <div className="px-[32px] py-[24px] flex flex-col gap-[20px] max-w-[860px]">
        {/* Profile card */}
        <div className={`${cardBase} p-[24px]`}>
          <div className="flex items-center gap-[20px] mb-[14px]">
            <div className="size-[80px] rounded-full bg-[rgba(255,255,255,0.1)] flex items-center justify-center shrink-0 border border-[rgba(255,255,255,0.12)]">
              <span className="font-['Inter',sans-serif] font-bold text-[30px] text-white opacity-50">{user.username.length > 0 ? user.username[0].toUpperCase() : ""}</span>
            </div>
            <div className="flex-1">
              <p className="font-['Inter',sans-serif] font-bold text-[22px] text-white tracking-[-0.5px] mb-[4px]">{user.username}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[13px] text-[rgba(255,255,255,0.4)]">Joined {user.join_year}</p>
            </div>
            <div className="flex gap-[10px]">
              {/* <button className="flex items-center gap-[8px] h-[40px] px-[16px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-[12px] cursor-pointer hover:bg-[rgba(255,255,255,0.08)] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2v12M2 8h12" stroke="rgba(255,255,255,0.5)" strokeLinecap="round" strokeWidth="1.5" />
                </svg>
                <span className="font-['Inter',sans-serif] font-medium text-[13px] text-[rgba(255,255,255,0.6)]">Message</span>
              </button> */}
              <button onClick={() => setFollowing(!following)}
                className={`px-[20px] py-[8px] rounded-[12px] cursor-pointer border transition-colors ${following ? "bg-[rgba(196,32,80,0.15)] border-[rgba(196,32,80,0.35)]" : "border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.07)] hover:bg-[rgba(255,255,255,0.1)]"}`}>
                <span className={`font-['Inter',sans-serif] font-semibold text-[14px] ${following ? "text-[#c42050]" : "text-white"}`}>{following ? "Following" : "Follow"}</span>
              </button>
            </div>
          </div>
          <p className="font-['Inter',sans-serif] font-normal text-[14px] text-[rgba(255,255,255,0.55)] leading-[22px]">
            {user.bio}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-[12px]">
          {[{ label: "Saved", value: saved.size }, { label: "Followers", value: user.followers.length }, { label: "Following", value: user.following.length }].map((s) => (
            <div key={s.label} className={`${cardBase} px-[20px] py-[16px] text-center`}>
              <p className="font-['Inter',sans-serif] font-bold text-[26px] text-white tracking-[-0.6px]">{s.value}</p>
              <p className="font-['Inter',sans-serif] font-normal text-[12px] text-[rgba(255,255,255,0.4)] mt-[2px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
