import { useEffect } from "react";
import { Link, useLocation, useOutletContext, useSearchParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { PatientsFilters } from "../../components/patients/PatientsFilters";
import { PatientsResults } from "../../components/patients/PatientsResults";
import { useAuth } from "../../hooks/useAuth";
import { usePatients } from "../../hooks/usePatients";
import { PATIENTS_PER_PAGE } from "../../services/patientsService";
import styles from "./PatientsPage.module.scss";

const ALLOWED_STATUSES = new Set(["active", "inactive", "discharged"]);

function readPage(value) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function PatientsPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { profileState } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const professional = user.role === "professional";
  const search = searchParams.get("search")?.trim() || "";
  const rawStatus = searchParams.get("status") || "";
  const status = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : "";
  const page = readPage(searchParams.get("page"));
  const patients = usePatients({
    role: user.role,
    userId: user.id,
    professionalId: profileState.data?.id,
    page,
    search,
    status,
  });

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "1") next.set(key, String(value));
      else next.delete(key);
    });
    setSearchParams(next, { replace: false });
  };

  useEffect(() => {
    const invalidPage = searchParams.get("page") && page === 1 && searchParams.get("page") !== "1";
    const invalidStatus = rawStatus && !ALLOWED_STATUSES.has(rawStatus);
    if (invalidPage || invalidStatus) {
      const next = new URLSearchParams(searchParams);
      if (invalidPage) next.delete("page");
      if (invalidStatus) next.delete("status");
      setSearchParams(next, { replace: true });
    }
  }, [page, rawStatus, searchParams, setSearchParams]);

  useEffect(() => {
    if (!patients.isLoading && patients.data.totalPages > 0 && page > patients.data.totalPages) {
      const next = new URLSearchParams(searchParams);
      if (patients.data.totalPages === 1) next.delete("page");
      else next.set("page", String(patients.data.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [page, patients.data.totalPages, patients.isLoading, searchParams, setSearchParams]);

  const clearFilters = () => setSearchParams({}, { replace: false });
  const hasFilters = Boolean(search || status);
  const profileUnavailable = professional && (profileState.isLoading || profileState.error);

  return (
    <main className={styles.page}>
      {location.state?.patientCreated && (
        <div className={styles.success} role="status" aria-live="polite">
          <Icon name="check" size={20} />
          {location.state.patientName
            ? `${location.state.patientName} fue registrado correctamente.`
            : "El paciente fue registrado correctamente."}
        </div>
      )}
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/">{professional ? "Portal Médico" : "Portal Administrativo"}</Link>
        <Icon name="chevron" size={16} />
        <span aria-current="page">Pacientes</span>
      </nav>
      <header className={styles.heading}>
        <div>
          <h1>Pacientes</h1>
          <p>
            {professional
              ? "Buscá y consultá la información de tus pacientes asignados."
              : "Consultá y administrá la información de los pacientes registrados."}
          </p>
        </div>
        {!professional && (
          <Link className={styles.newPatient} to="/patients/new">
            <Icon name="plus" size={21} /> Nuevo paciente
          </Link>
        )}
      </header>

      {!profileUnavailable && !patients.isLoading && !patients.error && (
        <p className={styles.count} aria-live="polite">
          <strong>{patients.data.totalItems}</strong>{" "}
          {patients.data.totalItems === 1 ? "paciente encontrado" : "pacientes encontrados"}
        </p>
      )}

      <PatientsFilters
        key={search}
        search={search}
        status={status}
        onSearch={(value) => updateParams({ search: value, page: "" })}
        onStatus={(value) => updateParams({ status: value, page: "" })}
        onClear={clearFilters}
      />

      <div className={styles.content}>
        {professional && profileState.isLoading && (
          <SectionState type="loading" message="Cargando pacientes…" />
        )}
        {professional && profileState.error && (
          <SectionState
            type="error"
            message="No se pudieron cargar los pacientes."
            onRetry={profileState.retry}
          />
        )}
        {!profileUnavailable && patients.isLoading && (
          <SectionState type="loading" message="Cargando pacientes…" />
        )}
        {!profileUnavailable && patients.error && (
          <SectionState
            type="error"
            message="No se pudieron cargar los pacientes."
            onRetry={patients.retry}
          />
        )}
        {!profileUnavailable && !patients.isLoading && !patients.error && patients.data.totalItems === 0 && (
          <div className={styles.empty} role="status">
            <Icon name={hasFilters ? "search" : "patients"} size={34} />
            <h2>
              {hasFilters
                ? "No encontramos pacientes con los filtros seleccionados."
                : professional
                  ? "Todavía no tenés pacientes asignados."
                  : "Todavía no hay pacientes registrados."}
            </h2>
            {hasFilters && <button type="button" onClick={clearFilters}>Limpiar búsqueda y filtros</button>}
          </div>
        )}
        {!profileUnavailable && !patients.isLoading && !patients.error && patients.data.totalItems > 0 && (
          <PatientsResults
            result={patients.data}
            perPage={PATIENTS_PER_PAGE}
            onPageChange={(nextPage) => updateParams({ page: nextPage })}
          />
        )}
      </div>
    </main>
  );
}
