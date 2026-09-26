import { useCallback, useEffect, useState } from "react";
import { getAuditLogs } from "../services/auditService";

export function useAuditLogs(filters) {
  const signature = JSON.stringify(filters);
  const [pagination, setPagination] = useState({ signature, page: 1 });
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState({ key: "", items: [], totalItems: 0, totalPages: 0, error: null });
  const page = pagination.signature === signature ? pagination.page : 1;
  const key = `${signature}:${page}:${retryKey}`;
  useEffect(() => {
    let cancelled = false;
    const currentFilters = JSON.parse(signature);
    getAuditLogs({ ...currentFilters, page }).then((result) => {
      if (!cancelled) setState({ key, items: result.items, totalItems: result.totalItems,
        totalPages: result.totalPages, error: null });
    }).catch((error) => {
      if (!cancelled) setState({ key, items: [], totalItems: 0, totalPages: 0, error });
    });
    return () => { cancelled = true; };
  }, [signature, page, retryKey, key]);
  const changePage = useCallback((next) => setPagination({ signature, page: next }), [signature]);
  const retry = useCallback(() => setRetryKey((value) => value + 1), []);
  return { ...state, loading: state.key !== key, page, changePage, retry };
}
