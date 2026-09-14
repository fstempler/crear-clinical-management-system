import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import {
  EVOLUTIONS_PER_PAGE,
  evolutionTypes,
  getAssignedPatient,
  getEvolutionAuthorProfiles,
  getPatientEvolutions,
  getPatientHistoryProfessionals,
} from "../services/evolutionsService";
import { getPatientProfile } from "../services/patientsService";

const emptyHistory = {
  items: [],
  page: 1,
  perPage: EVOLUTIONS_PER_PAGE,
  totalItems: 0,
  totalPages: 0,
};

const emptyAccess = {
  patient: null,
  professionals: [],
  isAssigned: false,
};

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePage(value) {
  const page = Number.parseInt(value, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function validDate(value) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function mergeUniqueEvolutions(current, incoming) {
  const records = new Map();

  [...current, ...incoming].forEach((record) => {
    if (record?.id) {
      records.set(record.id, record);
    }
  });

  return [...records.values()];
}

function profileMap(profiles) {
  return profiles.reduce((map, profile) => {
    if (profile?.staff_user) {
      map[profile.staff_user] = profile;
    }

    return map;
  }, {});
}

function accessError(originalError) {
  const error = new Error(
    "No pudimos acceder a la historia clínica de este paciente.",
  );

  error.code = "PATIENT_HISTORY_INACCESSIBLE";
  error.status = originalError?.status || 404;
  error.cause = originalError;

  return error;
}

export function usePatientHistory({
  patientId,
  user,
  professionalId,
  enabled = true,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [access, setAccess] = useState(emptyAccess);
  const [accessState, setAccessState] = useState({
    isLoading: true,
    error: null,
  });
  const [history, setHistory] = useState(emptyHistory);
  const [authors, setAuthors] = useState({});
  const [historyState, setHistoryState] = useState({
    isLoading: true,
    isLoadingMore: false,
    error: null,
  });
  const [retryVersion, setRetryVersion] = useState(0);

  const accessRequestId = useRef(0);
  const historyRequestId = useRef(0);
  const loadedPage = useRef(0);
  const loadedFilterKey = useRef("");

  const filters = useMemo(() => {
    const type = searchParams.get("type") || "";

    return {
      search: normalizeSearch(searchParams.get("q")),
      evolutionType: evolutionTypes.includes(type) ? type : "",
      authorId: searchParams.get("author") || "",
      dateFrom: searchParams.get("from") || "",
      dateTo: searchParams.get("to") || "",
      page: normalizePage(searchParams.get("page")),
    };
  }, [searchParams]);

  const dateError = useMemo(() => {
    if (!validDate(filters.dateFrom) || !validDate(filters.dateTo)) {
      return "Ingresá un período válido.";
    }

    if (
      filters.dateFrom &&
      filters.dateTo &&
      filters.dateFrom > filters.dateTo
    ) {
      return "La fecha desde no puede ser posterior a la fecha hasta.";
    }

    return "";
  }, [filters.dateFrom, filters.dateTo]);

  const filterKey = useMemo(
    () =>
      JSON.stringify({
        patientId,
        search: filters.search,
        evolutionType: filters.evolutionType,
        authorId: filters.authorId,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
      }),
    [
      patientId,
      filters.search,
      filters.evolutionType,
      filters.authorId,
      filters.dateFrom,
      filters.dateTo,
    ],
  );

  const updateSearchParams = useCallback(
    (values, options = {}) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);

          Object.entries(values).forEach(([key, value]) => {
            const normalized = String(value || "").trim();

            if (normalized) {
              next.set(key, normalized);
            } else {
              next.delete(key);
            }
          });

          if (options.resetPage !== false) {
            next.delete("page");
          }

          return next;
        },
        {
          replace: options.replace ?? false,
        },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    const query = searchParams.get("q") || "";
    // Sincroniza el campo cuando cambia la URL por navegación atrás/adelante.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearchInput((current) => (current === query ? current : query));
  }, [searchParams]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalized = normalizeSearch(searchInput);

      if (normalized !== filters.search) {
        updateSearchParams(
          {
            q: normalized,
          },
          {
            replace: true,
          },
        );
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [filters.search, searchInput, updateSearchParams]);

  useEffect(() => {
    if (!enabled || !patientId || !user?.id) {
      return undefined;
    }

    const currentRequest = ++accessRequestId.current;

    // Inicia la carga al cambiar el paciente o el usuario.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccess(emptyAccess);
    setAccessState({
      isLoading: true,
      error: null,
    });

    const loadAccess = async () => {
      try {
        let patient = null;
        let isAssigned = false;

        if (user.role === "admin") {
          patient = await getPatientProfile(patientId);
        } else if (user.role === "professional" && professionalId) {
          try {
            patient = await getAssignedPatient(professionalId, patientId);
          } catch (error) {
            if (error?.status !== 404) {
              throw error;
            }
          }

          if (!patient) {
            throw accessError();
          }

          isAssigned = true;
        } else {
          throw accessError();
        }

        const professionalsResult = await Promise.allSettled([
          getPatientHistoryProfessionals(patientId),
        ]);

        if (currentRequest !== accessRequestId.current) {
          return;
        }

        setAccess({
          patient,
          professionals:
            professionalsResult[0].status === "fulfilled"
              ? professionalsResult[0].value
              : [],
          isAssigned,
        });

        setAccessState({
          isLoading: false,
          error: null,
        });
      } catch (error) {
        if (currentRequest !== accessRequestId.current) {
          return;
        }

        setAccess(emptyAccess);
        setAccessState({
          isLoading: false,
          error: [401, 403, 404].includes(error?.status)
            ? accessError(error)
            : error,
        });
      }
    };

    loadAccess();

    return () => {
      accessRequestId.current += 1;
    };
  }, [enabled, patientId, professionalId, retryVersion, user?.id, user?.role]);

  useEffect(() => {
    if (
      !enabled ||
      accessState.isLoading ||
      accessState.error ||
      !access.patient
    ) {
      return undefined;
    }

    const currentRequest = ++historyRequestId.current;
    const filtersChanged = loadedFilterKey.current !== filterKey;
    const requestedPage = filters.page;

    if (dateError) {
      loadedPage.current = 0;
      loadedFilterKey.current = filterKey;

      // El período inválido se resuelve localmente y no consulta PocketBase.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory(emptyHistory);
      setAuthors({});
      setHistoryState({
        isLoading: false,
        isLoadingMore: false,
        error: null,
      });

      return undefined;
    }

    if (filtersChanged) {
      loadedFilterKey.current = filterKey;
      loadedPage.current = 0;

      // Reinicia los resultados cuando cambia un filtro.

      setHistory(emptyHistory);
      setAuthors({});
      setHistoryState({
        isLoading: true,
        isLoadingMore: false,
        error: null,
      });
    } else if (requestedPage > loadedPage.current) {
      setHistoryState((current) => ({
        ...current,
        isLoadingMore: loadedPage.current > 0,
        error: null,
      }));
    } else {
      return undefined;
    }

    const loadHistory = async () => {
      try {
        const firstPage = filtersChanged ? 1 : loadedPage.current + 1;

        const pages = [];

        for (let page = firstPage; page <= requestedPage; page += 1) {
          const result = await getPatientEvolutions({
            patientId,
            page,
            perPage: EVOLUTIONS_PER_PAGE,
            search: filters.search,
            evolutionType: filters.evolutionType,
            authorId: filters.authorId,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          });

          pages.push(result);

          if (page >= result.totalPages) {
            break;
          }
        }

        if (currentRequest !== historyRequestId.current) {
          return;
        }

        const items = pages.flatMap((result) => result.items);
        const authorIds = items
          .map((evolution) => evolution.author)
          .filter(Boolean);
        const profiles = await getEvolutionAuthorProfiles(authorIds);

        if (currentRequest !== historyRequestId.current) {
          return;
        }

        const lastResult = pages.at(-1) || emptyHistory;
        const reachedPage = lastResult.page || 1;

        loadedPage.current = reachedPage;

        setHistory((current) => ({
          items: filtersChanged
            ? mergeUniqueEvolutions([], items)
            : mergeUniqueEvolutions(current.items, items),
          page: reachedPage,
          perPage: lastResult.perPage || EVOLUTIONS_PER_PAGE,
          totalItems: lastResult.totalItems || 0,
          totalPages: lastResult.totalPages || 0,
        }));

        setAuthors((current) => ({
          ...(filtersChanged ? {} : current),
          ...profileMap(profiles),
        }));

        setHistoryState({
          isLoading: false,
          isLoadingMore: false,
          error: null,
        });
      } catch (error) {
        if (currentRequest !== historyRequestId.current) {
          return;
        }

        setHistoryState({
          isLoading: false,
          isLoadingMore: false,
          error,
        });
      }
    };

    loadHistory();

    return () => {
      historyRequestId.current += 1;
    };
  }, [
    access.patient,
    accessState.error,
    accessState.isLoading,
    dateError,
    enabled,
    filterKey,
    filters.authorId,
    filters.dateFrom,
    filters.dateTo,
    filters.evolutionType,
    filters.page,
    filters.search,
    patientId,
    retryVersion,
  ]);

  const setFilter = useCallback(
    (name, value) => {
      const parameterNames = {
        evolutionType: "type",
        authorId: "author",
        dateFrom: "from",
        dateTo: "to",
      };

      const parameter = parameterNames[name];

      if (!parameter) return;

      updateSearchParams({
        [parameter]: value,
      });
    },
    [updateSearchParams],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearchParams(new URLSearchParams(), {
      replace: false,
    });
  }, [setSearchParams]);

  const loadMore = useCallback(() => {
    if (
      historyState.isLoading ||
      historyState.isLoadingMore ||
      history.page >= history.totalPages
    ) {
      return;
    }

    updateSearchParams(
      {
        page: history.page + 1,
      },
      {
        resetPage: false,
      },
    );
  }, [
    history.page,
    history.totalPages,
    historyState.isLoading,
    historyState.isLoadingMore,
    updateSearchParams,
  ]);

  const retry = useCallback(() => {
    loadedPage.current = 0;
    loadedFilterKey.current = "";
    setRetryVersion((current) => current + 1);
  }, []);

  const hasActiveFilters = Boolean(
    filters.search ||
    filters.evolutionType ||
    filters.authorId ||
    filters.dateFrom ||
    filters.dateTo,
  );

  return {
    patient: access.patient,
    isAssigned: access.isAssigned,
    canCreate:
      user?.active === true &&
      user?.role === "professional" &&
      access.isAssigned,
    professionals: access.professionals,
    authors,
    evolutions: history.items,
    page: history.page,
    perPage: history.perPage,
    totalItems: history.totalItems,
    totalPages: history.totalPages,
    hasMore: history.totalPages > 0 && history.page < history.totalPages,
    filters,
    searchInput,
    setSearchInput,
    setFilter,
    clearFilters,
    hasActiveFilters,
    dateError,
    isLoadingPatient: accessState.isLoading,
    patientError: accessState.error,
    isLoadingHistory: historyState.isLoading,
    isLoadingMore: historyState.isLoadingMore,
    historyError: historyState.error,
    loadMore,
    retry,
  };
}
