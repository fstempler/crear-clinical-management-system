import { useCallback, useEffect, useRef, useState } from "react";
import { updateEvolution } from "../services/evolutionsService";
import { useEvolutionDetail } from "./useEvolutionDetail";

export function useEditEvolution(evolutionId) {
  const detail = useEvolutionDetail(evolutionId);
  const saveRequestId = useRef(0);
  const mounted = useRef(true);
  const [saveState, setSaveState] = useState({ isSaving: false, error: null });

  useEffect(() => () => {
    mounted.current = false;
    saveRequestId.current += 1;
  }, []);

  const save = useCallback(async (payload) => {
    const currentRequest = ++saveRequestId.current;
    setSaveState({ isSaving: true, error: null });
    try {
      const updated = await updateEvolution(evolutionId, payload);
      if (mounted.current && currentRequest === saveRequestId.current) {
        setSaveState({ isSaving: false, error: null });
      }
      return updated;
    } catch (error) {
      if (mounted.current && currentRequest === saveRequestId.current) {
        setSaveState({ isSaving: false, error });
      }
      throw error;
    }
  }, [evolutionId]);

  return { ...detail, ...saveState, save };
}
