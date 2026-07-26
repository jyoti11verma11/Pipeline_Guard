import { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  signup as apiSignup,
  fetchMe,
  logout as apiLogout,
  TOKEN_KEY,
} from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = checking, false = anon, object = user
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(false);
      return;
    }
    fetchMe()
      .then((u) => setUser(u))
      .catch(() => {
        apiLogout();
        setUser(false);
      });
  }, []);

  async function login(email, password) {
    const u = await apiLogin(email, password);
    setUser(u);
    return u;
  }

  async function signup(email, password, name) {
    const u = await apiSignup(email, password, name);
    setUser(u);
    return u;
  }

  function logout() {
    apiLogout();
    setUser(false);
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
