import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { Icon } from "../../components/common/Icon";
import { EvolutionList } from "../../components/dashboard/EvolutionList";
import { Metrics } from "../../components/dashboard/Metrics";
import { PatientList } from "../../components/dashboard/PatientList";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/useDashboardData";
import { formatCurrentDate } from "../../utils/date";
import styles from "./DashboardPage.module.scss";
export function DashboardPage() {
  const { user } = useAuth();
  const { profileState, presentation } = useOutletContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const professional = user.role === "professional";
  const dashboard = useDashboardData(user, profileState.data);
  const profileDependentError =
    professional && profileState.error
      ? {
          data: null,
          isLoading: false,
          error: profileState.error,
          retry: profileState.retry,
        }
      : null;
  const submit = (event) => {
    event.preventDefault();
    const term = search.trim();
    if (term) navigate(`/patients?search=${encodeURIComponent(term)}`);
  };
  return (
    <main className={styles.page}>
      <section className={styles.welcome}>
        <div>
          <h1>Buen día, {presentation.name}</h1>
          <p>
            {professional
              ? "Estos son tus pacientes y las últimas actividades registradas."
              : "Resumen general de pacientes y profesionales."}
          </p>
        </div>
        <time dateTime={new Date().toISOString()}>{formatCurrentDate()}</time>
      </section>
      {professional && profileState.isLoading && (
        <div className={styles.profileState}>
          <SectionState type="loading" message="Cargando perfil profesional…" />
        </div>
      )}
      {professional && profileState.error && (
        <div className={styles.profileState}>
          <SectionState
            type="error"
            message="No se pudo cargar el perfil profesional. Los datos asignados no estarán disponibles."
            onRetry={profileState.retry}
          />
        </div>
      )}
      <form className={styles.search} onSubmit={submit}>
        <label htmlFor="patient-search">
          <Icon name="search" />
          <span className={styles.srOnly}>
            Buscar paciente por nombre, apellido o DNI
          </span>
          <input
            id="patient-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar paciente por nombre, apellido o DNI"
          />
        </label>
        <button type="submit" disabled={!search.trim()}>
          Buscar
        </button>
      </form>
      <div className={styles.actions}>
        <Link to="/patients">
          <span>
            <Icon name="patients" />
          </span>
          <div>
            <strong>Buscar paciente</strong>
            <small>Consultá la ficha y la historia clínica.</small>
          </div>
          <Icon name="chevron" />
        </Link>
        {professional && (
          <Link className={styles.primary} to="/evolutions/new">
            <span>
              <Icon name="edit" />
            </span>
            <div>
              <strong>Nueva evolución</strong>
              <small>Registrá una evolución para un paciente.</small>
            </div>
            <Icon name="chevron" />
          </Link>
        )}
        {!professional && (
          <Link to="/professionals">
            <span>
              <Icon name="professional" />
            </span>
            <div>
              <strong>Profesionales</strong>
              <small>Consultá el equipo profesional registrado.</small>
            </div>
            <Icon name="chevron" />
          </Link>
        )}
      </div>
      <div className={styles.grid}>
        <div className={styles.main}>
          <PatientList
            section={profileDependentError || dashboard.patients}
            professional={professional}
          />
        </div>
        <aside className={styles.side}>
          <Metrics
            section={profileDependentError || dashboard.metrics}
            role={user.role}
          />
          {professional && <EvolutionList section={dashboard.evolutions} />}
        </aside>
      </div>
    </main>
  );
}
