import { useEffect, useMemo, useState } from "react";
import { pb } from "../lib/pocketbase";
import { AuthContext } from "./AuthContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record);
    }, true);

    const validateSession = async () => {
      if (!pb.authStore.isValid) {
        setIsLoading(false);
        return;
      }

      try {
        await pb.collection("staff_users").authRefresh();
      } catch {
        pb.authStore.clear();
      } finally {
        setIsLoading(false);
      }
    };

    validateSession();

    return unsubscribe;
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
