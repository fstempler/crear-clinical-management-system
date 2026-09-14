import { useCallback, useEffect, useRef, useState } from "react";
import { createEvolution, getAssignedPatient, getAssignedPatients, patientExists } from "../services/evolutionsService";

const initialState = { patients: [], lockedPatient: null, isLoading: true, loadError: null, patientStatus: null };

export function useNewEvolution({ professionalId, requestedPatientId }) {
  const requestId = useRef(0);
  const [state, setState] = useState(initialState);

  const load = useCallback(async () => {
    if (!professionalId) return;
    const currentRequest = ++requestId.current;
    setState(initialState);
    try {
      if (requestedPatientId) {
        let patient = null;
        try {
          patient = await getAssignedPatient(professionalId, requestedPatientId);
        } catch (error) {
          if (error?.status !== 404) throw error;
        }
        if (!patient) {
          const exists = await patientExists(requestedPatientId);
          if (currentRequest !== requestId.current) return;
          setState({ ...initialState, isLoading: false, patientStatus: exists ? "unassigned" : "not-found" });
          return;
        }
        if (currentRequest !== requestId.current) return;
        setState({ patients: [patient], lockedPatient: patient, isLoading: false, loadError: null, patientStatus: "assigned" });
        return;
      }
      const patients = await getAssignedPatients(professionalId);
      if (currentRequest !== requestId.current) return;
      setState({ patients, lockedPatient: null, isLoading: false, loadError: null, patientStatus: patients.length ? "available" : "empty" });
    } catch (error) {
      if (currentRequest === requestId.current) setState({ ...initialState, isLoading: false, loadError: error });
    }
  }, [professionalId, requestedPatientId]);

  useEffect(() => {
    // Starting the request is the external synchronization performed by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  return { ...state, retry: load, createEvolution };
}
