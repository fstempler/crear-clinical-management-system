import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { Pagination } from "../../components/patients/Pagination";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { actionLabels, auditErrorMessage, AUDIT_PAGE_SIZE, entityLabels, fieldLabels, readable } from "../../services/auditService";
import { getFullName } from "../../utils/presentation";
import styles from "./AuditPage.module.scss";

const roleLabels = { admin: "Administración", professional: "Profesional" };
const formatTime = (value, exact = false) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: exact ? "2-digit" : undefined }).format(date);
};
const patientName = (item) => item.expand?.patient ? getFullName(item.expand.patient) : item.patient ? `Paciente ${item.patient}` : "Sin paciente asociado";
const destination = (item) => {
  if (!item.entity_id) return null;
  if (item.entity_type === "patient") return `/patients/${encodeURIComponent(item.entity_id)}`;
  if (item.entity_type === "evolution") return `/evolutions/${encodeURIComponent(item.entity_id)}`;
  if (item.entity_type === "professional") return `/professionals/${encodeURIComponent(item.entity_id)}`;
  return null;
};
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime());

function EventDetail({ item, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const escape = (event) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose]);
  const fields = Array.isArray(item.changes?.fields) ? item.changes.fields.filter((field) => typeof field === "string") : [];
  const method = { password: "Contraseña", recovery: "Recuperación de contraseña" }[item.context?.method];
  const category = typeof item.context?.category === "string" ? item.context.category : "";
  return <div className={styles.detail} id={`audit-detail-${item.id}`}>
    <h3>Detalle del evento</h3>
    <dl>
      <div><dt>ID del evento</dt><dd>{item.id}</dd></div>
      <div><dt>Fecha y hora</dt><dd><time dateTime={item.created}>{formatTime(item.created, true)}</time></dd></div>
      <div><dt>Usuario</dt><dd>{item.actor_label || item.expand?.actor?.email || item.actor || "Usuario no identificado"}</dd></div>
      <div><dt>Rol</dt><dd>{readable(item.actor_role, roleLabels)}</dd></div>
      <div><dt>Acción</dt><dd>{readable(item.action, actionLabels)}</dd></div>
      <div><dt>Entidad</dt><dd>{readable(item.entity_type, entityLabels)}</dd></div>
      <div><dt>ID de entidad</dt><dd>{item.entity_id || "Sin identificador"}</dd></div>
      <div><dt>Resumen</dt><dd>{item.summary || "Sin resumen"}</dd></div>
      <div><dt>Paciente relacionado</dt><dd>{item.patient ? <Link to={`/patients/${encodeURIComponent(item.patient)}`}>{patientName(item)}</Link> : patientName(item)}</dd></div>
      <div><dt>Campos modificados</dt><dd>{fields.length ? <ul>{fields.map((field) => <li key={field}>{readable(field, fieldLabels)}</li>)}</ul> : "Sin campos informados"}</dd></div>
      <div><dt>Contexto permitido</dt><dd>{method || category ? <ul>{method && <li>Método de autenticación: {method}</li>}{category && <li>Categoría: {readable(category, {})}</li>}</ul> : "Sin contexto adicional"}</dd></div>
    </dl>
    <button ref={closeRef} type="button" onClick={onClose}>Cerrar detalle</button>
  </div>;
}

export function AuditPage() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [role, setRole] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [opened, setOpened] = useState(null);
  const openedBy = useRef(null);
  const topRef = useRef(null);
  useEffect(() => { const timer = setTimeout(() => setSearch(draft.trim()), 350); return () => clearTimeout(timer); }, [draft]);
  const filters = useMemo(() => ({ q: search, action, entity, role, from, to }), [search, action, entity, role, from, to]);
  const audit = useAuditLogs(filters);
  const filtered = Boolean(search || action || entity || role || from || to);
  const close = () => { setOpened(null); requestAnimationFrame(() => openedBy.current?.focus()); };
  const toggle = (id, event) => { if (opened === id) close(); else { openedBy.current = event.currentTarget; setOpened(id); } };
  const clear = () => { setDraft(""); setSearch(""); setAction(""); setEntity(""); setRole(""); setFrom(""); setTo(""); setOpened(null); };
  const pageChange = (next) => { setOpened(null); audit.changePage(next); topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  return <main className={styles.page} ref={topRef}>
    <nav className={styles.breadcrumb} aria-label="Ruta de navegación"><Link to="/">Inicio</Link><Icon name="chevron" size={16} /><span aria-current="page">Auditoría</span></nav>
    <header className={styles.heading}><h1>Auditoría del sistema</h1><p>Consulta el registro inmutable de accesos y operaciones realizadas en el sistema.</p><span className={styles.readonly}><Icon name="shield" size={17} /> Solo lectura</span></header>
    <section className={styles.filters} aria-label="Filtros de auditoría">
      <div className={styles.search}><label htmlFor="audit-search">Buscar</label><input id="audit-search" type="search" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Usuario, resumen o ID de entidad" /></div>
      <div><label htmlFor="audit-action">Acción</label><select id="audit-action" value={action} onChange={(event) => setAction(event.target.value)}><option value="">Todas las acciones</option>{Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      <div><label htmlFor="audit-entity">Entidad</label><select id="audit-entity" value={entity} onChange={(event) => setEntity(event.target.value)}><option value="">Todas las entidades</option>{Object.entries(entityLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      <div><label htmlFor="audit-role">Rol del usuario</label><select id="audit-role" value={role} onChange={(event) => setRole(event.target.value)}><option value="">Todos los roles</option>{Object.entries(roleLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      <div><label htmlFor="audit-from">Desde</label><input id="audit-from" type="date" value={from} max={to || undefined} onChange={(event) => setFrom(validDate(event.target.value) ? event.target.value : "")} /></div>
      <div><label htmlFor="audit-to">Hasta</label><input id="audit-to" type="date" value={to} min={from || undefined} onChange={(event) => setTo(validDate(event.target.value) ? event.target.value : "")} /></div>
      <button className={styles.clear} type="button" onClick={clear} disabled={!filtered && !draft}>Limpiar filtros</button>
    </section>
    <p className={styles.summary} role="status" aria-live="polite">{audit.loading ? "Cargando eventos…" : audit.error ? "No se pudieron cargar los eventos." : `${audit.totalItems} ${audit.totalItems === 1 ? "evento encontrado" : "eventos encontrados"}`}</p>
    {audit.error ? <SectionState type="error" message={auditErrorMessage(audit.error)} onRetry={audit.retry} /> : audit.loading ? <SectionState type="loading" message="Cargando auditoría…" /> : audit.items.length === 0 ? <section className={styles.empty}><Icon name={filtered ? "search" : "shield"} size={30} /><h2>{filtered ? "Sin resultados para estos filtros" : "Todavía no hay eventos registrados"}</h2><p>{filtered ? "Probá otros criterios o limpiá los filtros." : "Los eventos del sistema aparecerán aquí."}</p>{filtered && <button type="button" onClick={clear}>Limpiar filtros</button>}</section> : <>
      <div className={styles.tableWrap}><table><thead><tr><th scope="col">Fecha y hora</th><th scope="col">Usuario</th><th scope="col">Rol</th><th scope="col">Acción</th><th scope="col">Entidad</th><th scope="col">Resumen</th><th scope="col">Paciente</th><th scope="col">Detalle</th></tr></thead><tbody>{audit.items.map((item) => <tr key={item.id}><td><time dateTime={item.created}>{formatTime(item.created)}</time></td><td>{item.actor_label || item.expand?.actor?.email || item.actor || "Usuario no identificado"}</td><td>{readable(item.actor_role, roleLabels)}</td><td>{readable(item.action, actionLabels)}</td><td>{readable(item.entity_type, entityLabels)}</td><td>{item.summary || "Sin resumen"}</td><td>{item.patient ? <Link to={`/patients/${encodeURIComponent(item.patient)}`}>{patientName(item)}</Link> : patientName(item)}</td><td><button type="button" aria-expanded={opened === item.id} aria-controls={`audit-detail-${item.id}`} onClick={(event) => toggle(item.id, event)}>Ver detalle</button></td></tr>)}</tbody></table></div>
      <div className={styles.cards}>{audit.items.map((item) => <article className={styles.card} key={item.id}><time dateTime={item.created}>{formatTime(item.created)}</time><h2>{readable(item.action, actionLabels)} · {readable(item.entity_type, entityLabels)}</h2><p><strong>Usuario:</strong> {item.actor_label || item.expand?.actor?.email || item.actor || "Usuario no identificado"}</p><p>{item.summary || "Sin resumen"}</p>{item.patient && <p><strong>Paciente:</strong> <Link to={`/patients/${encodeURIComponent(item.patient)}`}>{patientName(item)}</Link></p>}<button type="button" aria-expanded={opened === item.id} aria-controls={`audit-detail-${item.id}`} onClick={(event) => toggle(item.id, event)}>Ver detalle</button></article>)}</div>
      {opened && audit.items.some((item) => item.id === opened) && <EventDetail item={audit.items.find((item) => item.id === opened)} onClose={close} />}
      {opened && destination(audit.items.find((item) => item.id === opened) || {}) && <Link className={styles.contextLink} to={destination(audit.items.find((item) => item.id === opened))}>Ver entidad relacionada</Link>}
      <Pagination page={audit.page} totalPages={audit.totalPages} totalItems={audit.totalItems} perPage={AUDIT_PAGE_SIZE} onChange={pageChange} itemLabel="eventos" ariaLabel="Paginación de auditoría" />
    </>}
  </main>;
}
