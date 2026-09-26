import { useEffect, useMemo, useState } from "react";
import { pb } from "../lib/pocketbase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionStatus, setSessionStatus] = useState("active");

  useEffect(() => {
    let active = true;

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (active) {
        setUser(record);
      }
    }, true);

    const validateSession = async () => {
      if (!pb.authStore.isValid) {
        if (pb.authStore.token && pb.authStore.record) {
          pb.authStore.clear();
          if (active) setSessionStatus("expired");
        }
        if (active) {
          setIsLoading(false);
        }
        return;
      }

      try {
        await pb.collection("staff_users").authRefresh({
          requestKey: null,
        });
      } catch (error) {
        // Una cancelación no significa que las credenciales sean inválidas.
        if (active && !error?.isAbort && (error?.status === 401 || error?.status === 403 || (error?.status === 400 && /invalid|expired|token/i.test(error?.message || "")))) {
          pb.authStore.clear();
          setSessionStatus("expired");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    validateSession();

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const authData = await pb
      .collection("staff_users")
      .authWithPassword(email, password);

    setSessionStatus("active");
    return authData.record;
  };

  const logout = () => {
    pb.authStore.clear();
    setSessionStatus("active");
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      sessionStatus,
      login,
      logout,
      isAuthenticated: Boolean(pb.authStore.isValid && user && user.active),
      isAdmin: user?.role === "admin",
      isProfessional: user?.role === "professional",
    }),
    [user, isLoading, sessionStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
