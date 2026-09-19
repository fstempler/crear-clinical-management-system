import { useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { usePatientFiles } from "../../hooks/usePatientFiles";
import { fileCategories, fileCategoryLabels, getProtectedFileUrl } from "../../services/patientFilesService";
import { formatDateTime } from "../../utils/date";
import { getFullName, getInitials, getPatientDocumentType, getPatientStatus } from "../../utils/presentation";
import styles from "./PatientFilesPage.module.scss";

function evolutionName(record) { return record?.title?.trim() || "Evolución clínica"; }
function authorName(record) {
  const user = record.expand?.uploaded_by;
  return user?.name || user?.email || "Autor no disponible";
}
function extension(name) { const value = name?.split(".").pop(); return value && value !== name ? value.toUpperCase() : "ARCHIVO"; }
function canPreview(record) { return record.category === "image" && !/\.heic$/i.test(record.file || ""); }

function FileCard({ record, token }) {
  const url = getProtectedFileUrl(record, token);
  const thumb = canPreview(record) ? getProtectedFileUrl(record, token, { thumb: "300x300" }) : "";
  const icon = record.category === "image" ? "image" : record.category === "video" ? "video" : record.category === "audio" ? "audio" : "file";
  return <article className={styles.fileCard}>
    <div className={styles.preview}>{thumb ? <img src={thumb} alt={`Vista previa de ${record.file}`} loading="lazy" /> : <Icon name={icon} size={38} />}</div>
    <div className={styles.fileBody}>
      <div><span className={styles.category}>{fileCategoryLabels[record.category] || "Archivo"}</span><time dateTime={record.created}>{formatDateTime(record.created)}</time></div>
      <h2>{record.file || "Archivo clínico"}</h2>
      <p className={styles.meta}>{extension(record.file)} · Tamaño no disponible</p>
      {record.description && <p className={styles.description}>{record.description}</p>}
      <dl><div><dt>Autor</dt><dd>{authorName(record)}</dd></div><div><dt>Evolución</dt><dd>{record.expand?.evolution ? evolutionName(record.expand.evolution) : "Sin evolución asociada"}</dd></div></dl>
    </div>
    <div className={styles.actions}>
      {url ? <a href={url} target="_blank" rel="noreferrer"><Icon name="eye" size={18} />{record.category === "document" ? "Ver documento" : "Ver archivo"}</a> : <span>Acceso protegido no disponible</span>}
      {record.evolution && <Link to={`/evolutions/${record.evolution}`}><Icon name="activity" size={18} />{record.uploaded_by ? "Administrar desde la evolución" : "Ver evolución"}</Link>}
    </div>
  </article>;
}

export function PatientFilesPage() {
  const { patientId = "" } = useParams(); const { user } = useAuth(); const outlet = useOutletContext();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const professionalId = outlet?.profileState?.data?.id;
  const enabled = user.role !== "professional" || (!outlet?.profileState?.isLoading && Boolean(professionalId));
  const files = usePatientFiles({ patientId, user, professionalId, enabled });
  const invalidDates = files.filters.dateFrom && files.filters.dateTo && files.filters.dateFrom > files.filters.dateTo;
  const patientName = getFullName(files.patient);
  const status = getPatientStatus(files.patient?.status);
  const document = files.patient?.document_number ? `${getPatientDocumentType(files.patient.document_type)} ${files.patient.document_number}` : "Documento no informado";
  const emptyText = useMemo(() => files.hasFilters ? "No encontramos archivos que coincidan con los filtros seleccionados." : "Este paciente todavía no tiene archivos clínicos disponibles.", [files.hasFilters]);

  if (!enabled || files.loading) return <main className={styles.page}><SectionState type="loading" message={!enabled ? "Verificando acceso…" : "Cargando archivos clínicos…"} /></main>;
  if (files.error || !files.patient) return <main className={styles.page}><section className={styles.state} role="alert"><Icon name="shield" size={40} /><h1>No pudimos acceder a los archivos de este paciente</h1><p>El registro no está disponible o tu usuario no tiene permiso para consultarlo.</p><Link to="/patients">Volver a pacientes</Link>{![401,403,404].includes(files.error?.status) && <button type="button" onClick={files.retry}>Reintentar</button>}</section></main>;
  return <main className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Migas de pan"><span>{user.role === "admin" ? "Portal Administrativo" : "Portal Médico"}</span><Icon name="chevron" size={15} /><Link to="/patients">Pacientes</Link><Icon name="chevron" size={15} /><Link to={`/patients/${patientId}`}>{patientName}</Link><Icon name="chevron" size={15} /><strong>Multimedia</strong></nav>
    <Link className={styles.back} to={`/patients/${patientId}`}><Icon name="arrow-left" size={18} />Volver al resumen</Link>
    <header className={styles.patientCard}><span className={styles.avatar}>{getInitials(files.patient.first_name, files.patient.last_name)}</span><div><h1>{patientName}</h1><p>{document} <span className={`${styles.status} ${styles[status.tone]}`}>● {status.label}</span></p></div></header>
    <nav className={styles.tabs} aria-label="Secciones del perfil del paciente"><Link to={`/patients/${patientId}`}>Resumen</Link><Link to={`/patients/${patientId}#datos-personales`}>Datos personales</Link><Link to={`/patients/${patientId}/history`}>Historia clínica</Link><Link className={styles.activeTab} to={`/patients/${patientId}/files`} aria-current="page">Multimedia</Link>{user.role === "admin" && <Link to={`/patients/${patientId}#administracion`}>Información administrativa</Link>}</nav>
    <section className={styles.heading}><div><h1>Multimedia</h1><span>{files.page.totalItems} {files.page.totalItems === 1 ? "archivo" : "archivos"}</span></div><p><Icon name="shield" size={18} />Todos los archivos cuentan con trazabilidad de carga y autoría.</p></section>
    <aside className={styles.notice}><p>Para agregar archivos a la historia clínica de {patientName}, hacelo como parte de una evolución clínica.</p><Link to={`/patients/${patientId}/history`}><Icon name="plus" size={18} />Agregar archivos desde una evolución</Link></aside>
    <section className={styles.controls} aria-label="Buscar y filtrar archivos"><label className={styles.search}><Icon name="search" size={20} /><span className={styles.srOnly}>Buscar archivos</span><input value={files.searchInput} onChange={(event) => files.setSearchInput(event.target.value)} placeholder="Buscar por nombre o descripción…" /></label><button className={styles.filterToggle} type="button" aria-expanded={filtersOpen} aria-controls="file-filters" onClick={() => setFiltersOpen((value) => !value)}><Icon name="filter" size={19} />Filtrar archivos</button><div id="file-filters" className={`${styles.filters} ${filtersOpen ? styles.open : ""}`}>
      <label>Categoría<select value={files.filters.category} onChange={(e) => files.setFilter("category", e.target.value)}><option value="">Todos</option>{fileCategories.map((category) => <option value={category} key={category}>{fileCategoryLabels[category]}</option>)}</select></label>
      <label>Evolución<select value={files.filters.evolutionId} onChange={(e) => files.setFilter("evolutionId", e.target.value)}><option value="">Todas</option>{files.evolutions.map((evolution) => <option value={evolution.id} key={evolution.id}>{evolutionName(evolution)}</option>)}</select></label>
      <label>Desde<input type="date" value={files.filters.dateFrom} onChange={(e) => files.setFilter("dateFrom", e.target.value)} aria-invalid={Boolean(invalidDates)} /></label><label>Hasta<input type="date" value={files.filters.dateTo} onChange={(e) => files.setFilter("dateTo", e.target.value)} aria-invalid={Boolean(invalidDates)} /></label>
      <button type="button" onClick={files.clearFilters}>Limpiar filtros</button>
    </div></section>
    {invalidDates ? <section className={styles.state} role="alert"><h2>Período inválido</h2><p>La fecha desde no puede ser posterior a la fecha hasta.</p></section> : files.tokenError ? <section className={styles.tokenError} role="alert"><p>No pudimos obtener acceso protegido a los archivos.</p><button type="button" onClick={files.retry}>Reintentar</button></section> : !files.page.items.length ? <section className={styles.state} role="status"><Icon name="folder" size={38} /><h2>{files.hasFilters ? "Sin resultados" : "Sin archivos"}</h2><p>{emptyText}</p>{files.hasFilters && <button type="button" onClick={files.clearFilters}>Limpiar filtros</button>}</section> : <><div className={styles.grid}>{files.page.items.map((record) => <FileCard key={record.id} record={record} token={files.token} />)}</div>{files.page.page < files.page.totalPages && <div className={styles.more}><button type="button" onClick={files.loadMore} disabled={files.loadingMore}>{files.loadingMore ? "Cargando archivos…" : "Cargar más"}</button></div>}</>}
  </main>;
}
