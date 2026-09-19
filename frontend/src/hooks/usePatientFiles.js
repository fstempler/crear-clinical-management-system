import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { getPatientProfile } from "../services/patientsService";
import { getAssignedPatientForStaff, getPatientFileEvolutions, getPatientFilesPage, getProtectedFileToken } from "../services/patientFilesService";

const emptyPage = { items: [], page: 1, totalItems: 0, totalPages: 0 };

export function usePatientFiles({ patientId, user }) {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(params.get("q") || "");
  const [state, setState] = useState({ patient: null, evolutions: [], page: emptyPage, token: "", loading: true, loadingMore: false, error: null, tokenError: null });
  const requestId = useRef(0);
  const filters = useMemo(() => ({
    search: params.get("q") || "", category: params.get("category") || "",
    evolutionId: params.get("evolution") || "", dateFrom: params.get("from") || "",
    dateTo: params.get("to") || "", page: Math.max(1, Number(params.get("page")) || 1),
  }), [params]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(params);
      const value = searchInput.trim();
      if (value) next.set("q", value); else next.delete("q");
      next.delete("page");
      if (next.toString() !== params.toString()) setParams(next, { replace: true });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [params, searchInput, setParams]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setState((old) => ({ ...old, loading: true, error: null, tokenError: null }));
    try {
      let patient;
      if (user.role === "professional") {
        patient = await getAssignedPatientForStaff(user.id, patientId);
        if (!patient) { const error = new Error("Acceso denegado"); error.status = 404; throw error; }
      } else patient = await getPatientProfile(patientId);
      const [pages, evolutions, tokenResult] = await Promise.all([
        Promise.all(Array.from({ length: filters.page }, (_, index) => getPatientFilesPage({ patientId, ...filters, page: index + 1 }))),
        getPatientFileEvolutions(patientId),
        getProtectedFileToken().then((token) => ({ token })).catch((error) => ({ error })),
      ]);
      if (current !== requestId.current) return;
      const result = pages.at(-1) || emptyPage;
      const items = pages.flatMap((page) => page.items).filter((item, index, all) => all.findIndex((candidate) => candidate.id === item.id) === index);
      setState({ patient, evolutions, page: { ...result, items }, token: tokenResult.token || "", loading: false, loadingMore: false, error: null, tokenError: tokenResult.error || null });
    } catch (error) {
      if (current === requestId.current) setState((old) => ({ ...old, loading: false, loadingMore: false, error }));
    }
  }, [filters, patientId, user.id, user.role]);

  useEffect(() => { load(); return () => { requestId.current += 1; }; }, [load]);

  const setFilter = useCallback((name, value) => {
    const names = { category: "category", evolutionId: "evolution", dateFrom: "from", dateTo: "to" };
    const next = new URLSearchParams(params); const key = names[name]; if (!key) return;
    if (value) next.set(key, value); else next.delete(key); next.delete("page"); setParams(next);
  }, [params, setParams]);
  const clearFilters = useCallback(() => { setSearchInput(""); setParams(new URLSearchParams()); }, [setParams]);
  const loadMore = useCallback(async () => {
    if (state.loadingMore || state.page.page >= state.page.totalPages) return;
    const nextPage = state.page.page + 1; const current = ++requestId.current;
    setState((old) => ({ ...old, loadingMore: true }));
    try {
      const result = await getPatientFilesPage({ patientId, ...filters, page: nextPage });
      if (current !== requestId.current) return;
      setState((old) => ({ ...old, loadingMore: false, page: { ...result, items: [...old.page.items, ...result.items.filter((item) => !old.page.items.some((oldItem) => oldItem.id === item.id))] } }));
      const next = new URLSearchParams(params); next.set("page", String(nextPage)); setParams(next, { replace: true });
    } catch (error) { if (current === requestId.current) setState((old) => ({ ...old, loadingMore: false, error })); }
  }, [filters, params, patientId, setParams, state.loadingMore, state.page]);
  return { ...state, filters, searchInput, setSearchInput, setFilter, clearFilters, loadMore, retry: load, hasFilters: Boolean(filters.search || filters.category || filters.evolutionId || filters.dateFrom || filters.dateTo) };
}
