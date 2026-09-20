import { useCallback, useEffect, useRef, useState } from "react";
import {
  createPatientProfessionalAssignment,
  deactivatePatientProfessionalAssignment,
  findPatientProfessionalAssignment,
  getProfessionalAssignmentMetrics,
  getProfessionalAssignmentsPage,
  getProfessionalDetail,
  isDuplicateAssignmentError,
  reactivatePatientProfessionalAssignment,
  searchAssignmentCandidates,
} from "../services/professionalsService";
import { getPatientProfile } from "../services/patientsService";

const EMPTY_PAGE = { items: [], page: 1, totalPages: 0, totalItems: 0 };
const EMPTY_METRICS = { total: null, active: null, inactive: null };

function operationMessage(error) {
  if (error?.code === "inactive-patient") return "El paciente dejó de estar activo y no puede asignarse.";
  if (error?.code === "duplicate" || isDuplicateAssignmentError(error)) return "La relación ya existe. Actualizá la página para ver su estado.";
  if (error?.status === 401 || error?.status === 403) return "No tenés permisos para realizar esta operación.";
  return "No pudimos guardar el cambio. Revisá la conexión e intentá nuevamente.";
}

export function useProfessionalAssignments({ professionalId, page, search, status }) {
  const requestId = useRef(0);
  const operationLock = useRef(false);
  const [state, setState] = useState({ professional: null, account: null, list: EMPTY_PAGE, metrics: EMPTY_METRICS, loadingProfessional: true, loadingAssignments: true, error: null, listError: null });
  const [operation, setOperation] = useState({ type: "", id: "", error: "", success: "" });

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setState((previous) => ({ ...previous, loadingProfessional: true, loadingAssignments: true, error: null, listError: null }));
    try {
      const professional = await getProfessionalDetail(professionalId);
      if (current !== requestId.current) return;
      setState((previous) => ({ ...previous, professional, account: professional.expand?.staff_user || null, loadingProfessional: false }));
      const [listResult, metricsResult] = await Promise.allSettled([
        getProfessionalAssignmentsPage({ professionalId, page, search, status }),
        getProfessionalAssignmentMetrics(professionalId),
      ]);
      if (current !== requestId.current) return;
      setState((previous) => ({
        ...previous,
        list: listResult.status === "fulfilled" ? listResult.value : EMPTY_PAGE,
        metrics: metricsResult.status === "fulfilled" ? metricsResult.value : EMPTY_METRICS,
        loadingAssignments: false,
        listError: listResult.status === "rejected" ? listResult.reason : null,
      }));
    } catch (error) {
      if (current === requestId.current) setState((previous) => ({ ...previous, loadingProfessional: false, loadingAssignments: false, error }));
    }
  }, [page, professionalId, search, status]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const runOperation = useCallback(async (type, id, task, success) => {
    if (operationLock.current) return false;
    operationLock.current = true;
    setOperation({ type, id, error: "", success: "" });
    try {
      await task();
      setOperation({ type: "", id: "", error: "", success });
      await load();
      return true;
    } catch (error) {
      setOperation({ type: "", id: "", error: operationMessage(error), success: "" });
      return false;
    } finally {
      operationLock.current = false;
    }
  }, [load]);

  const assign = useCallback(async (patient, relation) => runOperation(
    relation ? "reactivating" : "assigning", patient.id,
    async () => {
      const freshPatient = await getPatientProfile(patient.id);
      if (freshPatient.status !== "active") throw { code: "inactive-patient" };
      const existing = relation || await findPatientProfessionalAssignment(professionalId, patient.id);
      if (existing?.active) throw { code: "duplicate" };
      if (existing) return reactivatePatientProfessionalAssignment(existing.id);
      try {
        return await createPatientProfessionalAssignment(professionalId, patient.id);
      } catch (error) {
        if (!isDuplicateAssignmentError(error)) throw error;
        const concurrent = await findPatientProfessionalAssignment(professionalId, patient.id);
        if (concurrent && !concurrent.active) return reactivatePatientProfessionalAssignment(concurrent.id);
        throw { code: "duplicate" };
      }
    },
    relation ? "La asignación se reactivó correctamente." : "El paciente fue asignado correctamente.",
  ), [professionalId, runOperation]);

  const deactivate = useCallback((assignment) => runOperation(
    "deactivating", assignment.id,
    () => deactivatePatientProfessionalAssignment(assignment.id),
    "La asignación se desactivó correctamente.",
  ), [runOperation]);

  return { ...state, operation, retry: load, assign, deactivate, clearOperationMessage: () => setOperation((current) => ({ ...current, error: "", success: "" })) };
}

export async function loadAssignmentCandidates(options) {
  return searchAssignmentCandidates(options);
}
