import { useCallback, useEffect, useRef, useState } from "react";
import { createActivityCursor, loadActivityPage } from "../services/activityService";

export function useActivity(role, userId, filters) {
  const [state, setState] = useState({ items: [], cursor: null, hasMore: false, failures: [], loading: true, loadingMore: false });
  const generation = useRef(0);
  const busy = useRef(false);
  const cursor = useRef(null);
  const currentItems = useRef([]);
  const currentFilters = useRef(filters);
  currentFilters.current = filters;

  const load = useCallback(async (reset = false) => {
    if (!role || !userId || busy.current && !reset) return;
    if (reset) {
      generation.current += 1;
      cursor.current = createActivityCursor(role, currentFilters.current.type);
      currentItems.current = [];
      busy.current = false;
    }
    const token = generation.current;
    if (busy.current || !cursor.current) return;
    busy.current = true;
    setState((previous) => ({ ...previous, ...(reset ? { items: [], failures: [], hasMore: false, loading: true } : { loadingMore: true }) }));
    try {
      const result = await loadActivityPage(cursor.current, currentFilters.current, role, userId);
      if (token !== generation.current) return;
      cursor.current = result.cursor;
      const unique = new Map([...currentItems.current, ...result.items].map((item) => [item.key, item]));
      currentItems.current = [...unique.values()].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp) || a.key.localeCompare(b.key));
      setState({ items: currentItems.current, cursor: result.cursor, hasMore: result.hasMore,
        failures: result.failures, loading: false, loadingMore: false });
    } catch (error) {
      if (token !== generation.current) return;
      setState((previous) => ({ ...previous, failures: [{ type: "general", error }], loading: false, loadingMore: false }));
    } finally {
      if (token === generation.current) busy.current = false;
    }
  }, [role, userId]);

  const signature = JSON.stringify(filters);
  useEffect(() => {
    load(true);
    return () => { generation.current += 1; busy.current = false; };
  }, [load, signature]);

  const retry = useCallback(() => {
    if (!cursor.current) return load(true);
    for (const source of Object.values(cursor.current)) source.error = null;
    return load(false);
  }, [load]);

  return { ...state, loadMore: () => load(false), refresh: () => load(true), retry };
}
