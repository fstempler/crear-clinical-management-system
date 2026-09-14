import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { usePatientHistory } from "../../hooks/usePatientHistory";
import { useProfessionalProfile } from "../../hooks/useProfessionalProfile";
import {
  evolutionTypeLabels,
  isEvolutionEditable,
} from "../../services/evolutionsService";
import { calculateAge, formatDateTime } from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientDocumentType,
  getPatientStatus,
} from "../../utils/presentation";
import styles from "./PatientHistoryPage.module.scss";

function professionalName(profile) {
  return (
    [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || ""
  );
}

function professionalDescription(profile) {
  return (
    [profile?.profession, profile?.specialty].filter(Boolean).join(" · ") || ""
  );
}

function plainText(value) {
  const source = String(value || "");

  if (!source) return "";

  const element = document.createElement("div");
  element.innerHTML = source;

  return (element.textContent || element.innerText || "")
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value, maximumLength = 230) {
  const text = plainText(value);

  if (!text) {
    return "Sin contenido registrado.";
  }

  if (text.length <= maximumLength) {
    return text;
  }

  const shortened = text.slice(0, maximumLength + 1);
  const lastSpace = shortened.lastIndexOf(" ");
  const safeEnd =
    lastSpace >= Math.floor(maximumLength * 0.7) ? lastSpace : maximumLength;

  return `${shortened.slice(0, safeEnd).trim()}…`;
}

function wasUpdated(evolution) {
  const created = new Date(evolution?.created);
  const updated = new Date(evolution?.updated);

  if (Number.isNaN(created.getTime()) || Number.isNaN(updated.getTime())) {
    return false;
  }

  return updated.getTime() - created.getTime() > 60 * 1000;
}

function authorPresentation(evolution, authors) {
  const profile = authors[evolution.author];
  const name = professionalName(profile);

  if (name) {
    return {
      name,
      description: professionalDescription(profile),
    };
  }

  const authorUser = evolution.expand?.author;
  const email = authorUser?.email || "";

  return {
    name: email || "Profesional no identificado",
    description: "",
  };
}

function PatientTabs({ patientId, isAdmin }) {
  return (
    <nav className={styles.tabs} aria-label="Secciones del perfil del paciente">
      <Link to={`/patients/${patientId}`}>Resumen</Link>

      <Link to={`/patients/${patientId}#datos-personales`}>
        Datos personales
      </Link>

      <Link
        className={styles.activeTab}
        to={`/patients/${patientId}/history`}
        aria-current="page"
      >
        Historia clínica
      </Link>

      <Link to={`/patients/${patientId}#archivos`}>Multimedia</Link>

      {isAdmin && (
        <Link to={`/patients/${patientId}#administracion`}>
          Información administrativa
        </Link>
      )}
    </nav>
  );
}

function PatientCard({ patient, canCreate }) {
  const name = getFullName(patient);
  const age = calculateAge(patient.birth_date);
  const status = getPatientStatus(patient.status);
  const document = patient.document_number
    ? `${getPatientDocumentType(patient.document_type)} ${patient.document_number}`
    : "Documento no informado";

  return (
    <header className={styles.patientCard}>
      <Link
        className={styles.patientLink}
        to={`/patients/${patient.id}`}
        aria-label={`Ver resumen de ${name}`}
      >
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(patient.first_name, patient.last_name)}
        </span>

        <span className={styles.patientIdentity}>
          <span className={styles.patientName}>{name}</span>

          <span className={styles.patientMeta}>
            <span>{document}</span>

            <span>{age === null ? "Edad no informada" : `${age} años`}</span>

            <span className={`${styles.status} ${styles[status.tone]}`}>
              ● {status.label}
            </span>
          </span>
        </span>
      </Link>

      {canCreate && (
        <Link
          className={styles.newEvolution}
          to={`/evolutions/new?patientId=${patient.id}`}
        >
          <Icon name="plus" size={19} />
          Nueva evolución
        </Link>
      )}
    </header>
  );
}

function Filters({
  filters,
  professionals,
  dateError,
  setFilter,
  clearFilters,
  onApply,
}) {
  return (
    <div className={styles.filterFields}>
      <div className={styles.field}>
        <label htmlFor="history-type">Tipo de evolución</label>

        <select
          id="history-type"
          value={filters.evolutionType}
          onChange={(event) => setFilter("evolutionType", event.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="regular">Evolución</option>
          <option value="assessment">Evaluación</option>
          <option value="interconsultation">Interconsulta</option>
          <option value="other">Otro</option>
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="history-author">Profesional</label>

        <select
          id="history-author"
          value={filters.authorId}
          onChange={(event) => setFilter("authorId", event.target.value)}
        >
          <option value="">Todos los profesionales</option>

          {professionals.map((professional) => {
            const name =
              professionalName(professional) ||
              professional.expand?.staff_user?.email ||
              "Profesional sin nombre";

            return (
              <option
                key={professional.staff_user}
                value={professional.staff_user}
              >
                {name}
              </option>
            );
          })}
        </select>
      </div>

      <fieldset className={styles.period}>
        <legend>Período</legend>

        <div className={styles.dateFields}>
          <div className={styles.field}>
            <label htmlFor="history-from">Desde</label>

            <input
              id="history-from"
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilter("dateFrom", event.target.value)}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? "history-date-error" : undefined}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="history-to">Hasta</label>

            <input
              id="history-to"
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilter("dateTo", event.target.value)}
              aria-invalid={Boolean(dateError)}
              aria-describedby={dateError ? "history-date-error" : undefined}
            />
          </div>
        </div>

        {dateError && (
          <p className={styles.fieldError} id="history-date-error" role="alert">
            {dateError}
          </p>
        )}
      </fieldset>

      <div className={styles.filterActions}>
        <button
          className={styles.clearFilters}
          type="button"
          onClick={clearFilters}
        >
          Limpiar filtros
        </button>

        {onApply && (
          <button
            className={styles.applyFilters}
            type="button"
            onClick={onApply}
          >
            Aplicar filtros
          </button>
        )}
      </div>
    </div>
  );
}

function EvolutionCard({ evolution, authors, user, patientId }) {
  const type = evolutionTypeLabels[evolution.evolution_type] || "Evolución";
  const title = evolution.title?.trim() || type;
  const author = authorPresentation(evolution, authors);
  const canEdit = isEvolutionEditable(evolution, user);

  return (
    <article className={styles.evolutionCard}>
      <div className={styles.timelineMarker} aria-hidden="true">
        <Icon name="file" size={21} />
      </div>

      <div className={styles.evolutionContent}>
        <div className={styles.cardTop}>
          <div className={styles.cardHeading}>
            <div className={styles.badges}>
              <span className={styles.typeBadge}>{type}</span>

              {wasUpdated(evolution) && (
                <span className={styles.updatedBadge}>Actualizada</span>
              )}
            </div>

            <h2>{title}</h2>
          </div>

          <time dateTime={evolution.evolution_date || evolution.created}>
            {formatDateTime(evolution.evolution_date || evolution.created)}
          </time>
        </div>

        <div className={styles.author}>
          <Icon name="professional" size={17} />

          <span>
            <strong>{author.name}</strong>

            {author.description && <small>{author.description}</small>}
          </span>
        </div>

        <p className={styles.excerpt}>{excerpt(evolution.content)}</p>

        <div className={styles.cardActions}>
          {canEdit && (
            <Link
              className={styles.editButton}
              to={`/evolutions/${evolution.id}/edit`}
              state={{
                historyPath: `/patients/${patientId}/history${window.location.search}`,
              }}
            >
              <Icon name="edit" size={18} />
              Editar evolución
            </Link>
          )}

          <Link
            className={styles.viewButton}
            to={`/evolutions/${evolution.id}`}
            state={{
              historyPath: `/patients/${patientId}/history${window.location.search}`,
            }}
          >
            Ver evolución
          </Link>
        </div>
      </div>
    </article>
  );
}

function InaccessibleState() {
  return (
    <main className={styles.page}>
      <section className={styles.state} role="alert">
        <Icon name="shield" size={40} />

        <h1>No pudimos acceder a la historia clínica de este paciente</h1>

        <p>
          El registro no está disponible o tu usuario no tiene permiso para
          consultarlo.
        </p>

        <Link to="/patients">Volver a pacientes</Link>
      </section>
    </main>
  );
}

export function PatientHistoryPage() {
  const { patientId = "" } = useParams();
  const { user } = useAuth();
  const profileState = useProfessionalProfile(user);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const professionalReady =
    user.role !== "professional" ||
    (!profileState?.isLoading && Boolean(profileState?.data?.id));

  const history = usePatientHistory({
    patientId,
    user,
    professionalId: profileState?.data?.id,
    enabled: professionalReady,
  });

  useEffect(() => {
    if (!filtersOpen) return undefined;

    const closeWithEscape = (event) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
      }
    };

    document.addEventListener("keydown", closeWithEscape);

    return () => {
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [filtersOpen]);

  const isAdmin = user.role === "admin";

  const hasNonSearchFilters = Boolean(
    history.filters.evolutionType ||
    history.filters.authorId ||
    history.filters.dateFrom ||
    history.filters.dateTo,
  );

  const emptyMessage = useMemo(() => {
    if (history.hasActiveFilters) {
      return "No encontramos evoluciones que coincidan con los filtros seleccionados.";
    }

    return "Este paciente todavía no tiene evoluciones clínicas registradas.";
  }, [history.hasActiveFilters]);

  if (user.role === "professional" && profileState?.isLoading) {
    return (
      <main className={styles.page}>
        <SectionState type="loading" message="Cargando perfil profesional…" />
      </main>
    );
  }

  if (
    user.role === "professional" &&
    (profileState?.error || !profileState?.data)
  ) {
    return (
      <main className={styles.page}>
        <section className={styles.state} role="alert">
          <Icon name="shield" size={40} />

          <h1>No pudimos verificar tu perfil profesional</h1>

          <p>Revisá la conexión con el sistema e intentá nuevamente.</p>

          <button type="button" onClick={profileState?.retry}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (history.isLoadingPatient) {
    return (
      <main className={styles.page}>
        <SectionState type="loading" message="Cargando paciente…" />
      </main>
    );
  }

  if (history.patientError || !history.patient) {
    return <InaccessibleState />;
  }

  const patient = history.patient;
  const patientName = getFullName(patient);

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <span>{isAdmin ? "Portal Administrativo" : "Portal Médico"}</span>

        <Icon name="chevron" size={15} />

        <Link to="/patients">Pacientes</Link>

        <Icon name="chevron" size={15} />

        <Link to={`/patients/${patient.id}`}>{patientName}</Link>

        <Icon name="chevron" size={15} />

        <strong>Historia clínica</strong>
      </nav>

      <Link className={styles.back} to={`/patients/${patient.id}`}>
        <Icon name="arrow-left" size={18} />
        Volver al resumen
      </Link>

      <PatientCard patient={patient} canCreate={history.canCreate} />

      <PatientTabs patientId={patient.id} isAdmin={isAdmin} />

      <section
        className={styles.historySection}
        aria-labelledby="patient-history-title"
      >
        <div className={styles.titleRow}>
          <div>
            <h1 id="patient-history-title">Historia clínica</h1>

            <span className={styles.total} role="status">
              {history.totalItems}{" "}
              {history.totalItems === 1
                ? "registro clínico"
                : "registros clínicos"}
            </span>
          </div>

          {history.canCreate && (
            <Link
              className={styles.mobileNewEvolution}
              to={`/evolutions/new?patientId=${patient.id}`}
            >
              <Icon name="plus" size={19} />
              Nueva evolución
            </Link>
          )}
        </div>

        <div className={styles.controls}>
          <div className={styles.search}>
            <Icon name="search" size={21} />

            <label className={styles.visuallyHidden} htmlFor="history-search">
              Buscar en la historia clínica
            </label>

            <input
              id="history-search"
              type="search"
              value={history.searchInput}
              onChange={(event) => history.setSearchInput(event.target.value)}
              placeholder="Buscar en la historia clínica…"
            />

            {history.searchInput && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                onClick={() => history.setSearchInput("")}
              >
                <Icon name="clear" size={18} />
              </button>
            )}
          </div>

          <button
            className={`${styles.filterToggle} ${
              hasNonSearchFilters ? styles.filterToggleActive : ""
            }`}
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="patient-history-filters"
            onClick={() => setFiltersOpen((current) => !current)}
          >
            <Icon name="filter" size={20} />

            <span>Filtros</span>

            {hasNonSearchFilters && (
              <span
                className={styles.filterIndicator}
                aria-label="Hay filtros activos"
              />
            )}
          </button>

          <div className={styles.desktopFilters}>
            <Filters
              filters={history.filters}
              professionals={history.professionals}
              dateError={history.dateError}
              setFilter={history.setFilter}
              clearFilters={history.clearFilters}
            />
          </div>
        </div>

        <div
          className={`${styles.mobileFilters} ${
            filtersOpen ? styles.mobileFiltersOpen : ""
          }`}
          id="patient-history-filters"
          hidden={!filtersOpen}
        >
          <div className={styles.mobileFiltersHeader}>
            <h2>Filtrar historia clínica</h2>

            <button
              type="button"
              aria-label="Cerrar filtros"
              onClick={() => setFiltersOpen(false)}
            >
              <Icon name="close" size={21} />
            </button>
          </div>

          <Filters
            filters={history.filters}
            professionals={history.professionals}
            dateError={history.dateError}
            setFilter={history.setFilter}
            clearFilters={() => {
              history.clearFilters();
              setFiltersOpen(false);
            }}
            onApply={() => setFiltersOpen(false)}
          />
        </div>

        {history.dateError ? (
          <section className={styles.resultsState} role="alert">
            <Icon name="calendar" size={34} />

            <h2>Período inválido</h2>

            <p>{history.dateError}</p>
          </section>
        ) : history.isLoadingHistory ? (
          <SectionState type="loading" message="Cargando historia clínica…" />
        ) : history.historyError ? (
          <SectionState
            type="error"
            message="No pudimos cargar la historia clínica. Revisá la conexión e intentá nuevamente."
            onRetry={history.retry}
          />
        ) : !history.evolutions.length ? (
          <section className={styles.resultsState} role="status">
            <Icon name="file" size={34} />

            <h2>
              {history.hasActiveFilters
                ? "Sin resultados"
                : "Historia clínica vacía"}
            </h2>

            <p>{emptyMessage}</p>

            {history.hasActiveFilters && (
              <button type="button" onClick={history.clearFilters}>
                Limpiar filtros
              </button>
            )}
          </section>
        ) : (
          <>
            <div className={styles.timeline} aria-label="Evoluciones clínicas">
              {history.evolutions.map((evolution) => (
                <EvolutionCard
                  key={evolution.id}
                  evolution={evolution}
                  authors={history.authors}
                  user={user}
                  patientId={patient.id}
                />
              ))}
            </div>

            <div className={styles.pagination}>
              {history.hasMore ? (
                <button
                  type="button"
                  onClick={history.loadMore}
                  disabled={history.isLoadingMore}
                >
                  {history.isLoadingMore ? (
                    <>
                      <span className={styles.spinner} aria-hidden="true" />
                      Cargando registros…
                    </>
                  ) : (
                    <>
                      <Icon name="retry" size={18} />
                      Cargar más registros
                    </>
                  )}
                </button>
              ) : (
                <p role="status">No hay más registros para mostrar.</p>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
