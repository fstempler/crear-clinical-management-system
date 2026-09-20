import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { Pagination } from "../../components/patients/Pagination";
import { loadAssignmentCandidates, useProfessionalAssignments } from "../../hooks/useProfessionalAssignments";
import { ASSIGNMENTS_PER_PAGE } from "../../services/professionalsService";
import { formatDateTime } from "../../utils/date";
import { getFullName, getInitials, getPatientStatus } from "../../utils/presentation";
import styles from "./ProfessionalAssignmentsPage.module.scss";

const ALLOWED_STATUSES = new Set(["active", "inactive"]);
const EMPTY_CANDIDATES = { items: [], page: 1, totalPages: 0, totalItems: 0 };

function readPage(value) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function safeReturnPath(value) {
  return typeof value === "string" && /^\/professionals(?:[/?]|$)/.test(value) ? value : "/professionals";
}

function AssignmentStatus({ active }) {
  return <span className={`${styles.badge} ${active ? styles.active : styles.inactive}`}>{active ? "Activa" : "Inactiva"}</span>;
}

function AccessibleDialog({ children, labelledBy, describedBy, busy, onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const previousFocus = useRef(document.activeElement);
  useEffect(() => {
    const focusToRestore = previousFocus.current;
    closeRef.current?.focus();
    const keydown = (event) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab") return;
      const buttons = [...ref.current.querySelectorAll("button:not(:disabled), input:not(:disabled)")];
      if (!buttons.length) return;
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); focusToRestore?.focus?.(); };
  }, [busy, onClose]);
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section ref={ref} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={labelledBy} aria-describedby={describedBy}>
        <button ref={closeRef} className={styles.dialogClose} type="button" onClick={onClose} disabled={busy} aria-label="Cerrar diálogo"><Icon name="close" size={21} /></button>
        {children}
      </section>
    </div>
  );
}

function CandidateDialog({ professionalId, professionalName, operation, onAssign, onClose }) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState({ data: EMPTY_CANDIDATES, loading: true, error: null });
  const requestId = useRef(0);
  useEffect(() => {
    const current = ++requestId.current;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((previous) => ({ ...previous, loading: true, error: null }));
    loadAssignmentCandidates({ professionalId, search: query, page })
      .then((data) => { if (current === requestId.current) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (current === requestId.current) setState({ data: EMPTY_CANDIDATES, loading: false, error }); });
    return () => { requestId.current += 1; };
  }, [page, professionalId, query, operation.success, retryKey]);
  const submit = (event) => { event.preventDefault(); setPage(1); setQuery(input.trim()); };
  const busy = Boolean(operation.type);
  return (
    <AccessibleDialog labelledBy="candidate-title" describedBy="candidate-description" busy={busy} onClose={onClose}>
      <h2 id="candidate-title">Asignar paciente</h2>
      <p id="candidate-description">Buscá un paciente activo para asignarlo a <strong>{professionalName}</strong>.</p>
      <form className={styles.candidateSearch} onSubmit={submit}>
        <label htmlFor="candidate-search">Nombre, apellido o documento</label>
        <div><input id="candidate-search" type="search" value={input} onChange={(event) => setInput(event.target.value)} autoFocus /><button type="submit">Buscar</button></div>
      </form>
      {state.loading ? <SectionState type="loading" message="Buscando pacientes…" /> : state.error ? <div className={styles.dialogState} role="alert"><p>No pudimos buscar pacientes.</p><button type="button" onClick={() => setRetryKey((value) => value + 1)}>Reintentar</button></div> : !state.data.items.length ? <div className={styles.dialogState} role="status"><p>{query ? "No encontramos pacientes activos con esa búsqueda." : "No hay pacientes activos disponibles."}</p></div> : (
        <ul className={styles.candidates}>
          {state.data.items.map(({ patient, assignment }) => {
            const inProgress = operation.id === patient.id;
            return <li key={patient.id}><span className={styles.patientAvatar}>{getInitials(patient.first_name, patient.last_name)}</span><div><strong>{getFullName(patient)}</strong><small>Documento {patient.document_number || "no informado"}</small></div>{assignment?.active ? <span className={`${styles.badge} ${styles.active}`}>Ya asignado</span> : <button type="button" disabled={busy} onClick={() => onAssign(patient, assignment)}>{inProgress ? (assignment ? "Reactivando…" : "Asignando…") : (assignment ? "Reactivar" : "Asignar")}</button>}</li>;
          })}
        </ul>
      )}
      {operation.error && <p className={styles.operationError} role="alert">{operation.error}</p>}
      {state.data.totalPages > 1 && <div className={styles.candidatePager}><button type="button" disabled={page <= 1 || busy} onClick={() => setPage((value) => value - 1)}>Anterior</button><span>Página {page} de {state.data.totalPages}</span><button type="button" disabled={page >= state.data.totalPages || busy} onClick={() => setPage((value) => value + 1)}>Siguiente</button></div>}
    </AccessibleDialog>
  );
}

function DeactivateDialog({ assignment, professionalName, operation, onConfirm, onClose }) {
  const patientName = getFullName(assignment.expand?.patient);
  const busy = operation.type === "deactivating";
  return <AccessibleDialog labelledBy="deactivate-title" describedBy="deactivate-description" busy={busy} onClose={onClose}>
    <h2 id="deactivate-title">Desactivar asignación</h2>
    <div id="deactivate-description" className={styles.confirmText}><p>Vas a desasignar a <strong>{patientName}</strong> de <strong>{professionalName}</strong>.</p><p>El historial clínico no se elimina. El profesional perderá inmediatamente el acceso concedido por esta asignación y Administración podrá reactivarla posteriormente.</p></div>
    {operation.error && <p className={styles.operationError} role="alert">{operation.error}</p>}
    <div className={styles.dialogActions}><button type="button" onClick={onClose} disabled={busy}>Cancelar</button><button className={styles.danger} type="button" onClick={onConfirm} disabled={busy}>{busy ? "Desactivando…" : "Desactivar asignación"}</button></div>
  </AccessibleDialog>;
}

export function ProfessionalAssignmentsPage() {
  const { professionalId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";
  const [searchInput, setSearchInput] = useState(query);
  const rawStatus = searchParams.get("status") || "";
  const status = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : "";
  const page = readPage(searchParams.get("page"));
  const data = useProfessionalAssignments({ professionalId, page, search: query, status });
  const [candidateOpen, setCandidateOpen] = useState(false);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);
  const returnPath = safeReturnPath(location.state?.returnPath);
  const profilePath = `/professionals/${professionalId}`;
  const updateParams = (updates) => { const next = new URLSearchParams(searchParams); Object.entries(updates).forEach(([key, value]) => value && value !== 1 ? next.set(key, String(value)) : next.delete(key)); setSearchParams(next); };
  const clearFilters = () => { setSearchInput(""); setSearchParams({}); };
  const hasFilters = Boolean(query || status);

  useEffect(() => {
    if ((rawStatus && !ALLOWED_STATUSES.has(rawStatus)) || (searchParams.get("page") && page === 1 && searchParams.get("page") !== "1")) {
      const next = new URLSearchParams(searchParams); if (!ALLOWED_STATUSES.has(rawStatus)) next.delete("status"); if (page === 1) next.delete("page"); setSearchParams(next, { replace: true });
    }
  }, [page, rawStatus, searchParams, setSearchParams]);

  if (data.loadingProfessional) return <main className={styles.page}><SectionState type="loading" message="Cargando profesional…" /></main>;
  if (data.error || !data.professional) {
    const notFound = data.error?.status === 404;
    return <main className={styles.page}><section className={styles.state} role="alert"><Icon name={notFound ? "professional" : "retry"} size={38} /><h1>{notFound ? "Profesional no encontrado" : "No pudimos cargar el profesional"}</h1><p>{notFound ? "El registro no existe o no está disponible." : "Revisá la conexión e intentá nuevamente."}</p><Link to={returnPath}>Volver a profesionales</Link>{!notFound && <button type="button" onClick={data.retry}>Reintentar</button>}</section></main>;
  }

  const name = getFullName(data.professional);
  const accountActive = Boolean(data.account?.active);
  const submitSearch = (event) => { event.preventDefault(); updateParams({ q: searchInput.trim(), page: "" }); };
  const closeCandidate = () => { if (!data.operation.type) { setCandidateOpen(false); data.clearOperationMessage(); } };
  const confirmDeactivate = async () => { if (await data.deactivate(pendingDeactivate)) setPendingDeactivate(null); };
  return <main className={styles.page}>
    {data.operation.success && <div className={styles.success} role="status" aria-live="polite"><Icon name="check" size={20} />{data.operation.success}</div>}
    <nav className={styles.breadcrumb} aria-label="Migas de pan"><Link to="/">Portal Administrativo</Link><Icon name="chevron" size={16} /><Link to={returnPath}>Profesionales</Link><Icon name="chevron" size={16} /><Link to={profilePath}>{name}</Link><Icon name="chevron" size={16} /><strong aria-current="page">Pacientes asignados</strong></nav>
    <Link className={styles.back} to={profilePath} state={{ returnPath, assignmentsUpdated: Boolean(data.operation.success) }}><Icon name="arrow-left" size={18} />Volver al perfil</Link>
    <header className={styles.professionalHeader}><span className={styles.avatar}>{getInitials(data.professional.first_name, data.professional.last_name, "PR")}</span><div><div className={styles.nameRow}><h1>{name}</h1><span className={`${styles.badge} ${accountActive ? styles.active : styles.inactive}`}>{data.account ? (accountActive ? "Cuenta activa" : "Cuenta inactiva") : "Cuenta no disponible"}</span></div><p>{[data.professional.profession, data.professional.specialty].filter(Boolean).join(" · ") || "Profesión no informada"}</p><small>Matrícula {data.professional.license_number || "no informada"}</small></div><button className={styles.primary} type="button" disabled={!accountActive} onClick={() => { data.clearOperationMessage(); setCandidateOpen(true); }}><Icon name="plus" size={19} />Asignar paciente</button></header>
    {!data.account && <div className={styles.notice} role="alert">No se encontró la cuenta asociada. No es posible crear asignaciones.</div>}
    {data.account && !accountActive && <div className={styles.notice} role="status">La cuenta profesional está inactiva. Podés consultar y desactivar relaciones existentes, pero no asignar ni reactivar pacientes.</div>}
    <section className={styles.metrics} aria-label="Resumen de asignaciones"><article><span>Total de relaciones</span><strong>{data.metrics.total ?? "—"}</strong></article><article><span>Asignaciones activas</span><strong>{data.metrics.active ?? "—"}</strong></article><article><span>Asignaciones inactivas</span><strong>{data.metrics.inactive ?? "—"}</strong></article></section>
    <section className={styles.filters} aria-label="Búsqueda y filtros"><form onSubmit={submitSearch}><label htmlFor="assignment-search">Buscar asignaciones</label><div><Icon name="search" size={20} /><input id="assignment-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nombre, apellido o documento" /><button type="submit">Buscar</button></div></form><label>Estado<select value={status} onChange={(event) => updateParams({ status: event.target.value, page: "" })}><option value="">Todas</option><option value="active">Activas</option><option value="inactive">Inactivas</option></select></label><button className={styles.clear} type="button" disabled={!hasFilters && !searchInput} onClick={clearFilters}><Icon name="clear" size={18} />Limpiar filtros</button></section>
    <section className={styles.results} aria-labelledby="assignments-title"><div className={styles.resultsHeading}><h2 id="assignments-title">Pacientes asignados</h2>{!data.loadingAssignments && !data.listError && <span>{data.list.totalItems} {data.list.totalItems === 1 ? "relación" : "relaciones"}</span>}</div>
      {data.loadingAssignments ? <SectionState type="loading" message="Cargando asignaciones…" /> : data.listError ? <SectionState type="error" message={data.listError?.status === 403 ? "No tenés permisos para consultar estas asignaciones." : "No pudimos cargar las asignaciones."} onRetry={data.retry} /> : !data.list.items.length ? <div className={styles.empty} role="status"><Icon name={hasFilters ? "search" : "patients"} size={37} /><h3>{hasFilters ? "No encontramos asignaciones con esos filtros." : "Este profesional todavía no tiene asignaciones."}</h3>{hasFilters && <button type="button" onClick={clearFilters}>Limpiar filtros</button>}</div> : <>
        <div className={styles.desktopTable}><table><thead><tr><th>Paciente</th><th>Estado del paciente</th><th>Asignación</th><th>Fecha de asignación</th><th>Desasignación</th><th>Acciones</th></tr></thead><tbody>{data.list.items.map((assignment) => { const patient = assignment.expand?.patient; if (!patient) return null; const patientStatus = getPatientStatus(patient.status); return <tr key={assignment.id}><td><div className={styles.identity}><span className={styles.patientAvatar}>{getInitials(patient.first_name, patient.last_name)}</span><div><Link to={`/patients/${patient.id}`}>{getFullName(patient)}</Link><small>Documento {patient.document_number || "no informado"}</small></div></div></td><td><span className={`${styles.badge} ${styles[patientStatus.tone]}`}>{patientStatus.label}</span></td><td><AssignmentStatus active={assignment.active} /></td><td>{formatDateTime(assignment.assigned_at)}</td><td>{assignment.unassigned_at ? formatDateTime(assignment.unassigned_at) : "—"}</td><td>{assignment.active ? <button className={styles.deactivate} type="button" onClick={() => { data.clearOperationMessage(); setPendingDeactivate(assignment); }}>Desactivar</button> : accountActive && <button className={styles.reactivate} type="button" disabled={Boolean(data.operation.type)} onClick={() => data.assign(patient, assignment)}>{data.operation.id === patient.id ? "Reactivando…" : "Reactivar"}</button>}</td></tr>; })}</tbody></table></div>
        <div className={styles.mobileCards}>{data.list.items.map((assignment) => { const patient = assignment.expand?.patient; if (!patient) return null; const patientStatus = getPatientStatus(patient.status); return <article key={assignment.id}><header><span className={styles.patientAvatar}>{getInitials(patient.first_name, patient.last_name)}</span><div><h3><Link to={`/patients/${patient.id}`}>{getFullName(patient)}</Link></h3><p>Documento {patient.document_number || "no informado"}</p></div></header><div className={styles.cardBadges}><span className={`${styles.badge} ${styles[patientStatus.tone]}`}>Paciente {patientStatus.label.toLowerCase()}</span><AssignmentStatus active={assignment.active} /></div><dl><div><dt>Asignación</dt><dd>{formatDateTime(assignment.assigned_at)}</dd></div><div><dt>Desasignación</dt><dd>{assignment.unassigned_at ? formatDateTime(assignment.unassigned_at) : "—"}</dd></div></dl>{assignment.active ? <button className={styles.deactivate} type="button" onClick={() => { data.clearOperationMessage(); setPendingDeactivate(assignment); }}>Desactivar asignación</button> : accountActive && <button className={styles.reactivate} type="button" disabled={Boolean(data.operation.type)} onClick={() => data.assign(patient, assignment)}>{data.operation.id === patient.id ? "Reactivando…" : "Reactivar asignación"}</button>}</article>; })}</div>
        <Pagination page={data.list.page} totalPages={data.list.totalPages} totalItems={data.list.totalItems} perPage={ASSIGNMENTS_PER_PAGE} onChange={(nextPage) => updateParams({ page: nextPage })} itemLabel="asignaciones" ariaLabel="Paginación de asignaciones" />
      </>}
    </section>
    {candidateOpen && <CandidateDialog professionalId={professionalId} professionalName={name} operation={data.operation} onAssign={data.assign} onClose={closeCandidate} />}
    {pendingDeactivate && <DeactivateDialog assignment={pendingDeactivate} professionalName={name} operation={data.operation} onConfirm={confirmDeactivate} onClose={() => { if (!data.operation.type) { setPendingDeactivate(null); data.clearOperationMessage(); } }} />}
  </main>;
}
