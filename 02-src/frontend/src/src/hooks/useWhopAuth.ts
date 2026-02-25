import { useState, useEffect, useCallback } from "react";
import { loginWithWhop, type WhopUser } from "@/lib/whop-auth";

interface WhopAuthState {
  user: WhopUser | null;
  token: string | null;
  isMember: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

/**
 * Hook for reading Whop auth state from localStorage.
 * No context provider needed — localStorage is the source of truth.
 */
export function useWhopAuth(): WhopAuthState {
  const [user, setUser] = useState<WhopUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Read auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem("whop_token");
      const storedUser = localStorage.getItem("whop_user");
      const storedIsMember = localStorage.getItem("whop_is_member");

      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        // Only set state if parse succeeded — avoid partial state
        setToken(storedToken);
        setUser(parsed);
        setIsMember(storedIsMember === "true");
      }
    } catch (err) {
      // Clear corrupted auth state to prevent partial hydration
      localStorage.removeItem("whop_token");
      localStorage.removeItem("whop_user");
      localStorage.removeItem("whop_is_member");
      console.error("Error reading Whop auth state:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async () => {
    await loginWithWhop();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("whop_token");
    localStorage.removeItem("whop_user");
    localStorage.removeItem("whop_is_member");
    setToken(null);
    setUser(null);
    setIsMember(false);
  }, []);

  return { user, token, isMember, isLoading, login, logout };
}
