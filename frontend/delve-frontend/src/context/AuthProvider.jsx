import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { parseJwt } from "../utils/jwt";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem("token");
    if (!stored) return "";

    const decoded = parseJwt(stored);
    const now = Math.floor(Date.now() / 1000);

    if (decoded?.exp && decoded.exp > now) {
      return stored;
    } else {
      localStorage.removeItem("token");
      return "";
    }
  });

  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
  };

  const logout = () => {
    setToken("");
    localStorage.removeItem("token");
  };

  useEffect(() => {
    if (!token) return;

    const decoded = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);

    if (decoded?.exp) {
      const timeLeft = decoded.exp - now;

      if (timeLeft <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(() => {
        logout();
        alert("🔒 Your session has expired. Please log in again.");
      }, timeLeft * 1000);

      return () => clearTimeout(timer);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
