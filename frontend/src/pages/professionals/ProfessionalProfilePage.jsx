import { Link, useLocation, useParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useProfessionalDetail } from "../../hooks/useProfessionalDetail";
import { useAuth } from "../../hooks/useAuth";
import { formatDate, formatDateTime } from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientStatus,
} from "../../utils/presentation";
import styles from "./ProfessionalProfilePage.module.scss";

const EMPTY_VALUE = "Sin información registrada";

function Value({ children }) {
  return children === null || children === undefined || children === "" ? (
    <span className={styles.muted}>{EMPTY_VALUE}</span>
  ) : children;
}

function Detail({ label, children }) {
  return <div><dt>{label}</dt><dd><Value>{children}</Value></dd></div>;
}

function Card({ title, icon, children, className = "" }) {
  return (
    <section className={`${styles.card} ${className}`}>
      <h2><Icon name={icon} size={23} />{title}</h2>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function AccountStatus({ account }) {
  if (!account) {
    return <span className={`${styles.status} ${styles.unavailable}`}>Cuenta no disponible</span>;
  }
  return <span className={`${styles.status} ${account.active ? styles.active : styles.inactive}`}>{account.active ? "Activo" : "Inactivo"}</span>;
}

function safeReturnPath(value) {
  return typeof value === "string" && value.startsWith("/professionals")
    ? value
    : "/professionals";
}

function roleLabel(role) {
  if (role === "professional") return "Profesional";
  if (role === "admin") return "Administración";
  return EMPTY_VALUE;
}

export function ProfessionalProfilePage() {
  const { professionalId } = useParams();
  const location = useLocation();
  const { isAdmin } = useAuth();
  const detail = useProfessionalDetail(professionalId);
  const returnPath = safeReturnPath(location.state?.returnPath);

  if (detail.isLoading) {
    return <main className={styles.page}><SectionState type="loading" message="Cargando perfil del profesional…" /></main>;
  }

  if (detail.error) {
    const notFound = detail.error?.status === 404;
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon name={notFound ? "professional" : "retry"} size={38} />
          <h1>{notFound ? "Profesional no encontrado" : "No pudimos cargar el profesional"}</h1>
          <p>{notFound ? "El registro no existe o no está disponible." : "Revisá la conexión con PocketBase e intentá nuevamente."}</p>
          <div>
            <Link to={returnPath}>Volver a profesionales</Link>
            {!notFound && <button type="button" onClick={detail.retry}>Reintentar</button>}
          </div>
        </div>
      </main>
    );
  }

  const { professional, account, assignments, assignmentsError } = detail;
  const name = getFullName(professional);
  const professionalEmail = professional.email || account?.email || "";
  const differentAccountEmail = account?.email && account.email !== professional.email
    ? account.email
    : "";

  return (
    <main className={styles.page}>
      {location.state?.professionalUpdated && (
        <div className={styles.success} role="status">
          <Icon name="check" size={20} /> La información del profesional se actualizó correctamente.
        </div>
      )}
      {location.state?.professionalCreated && (
        <div className={styles.success} role="status" aria-live="polite">
          <Icon name="check" size={20} /> {location.state.accountInactive
            ? "El profesional fue creado correctamente. La cuenta permanece inactiva."
            : "El profesional y su cuenta fueron creados correctamente."}
        </div>
      )}
      {location.state?.assignmentsUpdated && (
        <div className={styles.success} role="status" aria-live="polite">
          <Icon name="check" size={20} /> Las asignaciones del profesional se actualizaron correctamente.
        </div>
      )}
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/">Portal Administrativo</Link><Icon name="chevron" size={16} />
        <Link to={returnPath}>Profesionales</Link><Icon name="chevron" size={16} />
        <strong aria-current="page">{name}</strong>
      </nav>

      <div className={styles.topActions}>
        <Link className={styles.back} to={returnPath}><Icon name="arrow-left" size={18} />Volver a profesionales</Link>
        {isAdmin && (
          <div className={styles.adminActions}>
            <Link className={styles.assignmentsButton} to={`/professionals/${professionalId}/assignments`} state={{ returnPath }}>
              <Icon name="patients" size={18} />Gestionar pacientes
            </Link>
            <Link className={styles.editButton} to={`/professionals/${professionalId}/edit`} state={{ returnPath }}>
              <Icon name="edit" size={18} />Editar profesional
            </Link>
          </div>
        )}
      </div>

      <header className={styles.profileHeader}>
        <span className={styles.avatar} aria-hidden="true">{getInitials(professional.first_name, professional.last_name, "PR")}</span>
        <div className={styles.identity}>
          <div className={styles.nameRow}><h1>{name}</h1><AccountStatus account={account} /></div>
          <p>{[professional.profession, professional.specialty].filter(Boolean).join(" · ") || "Profesión no informada"}</p>
          <div className={styles.meta}>
            <span>Matrícula {professional.license_number || "no informada"}</span>
            <span>Documento {professional.document_number || "no informado"}</span>
          </div>
        </div>
      </header>

      <section className={styles.summary} aria-label="Resumen del profesional">
        <article><span>Pacientes asignados</span><strong>{assignmentsError ? "—" : assignments.length}</strong></article>
        <article><span>Estado de la cuenta</span><strong>{account ? (account.active ? "Activa" : "Inactiva") : "No disponible"}</strong></article>
        <article><span>Incorporación</span><strong>{professional.joined_at ? formatDate(professional.joined_at) : "No informada"}</strong></article>
      </section>

      <div className={styles.columns}>
        <div className={styles.primaryColumn}>
          <Card title="Información profesional" icon="professional">
            <dl className={styles.details}>
              <Detail label="Nombre">{professional.first_name}</Detail>
              <Detail label="Apellido">{professional.last_name}</Detail>
              <Detail label="Documento">{professional.document_number}</Detail>
              <Detail label="Profesión">{professional.profession}</Detail>
              <Detail label="Especialidad">{professional.specialty}</Detail>
              <Detail label="Matrícula">{professional.license_number}</Detail>
              <Detail label="Fecha de incorporación">{professional.joined_at ? formatDate(professional.joined_at) : ""}</Detail>
            </dl>
          </Card>

          <Card title={`Pacientes asignados${assignmentsError ? "" : ` (${assignments.length})`}`} icon="patients">
            {assignmentsError ? (
              <div className={styles.localError} role="alert">
                <Icon name="retry" size={25} /><div><strong>No pudimos cargar los pacientes asignados.</strong><p>El resto del perfil continúa disponible.</p></div>
                <button type="button" onClick={detail.retry}>Reintentar</button>
              </div>
            ) : assignments.length === 0 ? (
              <p className={styles.empty}>Este profesional no tiene pacientes asignados actualmente.</p>
            ) : (
              <ul className={styles.patients}>
                {assignments.map(({ assignment, patient }) => {
                  const status = getPatientStatus(patient.status);
                  return (
                    <li key={assignment.id}>
                      <span className={styles.patientAvatar} aria-hidden="true">{getInitials(patient.first_name, patient.last_name, "PA")}</span>
                      <div><Link to={`/patients/${patient.id}`}>{getFullName(patient)}</Link><small>Documento {patient.document_number || "no informado"}</small>{assignment.created && <small>Asignación registrada el {formatDate(assignment.created)}</small>}</div>
                      <span className={`${styles.patientStatus} ${styles[status.tone]}`}>{status.label}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        <aside className={styles.secondaryColumn} aria-label="Información complementaria">
          <Card title="Contacto" icon="phone">
            <dl className={styles.stackedDetails}>
              <Detail label="Email profesional">{professionalEmail ? <a href={`mailto:${professionalEmail}`}>{professionalEmail}</a> : ""}</Detail>
              {differentAccountEmail && <Detail label="Email de la cuenta"><a href={`mailto:${differentAccountEmail}`}>{differentAccountEmail}</a></Detail>}
              <Detail label="Teléfono">{professional.phone ? <a href={`tel:${professional.phone}`}>{professional.phone}</a> : ""}</Detail>
            </dl>
          </Card>

          <Card title="Cuenta de acceso" icon="shield">
            {!account ? <p className={styles.notice}>No se encontró la cuenta de acceso asociada.</p> : (
              <dl className={styles.stackedDetails}>
                <Detail label="Rol">{roleLabel(account.role)}</Detail>
                <Detail label="Estado">{account.active ? "Activa" : "Inactiva"}</Detail>
                <Detail label="Email verificado">{account.verified ? "Sí" : "No"}</Detail>
                <Detail label="Último acceso">{account.last_login_at ? formatDateTime(account.last_login_at) : "Sin ingresos registrados"}</Detail>
                <Detail label="Cuenta creada">{account.created ? formatDateTime(account.created) : ""}</Detail>
              </dl>
            )}
          </Card>

          <Card title="Notas administrativas" icon="file" className={styles.notesCard}>
            <p>{professional.administrative_notes || "No hay notas administrativas registradas."}</p>
          </Card>
        </aside>
      </div>
    </main>
  );
}
