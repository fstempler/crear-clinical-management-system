import { useCallback, useEffect, useRef, useState } from "react";
import { getPatientsPage } from "../services/patientsService";

const EMPTY_RESULT = { items: [], page: 1, totalItems: 0, totalPages: 0 };

export function usePatients({ role, userId, professionalId, page, search, status }) {
  const queryKey = [role, userId, professionalId || "", page, search, status].join("|");
  const requestId = useRef(0);
  const [state, setState] = useState({
    key: "",
    data: EMPTY_RESULT,
    isLoading: true,
    error: null,
  });

  const load = useCallback(async () => {
    if (!userId) return;
    const currentRequest = ++requestId.current;
    setState({ key: queryKey, data: EMPTY_RESULT, isLoading: true, error: null });

    try {
      const data = await getPatientsPage({
        role,
        professionalId,
        page,
        search,
        status,
      });
      if (currentRequest === requestId.current) {
        setState({ key: queryKey, data, isLoading: false, error: null });
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ key: queryKey, data: EMPTY_RESULT, isLoading: false, error });
      }
    }
  }, [page, professionalId, queryKey, role, search, status, userId]);

  useEffect(() => {
    // Starting a request is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  if (state.key !== queryKey) {
    return { data: EMPTY_RESULT, isLoading: true, error: null, retry: load };
  }

  return { ...state, retry: load };
}
