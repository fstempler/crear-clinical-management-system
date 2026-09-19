import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { Pagination } from "../../components/patients/Pagination";
import { useProfessionals } from "../../hooks/useProfessionals";
import { PROFESSIONALS_PER_PAGE } from "../../services/professionalsService";
import { formatDateTime } from "../../utils/date";
import { getFullName, getInitials } from "../../utils/presentation";
import styles from "./ProfessionalsPage.module.scss";

const ALLOWED_STATUSES = new Set(["active", "inactive"]);

function readPage(value) {
  const page = Number.parseInt(value || "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function account(professional) {
  return professional.expand?.staff_user || null;
}

function email(professional) {
  return professional.email || account(professional)?.email || "Email no disponible";
}

function lastLogin(professional) {
  return account(professional)?.last_login_at
    ? formatDateTime(account(professional).last_login_at)
    : "Sin ingresos registrados";
}

function Status({ professional }) {
  const relatedAccount = account(professional);
  if (!relatedAccount) return <span className={`${styles.status} ${styles.unavailable}`}>Cuenta no disponible</span>;
  return (
    <span className={`${styles.status} ${relatedAccount.active ? styles.active : styles.inactive}`}>
      {relatedAccount.active ? "Activo" : "Inactivo"}
    </span>
  );
}

function Avatar({ professional }) {
  return <span className={styles.avatar} aria-hidden="true">{getInitials(professional.first_name, professional.last_name, "PR")}</span>;
}

function ProfessionalsResults({ result, onPageChange }) {
  return (
    <section className={styles.results} aria-label="Resultados de profesionales">
      <div className={styles.desktopTable}>
        <table>
          <thead><tr><th>Profesional</th><th>Profesión</th><th>Especialidad</th><th>Matrícula</th><th>Contacto</th><th>Estado</th><th>Último acceso</th></tr></thead>
          <tbody>
            {result.items.map((professional) => (
              <tr key={professional.id}>
                <td><div className={styles.identity}><Avatar professional={professional} /><div><strong>{getFullName(professional)}</strong><span>Documento {professional.document_number || "no informado"}</span></div></div></td>
                <td>{professional.profession || "Sin profesión informada"}</td>
                <td>{professional.specialty || "Sin especialidad informada"}</td>
                <td>{professional.license_number || "No informada"}</td>
                <td><div className={styles.contact}><span>{email(professional)}</span><span>{professional.phone || "Sin teléfono informado"}</span></div></td>
                <td><Status professional={professional} /></td>
                <td>{lastLogin(professional)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.mobileCards}>
        {result.items.map((professional) => (
          <article className={styles.card} key={professional.id}>
            <header><Avatar professional={professional} /><div><h2>{getFullName(professional)}</h2><p>{professional.profession || "Sin profesión informada"}</p></div><Status professional={professional} /></header>
            <dl>
              <div><dt>Especialidad</dt><dd>{professional.specialty || "Sin especialidad informada"}</dd></div>
              <div><dt>Matrícula</dt><dd>{professional.license_number || "No informada"}</dd></div>
              <div><dt>Email</dt><dd>{email(professional)}</dd></div>
              <div><dt>Teléfono</dt><dd>{professional.phone || "Sin teléfono informado"}</dd></div>
              <div><dt>Documento</dt><dd>{professional.document_number || "No informado"}</dd></div>
              <div><dt>Último acceso</dt><dd>{lastLogin(professional)}</dd></div>
            </dl>
          </article>
        ))}
      </div>
      <Pagination page={result.page} totalPages={result.totalPages} totalItems={result.totalItems} perPage={PROFESSIONALS_PER_PAGE} onChange={onPageChange} itemLabel="profesionales" ariaLabel="Paginación de profesionales" />
    </section>
  );
}

export function ProfessionalsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const querySearch = searchParams.get("q")?.trim() || "";
  const [searchInput, setSearchInput] = useState(querySearch);
  const rawStatus = searchParams.get("status") || "";
  const status = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : "";
  const profession = searchParams.get("profession")?.trim() || "";
  const specialty = searchParams.get("specialty")?.trim() || "";
  const page = readPage(searchParams.get("page"));
  const professionals = useProfessionals({ page, search: querySearch, profession, specialty, status });
  const hasFilters = Boolean(querySearch || profession || specialty || status);

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "1") next.set(key, String(value));
      else next.delete(key);
    });
    setSearchParams(next);
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
    if (!professionals.isLoading && professionals.data.totalPages > 0 && page > professionals.data.totalPages) {
      const next = new URLSearchParams(searchParams);
      if (professionals.data.totalPages === 1) next.delete("page");
      else next.set("page", String(professionals.data.totalPages));
      setSearchParams(next, { replace: true });
    }
  }, [page, professionals.data.totalPages, professionals.isLoading, searchParams, setSearchParams]);

  const submitSearch = (event) => {
    event.preventDefault();
    updateParams({ q: searchInput.trim(), page: "" });
  };
  const clearFilters = () => { setSearchInput(""); setSearchParams({}); };

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan"><Link to="/">Portal Administrativo</Link><Icon name="chevron" size={16} /><span aria-current="page">Profesionales</span></nav>
      <header className={styles.heading}><h1>Profesionales</h1><p>Consultá el equipo profesional y el estado de sus cuentas.</p></header>
      {!professionals.isLoading && !professionals.error && <p className={styles.count} aria-live="polite"><strong>{professionals.data.totalItems}</strong> {professionals.data.totalItems === 1 ? "profesional encontrado" : "profesionales encontrados"}</p>}

      <section className={styles.metrics} aria-label="Resumen de profesionales">
        <article><span>Total de profesionales</span><strong>{professionals.metrics.total ?? "—"}</strong></article>
        <article><span>Cuentas activas</span><strong>{professionals.metrics.active ?? "—"}</strong></article>
        <article><span>Cuentas inactivas</span><strong>{professionals.metrics.inactive ?? "—"}</strong></article>
      </section>

      <section className={styles.filters} aria-label="Búsqueda y filtros">
        <form onSubmit={submitSearch} className={styles.searchForm}>
          <label htmlFor="professional-search">Buscar profesionales</label>
          <div><Icon name="search" size={20} /><input id="professional-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Nombre, documento, matrícula o email" /><button type="submit">Buscar</button></div>
        </form>
        <div className={styles.selects}>
          <label>Profesión<select value={profession} onChange={(event) => updateParams({ profession: event.target.value, page: "" })}><option value="">Todas</option>{professionals.options.professions.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Especialidad<select value={specialty} onChange={(event) => updateParams({ specialty: event.target.value, page: "" })}><option value="">Todas</option>{professionals.options.specialties.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          <label>Estado<select value={status} onChange={(event) => updateParams({ status: event.target.value, page: "" })}><option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label>
          <button type="button" className={styles.clear} onClick={clearFilters} disabled={!hasFilters && !searchInput}><Icon name="clear" size={18} />Limpiar filtros</button>
        </div>
      </section>

      <div className={styles.content}>
        {professionals.isLoading && <SectionState type="loading" message="Cargando profesionales…" />}
        {professionals.error && <SectionState type="error" message="No se pudieron cargar los profesionales. Verificá la conexión e intentá nuevamente." onRetry={professionals.retry} />}
        {!professionals.isLoading && !professionals.error && professionals.data.totalItems === 0 && (
          <div className={styles.empty} role="status"><Icon name={hasFilters ? "search" : "professional"} size={36} /><h2>{hasFilters ? "No encontramos profesionales con la búsqueda o los filtros seleccionados." : "Todavía no hay profesionales registrados."}</h2>{hasFilters && <button type="button" onClick={clearFilters}>Limpiar búsqueda y filtros</button>}</div>
        )}
        {!professionals.isLoading && !professionals.error && professionals.data.totalItems > 0 && <ProfessionalsResults result={professionals.data} onPageChange={(nextPage) => updateParams({ page: nextPage })} />}
      </div>
    </main>
  );
}
