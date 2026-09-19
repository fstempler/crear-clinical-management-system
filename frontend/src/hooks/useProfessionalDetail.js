import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProfessionalAssignments,
  getProfessionalDetail,
} from "../services/professionalsService";

const INITIAL_STATE = {
  professional: null,
  account: null,
  assignments: [],
  isLoading: true,
  error: null,
  assignmentsError: null,
};

export function useProfessionalDetail(professionalId) {
  const [state, setState] = useState(INITIAL_STATE);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const currentRequest = requestId.current + 1;
    requestId.current = currentRequest;
    setState(INITIAL_STATE);

    try {
      const professional = await getProfessionalDetail(professionalId);
      if (requestId.current !== currentRequest) return;

      setState((current) => ({
        ...current,
        professional,
        account: professional.expand?.staff_user || null,
        isLoading: false,
      }));

      try {
        const assignments = await getProfessionalAssignments(professionalId);
        if (requestId.current !== currentRequest) return;
        setState((current) => ({ ...current, assignments }));
      } catch (assignmentsError) {
        if (requestId.current !== currentRequest) return;
        setState((current) => ({ ...current, assignmentsError }));
      }
    } catch (error) {
      if (requestId.current !== currentRequest) return;
      setState((current) => ({ ...current, isLoading: false, error }));
    }
  }, [professionalId]);

  useEffect(() => {
    load();
    return () => {
      requestId.current += 1;
    };
  }, [load]);

  return { ...state, retry: load };
}
