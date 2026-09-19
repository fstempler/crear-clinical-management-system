import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useEvolutionDetail } from "../../hooks/useEvolutionDetail";
import { useEvolutionFiles } from "../../hooks/useEvolutionFiles";
import { fileCategories, fileCategoryLabels, getProtectedFileUrl, inferFileCategory, validateClinicalFile } from "../../services/patientFilesService";
import {
  getAssignedPatient,
  isEvolutionEditable,
} from "../../services/evolutionsService";
import { formatDate, formatDateTime } from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientDocumentType,
  getPatientStatus,
} from "../../utils/presentation";
import styles from "./EvolutionDetailPage.module.scss";

const typeLabels = {
  regular: "Evolución",
  assessment: "Evaluación",
  interconsultation: "Interconsulta",
  other: "Otro",
};

function evolutionLabel(record) {
  return (
    record?.title?.trim() ||
    typeLabels[record?.evolution_type] ||
    "Evolución clínica"
  );
}

function professionalName(profile, user) {
  return (
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Profesional no identificado"
  );
}

function professionalRole(profile) {
  return (
    [profile?.profession, profile?.specialty].filter(Boolean).join(" · ") ||
    "Profesión no informada"
  );
}

function professionalLicense(profile) {
  return (
    profile?.license_number ||
    profile?.registration_number ||
    profile?.matricula ||
    ""
  );
}

function patientHistoryNumber(patient) {
  return (
    patient?.clinical_history_number ||
    patient?.medical_record_number ||
    patient?.history_number ||
    ""
  );
}

function patientTreatment(patient) {
  return (
    patient?.treatment ||
    patient?.treatment_type ||
    patient?.current_treatment ||
    ""
  );
}

function safeHistoryPath(value, patientId) {
  const expectedPath = `/patients/${patientId}/history`;

  if (
    typeof value === "string" &&
    (value === expectedPath || value.startsWith(`${expectedPath}?`))
  ) {
    return value;
  }

  return expectedPath;
}

function ClinicalContent({ content }) {
  const text = content?.trim();

  if (!text) {
    return (
      <p className={styles.emptyContent}>
        El registro clínico no contiene información.
      </p>
    );
  }

  const blocks = text.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className={styles.clinicalContent}>
      {blocks.map((block, index) => {
        const lines = block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);

        const isList =
          lines.length > 1 &&
          lines.every((line) => /^(?:[-•*]|\d+[.)])\s+/.test(line));

        if (isList) {
          const ordered = lines.every((line) => /^\d+[.)]\s+/.test(line));
          const Tag = ordered ? "ol" : "ul";

          return (
            <Tag key={`${index}-${block.slice(0, 12)}`}>
              {lines.map((line) => (
                <li key={line}>{line.replace(/^(?:[-•*]|\d+[.)])\s+/, "")}</li>
              ))}
            </Tag>
          );
        }

        return <p key={`${index}-${block.slice(0, 12)}`}>{block}</p>;
      })}
    </div>
  );
}

function StatePage({ error, retry }) {
  const notFound = error?.status === 404;
  const forbidden = error?.status === 401 || error?.status === 403;

  return (
    <main className={styles.page}>
      <div className={styles.state} role="alert">
        <Icon
          name={forbidden ? "shield" : notFound ? "file" : "retry"}
          size={38}
        />

        <h1>
          {forbidden
            ? "Sin permisos"
            : notFound
              ? "Evolución no encontrada"
              : "No pudimos cargar la evolución"}
        </h1>

        <p>
          {forbidden
            ? "Tu usuario no tiene permiso para consultar este registro."
            : notFound
              ? "El registro no existe o ya no está disponible."
              : "Revisá la conexión con el sistema e intentá nuevamente."}
        </p>

        <div>
          <Link to="/patients">Volver a pacientes</Link>

          {!notFound && !forbidden && (
            <button type="button" onClick={retry}>
              Reintentar
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function NearbyItem({ record, current = false }) {
  const content = (
    <>
      <strong>{evolutionLabel(record)}</strong>

      <small>
        {formatDate(record.evolution_date || record.created)}
        {current ? " · Actual" : ""}
      </small>
    </>
  );

  return current ? (
    <div
      className={`${styles.nearbyItem} ${styles.current}`}
      aria-current="true"
    >
      <Icon name="check" size={20} />
      <span>{content}</span>
    </div>
  ) : (
    <Link className={styles.nearbyItem} to={`/evolutions/${record.id}`}>
      <Icon name="chevron" size={20} />
      <span>{content}</span>
    </Link>
  );
}

export function EvolutionDetailPage() {
  const { evolutionId } = useParams();
  const { user } = useAuth();
  const outletContext = useOutletContext();
  const profileState = outletContext?.profileState;
  const location = useLocation();
  const navigate = useNavigate();

  const [showUpdatedMessage] = useState(
    Boolean(location.state?.evolutionUpdated),
  );
  const [showCreatedMessage] = useState(
    Boolean(location.state?.evolutionCreated),
  );

  const [assignmentState, setAssignmentState] = useState({
    isLoading: user.role === "professional",
    isAssigned: false,
  });

  const detail = useEvolutionDetail(evolutionId);
  const evolutionFiles = useEvolutionFiles(evolutionId);
  const [uploadForm, setUploadForm] = useState({ file: null, category: "", description: "", error: "" });

  useEffect(() => {
    if (
      location.state?.evolutionUpdated ||
      location.state?.evolutionCreated
    ) {
      navigate(location.pathname, {
        replace: true,
        state: location.state?.historyPath
          ? {
              historyPath: location.state.historyPath,
            }
          : null,
      });
    }
  }, [location.pathname, location.state, navigate]);

  const patientId = detail.data.patient?.id || "";
  const professionalId = profileState?.data?.id;

  useEffect(() => {
    if (user.role !== "professional") {
      // Administración nunca crea evoluciones.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssignmentState({
        isLoading: false,
        isAssigned: false,
      });

      return undefined;
    }

    if (detail.isLoading || !patientId || profileState?.isLoading) {
      return undefined;
    }

    if (!professionalId || profileState?.error) {
      
      setAssignmentState({
        isLoading: false,
        isAssigned: false,
      });

      return undefined;
    }

    let active = true;

    setAssignmentState({
      isLoading: true,
      isAssigned: false,
    });

    getAssignedPatient(professionalId, patientId)
      .then((patient) => {
        if (active) {
          setAssignmentState({
            isLoading: false,
            isAssigned: Boolean(patient),
          });
        }
      })
      .catch(() => {
        if (active) {
          setAssignmentState({
            isLoading: false,
            isAssigned: false,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [
    detail.isLoading,
    patientId,
    professionalId,
    profileState?.error,
    profileState?.isLoading,
    user.role,
  ]);

  if (detail.isLoading) {
    return (
      <main className={styles.page}>
        <SectionState type="loading" message="Cargando evolución clínica…" />
      </main>
    );
  }

  if (detail.error) {
    return <StatePage error={detail.error} retry={detail.retry} />;
  }

  const { evolution, patient, authorUser, authorProfile, previous, next } =
    detail.data;

  if (!patient) {
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon name="patients" size={38} />

          <h1>Paciente relacionado no disponible</h1>

          <p>
            La evolución existe, pero no fue posible recuperar el paciente
            asociado.
          </p>

          <div>
            <Link to="/patients">Volver a pacientes</Link>

            <button type="button" onClick={detail.retry}>
              Reintentar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const patientName = getFullName(patient);
  const status = getPatientStatus(patient.status);
  const author = professionalName(authorProfile, authorUser);
  const license = professionalLicense(authorProfile);

  const isAuthor = user.role === "professional" && evolution.author === user.id;

  const canEdit = isEvolutionEditable(evolution, user);

  const canCreate =
    user.active === true &&
    user.role === "professional" &&
    !assignmentState.isLoading &&
    assignmentState.isAssigned;

  const readOnlyMessage =
    user.role === "admin"
      ? "La administración puede consultar este registro en modo de solo lectura."
      : !isAuthor
        ? "Este registro fue creado por otro profesional y está disponible en modo de solo lectura."
        : !canEdit
          ? "El plazo de edición de 72 horas finalizó. Este registro está disponible en modo de solo lectura."
          : "";

  const document = patient.document_number
    ? `${getPatientDocumentType(
        patient.document_type,
      )} ${patient.document_number}`
    : "";

  const historyNumber = patientHistoryNumber(patient);
  const treatment = patientTreatment(patient);

  const historyTarget = safeHistoryPath(
    location.state?.historyPath,
    patient.id,
  );

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <span>
          {user.role === "admin" ? "Portal Administrativo" : "Portal Médico"}
        </span>

        <Icon name="chevron" size={15} />

        <Link to="/patients">Pacientes</Link>

        <Icon name="chevron" size={15} />

        <Link to={`/patients/${patient.id}`}>{patientName}</Link>

        <Icon name="chevron" size={15} />

        <Link to={historyTarget}>Historia clínica</Link>

        <Icon name="chevron" size={15} />

        <strong>{evolutionLabel(evolution)}</strong>
      </nav>

      <Link className={styles.back} to={historyTarget}>
        <Icon name="arrow-left" size={18} />
        Volver a la historia clínica
      </Link>

      <header className={styles.patientCard}>
        <span className={styles.avatar} aria-hidden="true">
          {getInitials(patient.first_name, patient.last_name)}
        </span>

        <Link className={styles.patientIdentity} to={`/patients/${patient.id}`}>
          <h1>{patientName}</h1>

          <div>
            {document && <span>{document}</span>}

            {historyNumber && <span>HC {historyNumber}</span>}

            <span className={`${styles.status} ${styles[status.tone]}`}>
              ● {status.label}
            </span>

            {treatment && <span>{treatment}</span>}
          </div>
        </Link>

        <div className={styles.patientActions}>
          {canEdit && (
            <Link
              className={styles.editEvolution}
              to={`/evolutions/${evolution.id}/edit`}
              state={{ historyPath: historyTarget }}
            >
              <Icon name="edit" size={18} />
              Editar evolución
            </Link>
          )}

          {canCreate && (
            <Link
              className={styles.newEvolution}
              to={`/evolutions/new?patientId=${patient.id}`}
            >
              <Icon name="plus" size={19} />
              Nueva evolución
            </Link>
          )}
        </div>
      </header>

      <nav
        className={styles.tabs}
        aria-label="Contexto del perfil del paciente"
      >
        <Link to={`/patients/${patient.id}`}>Resumen</Link>

        <Link to={`/patients/${patient.id}#datos-personales`}>
          Datos personales
        </Link>

        <Link to={historyTarget} aria-current="page">
          Historia clínica
        </Link>

        <Link to={`/patients/${patient.id}/files`}>Multimedia</Link>

        {user.role === "admin" && (
          <Link to={`/patients/${patient.id}#administracion`}>
            Información administrativa
          </Link>
        )}
      </nav>

      {showUpdatedMessage && (
        <div className={styles.successNotice} role="status" aria-live="polite">
          <Icon name="check" size={21} />

          <span>La evolución clínica se actualizó correctamente.</span>
        </div>
      )}

      {showCreatedMessage && (
        <div className={styles.successNotice} role="status" aria-live="polite">
          <Icon name="check" size={21} />

          <span>
            La evolución clínica fue registrada correctamente. Ya podés
            adjuntar archivos en la sección Archivos adjuntos.
          </span>
        </div>
      )}

      {readOnlyMessage && (
        <div className={styles.notice} role="status">
          <Icon name="shield" size={21} />
          <span>{readOnlyMessage}</span>
        </div>
      )}

      <div className={styles.columns}>
        <div className={styles.primaryColumn}>
          <section className={`${styles.card} ${styles.summaryCard}`}>
            <div>
              <p>
                {typeLabels[evolution.evolution_type] || "Evolución clínica"}
              </p>

              <h2>{evolutionLabel(evolution)}</h2>
            </div>

            <dl>
              <div>
                <dt>ID</dt>
                <dd>{evolution.id}</dd>
              </div>

              <div>
                <dt>Fecha y hora</dt>

                <dd>
                  <Icon name="calendar" size={17} />

                  {formatDateTime(
                    evolution.evolution_date || evolution.created,
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={styles.card}
            aria-labelledby="clinical-record-title"
          >
            <h2 className={styles.cardTitle} id="clinical-record-title">
              <Icon name="file" size={22} />
              Registro clínico
            </h2>

            <div className={styles.recordBody}>
              <ClinicalContent content={evolution.content} />
            </div>
          </section>

          <section
            className={styles.card}
            id="archivos-adjuntos"
            aria-labelledby="attachments-title"
          >
            <h2 className={styles.cardTitle} id="attachments-title"><Icon name="folder" size={22} />Archivos adjuntos <small>{evolutionFiles.files.length}</small></h2>
            {canEdit && <form className={styles.uploadForm} onSubmit={async (event) => {
              event.preventDefault();
              const error = validateClinicalFile(uploadForm.file);
              if (error) { setUploadForm((old) => ({ ...old, error })); return; }
              const ok = await evolutionFiles.upload({ evolution, user, file: uploadForm.file, category: uploadForm.category || inferFileCategory(uploadForm.file.type), description: uploadForm.description });
              if (ok) { event.currentTarget.reset(); setUploadForm({ file: null, category: "", description: "", error: "" }); }
            }}>
              <h3>Adjuntar archivo</h3>
              <label>Archivo<input type="file" required accept="image/jpeg,image/png,image/webp,image/heic,application/pdf,audio/mpeg,audio/wav,audio/mp4,audio/x-m4a,video/mp4,video/quicktime,video/webm" onChange={(event) => { const file = event.target.files?.[0] || null; setUploadForm((old) => ({ ...old, file, category: file ? inferFileCategory(file.type) : "", error: "" })); }} aria-invalid={Boolean(uploadForm.error)} /></label>
              <label>Categoría<select required value={uploadForm.category} onChange={(event) => setUploadForm((old) => ({ ...old, category: event.target.value }))}><option value="">Seleccionar</option>{fileCategories.map((category) => <option value={category} key={category}>{fileCategoryLabels[category]}</option>)}</select></label>
              <label className={styles.descriptionField}>Descripción<textarea value={uploadForm.description} onChange={(event) => setUploadForm((old) => ({ ...old, description: event.target.value }))} /></label>
              {uploadForm.error && <p className={styles.formError} role="alert">{uploadForm.error}</p>}
              <button type="submit" disabled={evolutionFiles.uploading}>{evolutionFiles.uploading ? "Subiendo…" : "Adjuntar archivo"}</button>
            </form>}
            {evolutionFiles.message && <p className={styles.fileMessage} role="status">{evolutionFiles.message}</p>}
            {evolutionFiles.error && <p className={styles.formError} role="alert">No pudimos completar la operación. Conservamos la pantalla para que intentes nuevamente. <button type="button" onClick={evolutionFiles.clearError}>Cerrar</button></p>}
            {evolutionFiles.loading ? <SectionState type="loading" message="Cargando archivos adjuntos…" /> : !evolutionFiles.files.length ? <div className={styles.attachments}><Icon name="folder" size={27} /><p>Sin archivos adjuntos</p></div> : <ul className={styles.fileList}>{evolutionFiles.files.map((record) => { const url = getProtectedFileUrl(record, evolutionFiles.token); const manageable = canEdit && record.uploaded_by === user.id; return <li key={record.id}><Icon name={record.category === "image" ? "image" : "file"} size={23} /><div><strong>{record.file}</strong><small>{fileCategoryLabels[record.category] || "Archivo"} · {formatDateTime(record.created)}</small>{record.description && <p>{record.description}</p>}</div><div>{url && <a href={url} target="_blank" rel="noreferrer">Ver</a>}{manageable && <button type="button" disabled={evolutionFiles.deletingId === record.id} onClick={() => { if (window.confirm(`¿Eliminar el archivo “${record.file}”? Esta acción lo quitará de la historia clínica.`)) evolutionFiles.remove(record); }}>{evolutionFiles.deletingId === record.id ? "Eliminando…" : "Eliminar"}</button>}</div></li>; })}</ul>}
          </section>
        </div>

        <aside
          className={styles.secondaryColumn}
          aria-label="Información complementaria"
        >
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>
              <Icon name="professional" size={22} />
              Profesional responsable
            </h2>

            <div className={styles.professional}>
              <span aria-hidden="true">
                {getInitials(
                  authorProfile?.first_name,
                  authorProfile?.last_name,
                  "PR",
                )}
              </span>

              <div>
                <strong>{author}</strong>

                <p>{professionalRole(authorProfile)}</p>

                {license && <small>Matrícula {license}</small>}
              </div>
            </div>
          </section>

          <section className={`${styles.card} ${styles.nearbyCard}`}>
            <h2 className={styles.cardTitle}>
              <Icon name="activity" size={22} />
              Registros cercanos
            </h2>

            <div>
              {previous && <NearbyItem record={previous} />}

              <NearbyItem record={evolution} current />

              {next && <NearbyItem record={next} />}
            </div>
          </section>
        </aside>
      </div>

      <nav
        className={styles.mobileNearby}
        aria-label="Evoluciones anterior y siguiente"
      >
        {previous ? (
          <Link to={`/evolutions/${previous.id}`}>
            <small>‹ Anterior</small>
            <strong>{evolutionLabel(previous)}</strong>
          </Link>
        ) : (
          <span />
        )}

        {next ? (
          <Link to={`/evolutions/${next.id}`}>
            <small>Siguiente ›</small>
            <strong>{evolutionLabel(next)}</strong>
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <div className={styles.mobileActions}>
        {canEdit && (
          <Link
            className={styles.editEvolution}
            to={`/evolutions/${evolution.id}/edit`}
            state={{ historyPath: historyTarget }}
          >
            <Icon name="edit" size={18} />
            Editar evolución
          </Link>
        )}

        {canCreate && (
          <Link
            className={styles.newEvolution}
            to={`/evolutions/new?patientId=${patient.id}`}
          >
            <Icon name="plus" size={18} />
            Nueva evolución
          </Link>
        )}

        <Link className={styles.mobileBack} to={historyTarget}>
          Volver a la historia clínica
        </Link>
      </div>
    </main>
  );
}
