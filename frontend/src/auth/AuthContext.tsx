import { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: string;
  username: string;
  email?: string;
};

type AuthContextType = {
  user: User | null;
  user_loading: boolean;
  refreshUser: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [user_loading, setuser_loading] = useState(true);

  const refreshUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {
        setUser(null);
        return;
      }

      const data = await res.json();
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setuser_loading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, user_loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}