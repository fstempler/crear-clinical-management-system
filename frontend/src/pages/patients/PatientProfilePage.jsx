import {
  Link,
  useLocation,
  useParams,
} from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { usePatientProfile } from "../../hooks/usePatientProfile";
import { getPatientFileUrl } from "../../services/patientsService";
import {
  calculateAge,
  formatDate,
  formatDateTime,
} from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientDocumentType,
  getPatientStatus,
} from "../../utils/presentation";
import styles from "./PatientProfilePage.module.scss";

const genderLabels = {
  female: "Femenino",
  male: "Masculino",
  other: "Otro",
  unspecified: "Sin especificar",
  not_specified: "Sin especificar",
};

function Value({ children }) {
  return (
    children || (
      <span className={styles.muted}>
        Sin información registrada
      </span>
    )
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <Value>{children}</Value>
      </dd>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
  className = "",
}) {
  return (
    <section className={`${styles.card} ${className}`}>
      <h2>
        <Icon name={icon} size={23} />
        {title}
      </h2>

      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function Empty({ children }) {
  return <p className={styles.empty}>{children}</p>;
}

function professionalRecord(assignment) {
  return assignment.expand?.professional;
}

function professionalName(professional) {
  return (
    [professional?.first_name, professional?.last_name]
      .filter(Boolean)
      .join(" ") || "Profesional"
  );
}

function evolutionText(item) {
  return (
    item.summary ||
    item.evolution ||
    item.content ||
    item.notes ||
    "Sin contenido registrado."
  );
}

function authorName(item, assignments) {
  const author = item.expand?.author;

  const professional = assignments
    .map(professionalRecord)
    .find(
      (record) =>
        record?.staff_user === item.author ||
        record?.expand?.staff_user?.id === item.author,
    );

  const name = [
    professional?.first_name,
    professional?.last_name,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    name ||
    author?.email ||
    author?.name ||
    "Profesional no identificado"
  );
}

function fileMeta(record) {
  if (record.file) return record.file;

  return (
    record.name ||
    record.title ||
    "Archivo adjunto"
  );
}

function isImage(record) {
  return (
    record.file &&
    /\.(avif|gif|jpe?g|png|webp)$/i.test(record.file)
  );
}

function safePlainText(value) {
  if (!value) return "";

  const element = document.createElement("div");
  element.innerHTML = value;

  return element.textContent || "";
}

export function PatientProfilePage() {
  const { patientId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const profile = usePatientProfile(patientId);
  const isAdmin = user.role === "admin";

  if (profile.isLoading) {
    return (
      <main className={styles.page}>
        <SectionState
          type="loading"
          message="Cargando perfil del paciente…"
        />
      </main>
    );
  }

  if (profile.error) {
    const notFound = profile.error?.status === 404;

    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon
            name={notFound ? "patients" : "retry"}
            size={38}
          />

          <h1>
            {notFound
              ? "Paciente no encontrado"
              : "No pudimos cargar el paciente"}
          </h1>

          <p>
            {notFound
              ? "El registro no existe o no tenés permiso para consultarlo."
              : "Revisá la conexión con PocketBase e intentá nuevamente."}
          </p>

          <div>
            <Link to="/patients">
              Volver a pacientes
            </Link>

            {!notFound && (
              <button
                type="button"
                onClick={profile.retry}
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const {
    patient,
    professionals,
    evolutions,
    files,
  } = profile.data;

  const name = getFullName(patient);
  const age = calculateAge(patient.birth_date);
  const status = getPatientStatus(patient.status);

  const document = patient.document_number
    ? `${getPatientDocumentType(
        patient.document_type,
      )} ${patient.document_number}`
    : "Documento no informado";

  const address = [patient.address, patient.city]
    .filter(Boolean)
    .join(", ");

  const currentProfessionalAssignment =
    user.role === "professional"
      ? professionals.find((assignment) => {
          const professional =
            professionalRecord(assignment);

          return (
            professional?.staff_user === user.id ||
            professional?.expand?.staff_user?.id ===
              user.id
          );
        })
      : null;

  const canCreateEvolution = Boolean(
    user.active === true &&
      user.role === "professional" &&
      currentProfessionalAssignment,
  );

  return (
    <main className={styles.page}>
      {location.state?.evolutionCreated && (
        <div
          className={styles.successMessage}
          role="status"
          aria-live="polite"
        >
          <Icon name="check" size={21} />
          La evolución clínica fue registrada
          correctamente.
        </div>
      )}

      <nav
        className={styles.breadcrumb}
        aria-label="Migas de pan"
      >
        <span>
          {isAdmin
            ? "Portal Administrativo"
            : "Portal Médico"}
        </span>

        <Icon name="chevron" size={16} />

        <Link to="/patients">Pacientes</Link>

        <Icon name="chevron" size={16} />

        <strong>{name}</strong>
      </nav>

      <Link className={styles.back} to="/patients">
        <Icon name="arrow-left" size={18} />
        Volver a pacientes
      </Link>

      <header className={styles.patientHeader}>
        <span
          className={styles.avatar}
          aria-hidden="true"
        >
          {getInitials(
            patient.first_name,
            patient.last_name,
          )}
        </span>

        <div className={styles.identity}>
          <div className={styles.nameRow}>
            <h1>{name}</h1>

            <span
              className={`${styles.status} ${
                styles[status.tone]
              }`}
            >
              ● {status.label}
            </span>
          </div>

          <div className={styles.meta}>
            <span>{document}</span>

            <span>
              {age === null
                ? "Edad no informada"
                : `${age} años`}
            </span>

            {patient.admission_date && (
              <span>
                Admisión{" "}
                {formatDate(patient.admission_date)}
              </span>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Link
            className={styles.secondaryButton}
            to={`/patients/${patient.id}/history`}
          >
            Ver historia clínica
          </Link>

          {isAdmin ? (
            <span
              className={styles.disabledButton}
              aria-disabled="true"
              title="Edición disponible en una próxima etapa"
            >
              <Icon name="edit" size={18} />
              Editar datos
            </span>
          ) : (
            canCreateEvolution && (
              <Link
                className={styles.primaryButton}
                to={`/evolutions/new?patientId=${patient.id}`}
              >
                <Icon name="plus" size={18} />
                Nueva evolución
              </Link>
            )
          )}
        </div>
      </header>

      <nav
        className={styles.tabs}
        aria-label="Secciones del perfil"
      >
        <a href="#resumen" aria-current="page">
          Resumen
        </a>

        <a href="#datos-personales">
          Datos personales
        </a>

        <Link to={`/patients/${patient.id}/history`}>
          Historia clínica
        </Link>

        <a href="#archivos">Multimedia</a>

        {isAdmin && (
          <a href="#administracion">
            Información administrativa
          </a>
        )}
      </nav>

      <div className={styles.columns} id="resumen">
        <div className={styles.primaryColumn}>
          <Card
            title="Información general"
            icon="patients"
            className={styles.generalCard}
          >
            <dl
              className={styles.details}
              id="datos-personales"
            >
              <Detail label="Fecha de nacimiento">
                {formatDate(patient.birth_date)}
              </Detail>

              <Detail label="Género">
                {genderLabels[patient.gender] ||
                  patient.gender}
              </Detail>

              <Detail label="Fecha de admisión">
                {formatDate(patient.admission_date)}
              </Detail>

              <Detail label="Estado">
                {status.label}
              </Detail>

              <Detail label="Dirección">
                {address}
              </Detail>
            </dl>
          </Card>

          <Card
            title="Evoluciones recientes"
            icon="activity"
            className={styles.evolutionsCard}
          >
            {!evolutions.length ? (
              <Empty>
                Este paciente todavía no tiene
                evoluciones registradas.
              </Empty>
            ) : (
              <div
                className={styles.evolutionList}
                id="evoluciones"
              >
                {evolutions.map((item) => (
                  <Link
                    to={`/evolutions/${item.id}`}
                    state={{
                      historyPath: `/patients/${patient.id}/history`,
                    }}
                    className={styles.evolution}
                    key={item.id}
                  >
                    <div>
                      <strong>
                        {authorName(
                          item,
                          professionals,
                        )}
                      </strong>

                      <time>
                        {formatDateTime(
                          item.evolution_date ||
                            item.created,
                        )}
                      </time>
                    </div>

                    <p>{evolutionText(item)}</p>

                    <span>
                      Ver detalle
                      <Icon
                        name="chevron"
                        size={17}
                      />
                    </span>
                  </Link>
                ))}
              </div>
            )}

            {evolutions.length > 0 && (
              <Link
                className={styles.historyLink}
                to={`/patients/${patient.id}/history`}
              >
                Ver historia clínica completa
                <Icon name="chevron" size={18} />
              </Link>
            )}
          </Card>

          {isAdmin && (
            <Card
              title="Información administrativa"
              icon="shield"
              className={styles.adminCard}
            >
              <p id="administracion">
                <Value>
                  {safePlainText(
                    patient.administrative_notes,
                  )}
                </Value>
              </p>
            </Card>
          )}
        </div>

        <aside
          className={styles.secondaryColumn}
          aria-label="Información complementaria"
        >
          <Card title="Contacto" icon="phone">
            <dl className={styles.stackedDetails}>
              <Detail label="Teléfono">
                {patient.phone}
              </Detail>

              <Detail label="Email">
                {patient.email}
              </Detail>

              <Detail label="Contacto de emergencia">
                {patient.emergency_contact_name}
              </Detail>

              <Detail label="Vínculo">
                {
                  patient.emergency_contact_relationship
                }
              </Detail>

              <Detail label="Teléfono de emergencia">
                {patient.emergency_contact_phone}
              </Detail>
            </dl>
          </Card>

          <Card
            title="Cobertura médica"
            icon="shield"
          >
            <dl className={styles.stackedDetails}>
              <Detail label="Obra social / Prepaga">
                {patient.health_insurance}
              </Detail>

              <Detail label="N.º de afiliado">
                {patient.affiliate_number}
              </Detail>
            </dl>
          </Card>

          <Card
            title="Equipo profesional"
            icon="professional"
          >
            {!professionals.length ? (
              <Empty>
                No hay profesionales activos asignados.
              </Empty>
            ) : (
              <ul className={styles.team}>
                {professionals.map((assignment) => {
                  const professional =
                    professionalRecord(assignment);

                  return (
                    <li key={assignment.id}>
                      <span aria-hidden="true">
                        {getInitials(
                          professional?.first_name,
                          professional?.last_name,
                          "PR",
                        )}
                      </span>

                      <div>
                        <strong>
                          {professionalName(
                            professional,
                          )}
                        </strong>

                        <small>
                          {[
                            professional?.profession,
                            professional?.specialty,
                          ]
                            .filter(Boolean)
                            .join(" · ") ||
                            "Profesional"}
                        </small>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title="Archivos recientes"
            icon="folder"
          >
            {!files.length ? (
              <Empty>
                No hay archivos disponibles.
              </Empty>
            ) : (
              <div
                className={styles.files}
                id="archivos"
              >
                {files.map((record) => {
                  const url = getPatientFileUrl(
                    record,
                    isImage(record)
                      ? { thumb: "300x180" }
                      : undefined,
                  );

                  const content = (
                    <>
                      {isImage(record) ? (
                        <img
                          src={url}
                          alt={`Vista previa de ${fileMeta(
                            record,
                          )}`}
                        />
                      ) : (
                        <Icon
                          name="file"
                          size={25}
                        />
                      )}

                      <div>
                        <strong>
                          {fileMeta(record)}
                        </strong>

                        <small>
                          {formatDate(record.created)}
                        </small>
                      </div>
                    </>
                  );

                  return url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.file}
                      key={record.id}
                    >
                      {content}
                    </a>
                  ) : (
                    <div
                      className={styles.file}
                      key={record.id}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}