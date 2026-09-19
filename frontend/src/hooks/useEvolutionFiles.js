import { useCallback, useEffect, useRef, useState } from "react";
import { createPatientFile, getEvolutionFiles, getProtectedFileToken, softDeletePatientFile } from "../services/patientFilesService";

export function useEvolutionFiles(evolutionId) {
  const request = useRef(0);
  const [state, setState] = useState({ files: [], token: "", loading: true, error: null, tokenError: null, uploading: false, deletingId: "", message: "" });
  const load = useCallback(async () => {
    const current = ++request.current; setState((old) => ({ ...old, loading: true, error: null }));
    try {
      const [files, tokenResult] = await Promise.all([getEvolutionFiles(evolutionId), getProtectedFileToken().then((token) => ({ token })).catch((error) => ({ error }))]);
      if (current === request.current) setState((old) => ({ ...old, files, token: tokenResult.token || "", tokenError: tokenResult.error || null, loading: false }));
    } catch (error) { if (current === request.current) setState((old) => ({ ...old, loading: false, error })); }
  }, [evolutionId]);
  useEffect(() => { load(); return () => { request.current += 1; }; }, [load]);
  const upload = useCallback(async (payload) => {
    setState((old) => ({ ...old, uploading: true, message: "" }));
    try { const record = await createPatientFile(payload); setState((old) => ({ ...old, uploading: false, files: [record, ...old.files], message: "Archivo adjuntado correctamente." })); return true; }
    catch (error) { setState((old) => ({ ...old, uploading: false, error })); return false; }
  }, []);
  const remove = useCallback(async (record) => {
    setState((old) => ({ ...old, deletingId: record.id, message: "" }));
    try { await softDeletePatientFile(record.id); setState((old) => ({ ...old, deletingId: "", files: old.files.filter((item) => item.id !== record.id), message: "Archivo eliminado correctamente." })); }
    catch (error) { setState((old) => ({ ...old, deletingId: "", error })); }
  }, []);
  const clearError = useCallback(() => setState((old) => ({ ...old, error: null })), []);
  return { ...state, retry: load, upload, remove, clearError };
}
