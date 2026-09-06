import { useEffect, useMemo, useState } from "react";
import { pb } from "../lib/pocketbase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      if (active) {
        setUser(record);
      }
    }, true);

    const validateSession = async () => {
      if (!pb.authStore.isValid) {
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
        if (active && !error?.isAbort) {
          pb.authStore.clear();
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

    return authData.record;
  };

  const logout = () => {
    pb.authStore.clear();
  };

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      isAuthenticated: Boolean(pb.authStore.isValid && user && user.active),
      isAdmin: user?.role === "admin",
      isProfessional: user?.role === "professional",
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
