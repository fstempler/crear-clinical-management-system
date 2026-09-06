import { useCallback, useEffect, useState } from "react";
import { getProfessionalProfile } from "../services/dashboardService";

export function useProfessionalProfile(user) {
  const userId = user?.id;
  const role = user?.role;
  const [state, setState] = useState({
    data: null,
    isLoading: role === "professional",
    error: null,
  });

  useEffect(() => {
    if (role !== "professional") return undefined;
    let active = true;
    getProfessionalProfile(userId)
      .then((data) => {
        if (active) setState({ data, isLoading: false, error: null });
      })
      .catch((error) => {
        if (active) setState({ data: null, isLoading: false, error });
      });
    return () => {
      active = false;
    };
  }, [role, userId]);

  const retry = useCallback(async () => {
    if (role !== "professional") return;
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      setState({
        data: await getProfessionalProfile(userId),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState({ data: null, isLoading: false, error });
    }
  }, [role, userId]);

  return { ...state, retry };
}
