import { useCallback, useEffect, useRef, useState } from "react";
import {
  getProfessionalFilterOptions,
  getProfessionalsMetrics,
  getProfessionalsPage,
} from "../services/professionalsService";

const EMPTY_RESULT = { items: [], page: 1, totalItems: 0, totalPages: 0 };
const EMPTY_METRICS = { total: null, active: null, inactive: null };
const EMPTY_OPTIONS = { professions: [], specialties: [] };

export function useProfessionals({ page, search, profession, specialty, status }) {
  const queryKey = [page, search, profession, specialty, status].join("|");
  const requestId = useRef(0);
  const [listState, setListState] = useState({ key: "", data: EMPTY_RESULT, isLoading: true, error: null });
  const [supportState, setSupportState] = useState({ metrics: EMPTY_METRICS, options: EMPTY_OPTIONS });

  const loadList = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setListState({ key: queryKey, data: EMPTY_RESULT, isLoading: true, error: null });
    try {
      const data = await getProfessionalsPage({ page, search, profession, specialty, status });
      if (currentRequest === requestId.current) {
        setListState({ key: queryKey, data, isLoading: false, error: null });
      }
    } catch (error) {
      if (currentRequest === requestId.current) {
        setListState({ key: queryKey, data: EMPTY_RESULT, isLoading: false, error });
      }
    }
  }, [page, profession, queryKey, search, specialty, status]);

  const loadSupportData = useCallback(async () => {
    const [metrics, options] = await Promise.allSettled([
      getProfessionalsMetrics(),
      getProfessionalFilterOptions(),
    ]);
    setSupportState({
      metrics: metrics.status === "fulfilled" ? metrics.value : EMPTY_METRICS,
      options: options.status === "fulfilled" ? options.value : EMPTY_OPTIONS,
    });
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadList();
    return () => { requestId.current += 1; };
  }, [loadList]);

  useEffect(() => {
    // Supporting data is independent so a metrics/options failure never blocks the directory.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSupportData();
  }, [loadSupportData]);

  const current = listState.key === queryKey
    ? listState
    : { data: EMPTY_RESULT, isLoading: true, error: null };
  return { ...current, ...supportState, retry: loadList };
}
