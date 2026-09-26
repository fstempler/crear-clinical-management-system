import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useActivity } from "../../hooks/useActivity";
import { activityErrorMessage } from "../../services/activityService";
import { formatDateTime } from "../../utils/date";
import styles from "./ActivityPage.module.scss";

const labels = { evolutions: "Evoluciones", files: "Archivos", patients: "Pacientes", professionals: "Profesionales", assignments: "Asignaciones" };
const icons = { evolutions: "edit", files: "file", patients: "patients", professionals: "professional", assignments: "check" };
const zone = "America/Argentina/Buenos_Aires";
const dayKey = (value) => new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
const dayLabel = (key) => {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));
  if (key === today) return "Hoy";
  if (key === yesterday) return "Ayer";
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${key}T12:00:00Z`));
};
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`));

export function ActivityPage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const allowed = user.role === "admin" ? Object.keys(labels) : ["evolutions", "files", "assignments"];
  const type = allowed.includes(params.get("type")) ? params.get("type") : "";
  const q = params.get("q") || "";
  const from = validDate(params.get("from")) ? params.get("from") : "";
  const to = validDate(params.get("to")) ? params.get("to") : "";
  const [draft, setDraft] = useState({ url: q, value: q });
  const search = draft.url === q ? draft.value : q;
  const filters = useMemo(() => ({ q, type, from, to }), [q, type, from, to]);
  const activity = useActivity(user.role, user.id, filters);
  const filtered = Boolean(q || type || from || to);
  const groups = useMemo(() => {
    const result = new Map();
    for (const item of activity.items) {
      const key = dayKey(item.timestamp);
      if (!result.has(key)) result.set(key, []);
      result.get(key).push(item);
    }
    return [...result.entries()];
  }, [activity.items]);
  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };
  const submit = (event) => { event.preventDefault(); update("q", search.trim()); };
  const clear = () => { setDraft({ url: "", value: "" }); setParams({}); };
  const failed = activity.failures.length > 0;
  const error = activity.failures[0]?.error;

  return <main className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Ruta de navegación"><Link to="/">Inicio</Link><Icon name="chevron" size={16} /><span aria-current="page">Actividad reciente</span></nav>
    <header className={styles.heading}>
      <div><h1>Actividad reciente</h1><p>{user.role === "admin" ? "Movimientos visibles de pacientes, profesionales y registros clínicos." : "Movimientos visibles de tus pacientes asignados y tus asignaciones."}</p></div>
      <button type="button" onClick={activity.refresh} disabled={activity.loading} className={styles.refresh}><Icon name="retry" size={18} />Actualizar</button>
    </header>
    <form className={styles.filters} onSubmit={submit} aria-label="Filtrar actividad">
      <div className={styles.field}><label htmlFor="activity-search">Buscar</label><div className={styles.search}><input id="activity-search" type="search" value={search} onChange={(event) => setDraft({ url: q, value: event.target.value })} placeholder="Nombre, DNI, título o archivo" /><button type="submit">Buscar</button></div></div>
      <div className={styles.field}><label htmlFor="activity-type">Tipo de actividad</label><select id="activity-type" value={type} onChange={(event) => update("type", event.target.value)}><option value="">Todos</option>{allowed.map((option) => <option key={option} value={option}>{option === "assignments" && user.role === "professional" ? "Asignaciones propias" : labels[option]}</option>)}</select></div>
      <div className={styles.field}><label htmlFor="activity-from">Desde</label><input id="activity-from" type="date" value={from} max={to || undefined} onChange={(event) => update("from", event.target.value)} /></div>
      <div className={styles.field}><label htmlFor="activity-to">Hasta</label><input id="activity-to" type="date" value={to} min={from || undefined} onChange={(event) => update("to", event.target.value)} /></div>
      {filtered && <button type="button" onClick={clear} className={styles.clear}>Limpiar filtros</button>}
    </form>
    <div aria-live="polite" className={styles.summary}>{activity.loading ? "Cargando actividad…" : `${activity.items.length} ${activity.items.length === 1 ? "registro visible cargado" : "registros visibles cargados"}${activity.hasMore ? "; hay más actividad" : ""}`}</div>
    {failed && <div className={styles.warning} role="alert"><p>{activity.items.length ? "Parte de la actividad no pudo cargarse." : activityErrorMessage(error)} {activity.failures.length > 1 ? `Fallaron ${activity.failures.length} fuentes.` : ""}</p><button type="button" onClick={activity.retry} disabled={activity.loading || activity.loadingMore}>Reintentar</button></div>}
    {activity.loading ? <SectionState type="loading" message="Cargando actividad reciente…" /> : <>
      {!activity.items.length && !failed && <div className={styles.empty}><Icon name={filtered ? "search" : "activity"} size={34} /><h2>{filtered ? "Sin resultados para estos filtros" : "Todavía no hay actividad disponible"}</h2><p>{filtered ? "Probá con otra búsqueda o limpiá los filtros." : "Los registros visibles aparecerán aquí cuando estén disponibles."}</p>{filtered && <button type="button" onClick={clear}>Limpiar filtros</button>}</div>}
      {groups.map(([date, items]) => <section key={date} className={styles.group} aria-label={dayLabel(date)}><h2>{dayLabel(date)}</h2><ol className={styles.timeline}>{items.map((item) => <li key={item.key} className={styles.entry}><span className={styles.icon}><Icon name={icons[item.type]} size={21} /></span><div className={styles.card}><div className={styles.meta}><span>{labels[item.type]}</span><time dateTime={item.timestamp}>{formatDateTime(item.timestamp)}</time></div><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.destination && <Link to={item.destination} aria-label={`Ver registro: ${item.title}${item.patient ? `, ${item.patient}` : ""}`}>Ver registro <Icon name="chevron" size={16} /></Link>}</div></li>)}</ol></section>)}
      {activity.hasMore && <div className={styles.more}><button type="button" onClick={activity.loadMore} disabled={activity.loadingMore}>{activity.loadingMore ? "Cargando…" : "Cargar más"}</button></div>}
      {!activity.hasMore && activity.items.length > 0 && !failed && <p className={styles.end}>No hay más actividad visible.</p>}
    </>}
  </main>;
}
