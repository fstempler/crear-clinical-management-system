import { useCallback, useEffect, useRef, useState } from "react";
import {
  getEvolutionAuthorProfile,
  getEvolutionDetail,
  getPatientEvolutionTimeline,
} from "../services/evolutionsService";

const emptyData = {
  evolution: null,
  patient: null,
  authorUser: null,
  authorProfile: null,
  previous: null,
  next: null,
};

export function useEvolutionDetail(evolutionId) {
  const requestId = useRef(0);
  const [state, setState] = useState({ data: emptyData, isLoading: true, error: null });

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState({ data: emptyData, isLoading: true, error: null });
    try {
      const evolution = await getEvolutionDetail(evolutionId);
      const patient = evolution.expand?.patient || null;
      const authorUser = evolution.expand?.author || null;
      const related = await Promise.allSettled([
        getEvolutionAuthorProfile(evolution.author),
        getPatientEvolutionTimeline(evolution.patient),
      ]);
      if (currentRequest !== requestId.current) return;

      const timeline = related[1].status === "fulfilled" ? related[1].value : [];
      const currentIndex = timeline.findIndex((item) => item.id === evolution.id);
      setState({
        data: {
          evolution,
          patient,
          authorUser,
          authorProfile: related[0].status === "fulfilled" ? related[0].value : null,
          previous: currentIndex > 0 ? timeline[currentIndex - 1] : null,
          next: currentIndex >= 0 && currentIndex < timeline.length - 1
            ? timeline[currentIndex + 1]
            : null,
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ data: emptyData, isLoading: false, error });
      }
    }
  }, [evolutionId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  return { ...state, retry: load };
}
