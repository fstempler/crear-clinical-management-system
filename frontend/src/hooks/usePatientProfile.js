import { useCallback, useEffect, useRef, useState } from "react";
import {
  getPatientEvolutions,
  getPatientFiles,
  getPatientProfile,
  getPatientProfessionals,
} from "../services/patientsService";

const emptyData = { patient: null, professionals: [], evolutions: [], files: [] };

export function usePatientProfile(patientId) {
  const requestId = useRef(0);
  const [state, setState] = useState({ data: emptyData, isLoading: true, error: null });

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState({ data: emptyData, isLoading: true, error: null });
    try {
      const patient = await getPatientProfile(patientId);
      const related = await Promise.allSettled([
        getPatientProfessionals(patientId),
        getPatientEvolutions(patientId),
        getPatientFiles(patientId),
      ]);
      if (currentRequest !== requestId.current) return;
      setState({
        data: {
          patient,
          professionals: related[0].status === "fulfilled" ? related[0].value : [],
          evolutions: related[1].status === "fulfilled" ? related[1].value : [],
          files: related[2].status === "fulfilled" ? related[2].value : [],
        },
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (currentRequest === requestId.current) {
        setState({ data: emptyData, isLoading: false, error });
      }
    }
  }, [patientId]);

  useEffect(() => {
    // Starting the request is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  return { ...state, retry: load };
}
