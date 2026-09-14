import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
} from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useEditEvolution } from "../../hooks/useEditEvolution";
import {
  evolutionTypes,
  getEvolutionUpdateErrorMessage,
  isEvolutionEditable,
} from "../../services/evolutionsService";
import { formatDateTime } from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientDocumentType,
} from "../../utils/presentation";
import styles from "./EditEvolutionPage.module.scss";

const typeLabels = {
  regular: "Evolución",
  assessment: "Evaluación",
  interconsultation: "Interconsulta",
  other: "Otro",
};

const emptyForm = {
  evolution_type: "regular",
  title: "",
  content: "",
};

function normalizeForm(value) {
  return {
    evolution_type: value?.evolution_type || "regular",
    title: String(value?.title || "").trim(),
    content: String(value?.content || "").trim(),
  };
}

function professionalName(profile, user) {
  return (
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    user?.email ||
    "Profesional no identificado"
  );
}

function professionalDescription(profile) {
  return (
    [profile?.profession, profile?.specialty].filter(Boolean).join(" · ") ||
    "Profesión no informada"
  );
}

function historyNumber(patient) {
  return (
    patient?.clinical_history_number ||
    patient?.medical_record_number ||
    patient?.history_number ||
    "No informada"
  );
}

function remainingTime(created) {
  const createdAt = new Date(created);

  if (Number.isNaN(createdAt.getTime())) {
    return "No disponible";
  }

  const milliseconds =
    createdAt.getTime() + 72 * 60 * 60 * 1000 - Date.now();

  if (milliseconds <= 0) {
    return "Plazo finalizado";
  }

  const totalMinutes = Math.ceil(milliseconds / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

function getHistoryPath(patientId, candidate) {
  const fallback = `/patients/${patientId}/history`;

  if (typeof candidate !== "string") {
    return fallback;
  }

  return candidate === fallback || candidate.startsWith(`${fallback}?`)
    ? candidate
    : fallback;
}

function StatePage({
  kind,
  retry,
  evolutionId,
  detailState,
}) {
  const states = {
    missing: [
      "Evolución no encontrada",
      "El registro no existe o no está disponible para tu usuario.",
    ],
    error: [
      "No pudimos cargar la evolución",
      "Revisá la conexión con el sistema e intentá nuevamente.",
    ],
    patient: [
      "Paciente relacionado no disponible",
      "La evolución existe, pero no fue posible recuperar el paciente asociado.",
    ],
    author: [
      "Solamente el autor puede editar",
      "Este registro fue creado por otro profesional y está disponible únicamente en modo de lectura.",
    ],
    expired: [
      "El plazo de edición finalizó",
      "El plazo de edición de 72 horas finalizó. Esta evolución está disponible únicamente en modo de lectura.",
    ],
  };

  const [title, message] = states[kind];

  return (
    <main className={styles.page}>
      <section className={styles.state} role="alert">
        <Icon
          name={
            kind === "error"
              ? "retry"
              : kind === "patient"
                ? "patients"
                : "shield"
          }
          size={38}
        />

        <h1>{title}</h1>
        <p>{message}</p>

        <div>
          {evolutionId ? (
            <Link
              to={`/evolutions/${evolutionId}`}
              state={detailState}
            >
              Volver al detalle
            </Link>
          ) : (
            <Link to="/patients">Volver a pacientes</Link>
          )}

          {retry && (
            <button type="button" onClick={retry}>
              Reintentar
            </button>
          )}
        </div>
      </section>
    </main>
  );
}

export function EditEvolutionPage() {
  const { evolutionId = "" } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const detail = useEditEvolution(evolutionId);

  const [form, setForm] = useState(emptyForm);
  const [initialForm, setInitialForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [didSave, setDidSave] = useState(false);

  const typeRef = useRef(null);
  const contentRef = useRef(null);

  const evolution = detail.data.evolution;
  const patient = detail.data.patient;

  const historyPath = patient
    ? getHistoryPath(patient.id, location.state?.historyPath)
    : null;

  const detailState = historyPath
    ? { historyPath }
    : undefined;

  useEffect(() => {
    if (!evolution || initialForm) {
      return;
    }

    const values = normalizeForm(evolution);

    // The form must be initialized when the asynchronous record becomes available.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(values);
    setInitialForm(values);
  }, [evolution, initialForm]);

  const hasChanges = useMemo(
    () =>
      Boolean(
        initialForm &&
          JSON.stringify(normalizeForm(form)) !==
            JSON.stringify(initialForm),
      ),
    [form, initialForm],
  );

  const shouldBlock =
    hasChanges &&
    !detail.isSaving &&
    !didSave;

  useEffect(() => {
    const warn = (event) => {
      if (!shouldBlock) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);

    return () => {
      window.removeEventListener("beforeunload", warn);
    };
  }, [shouldBlock]);

  const confirmLeave = (event) => {
    if (!shouldBlock) {
      return;
    }

    if (
      !window.confirm(
        "Hay cambios sin guardar. ¿Querés salir de esta página?",
      )
    ) {
      event.preventDefault();
    }
  };

  const update = (field) => (event) => {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitError("");
  };

  const submit = async (event) => {
    event.preventDefault();

    if (detail.isSaving || !hasChanges) {
      return;
    }

    const nextErrors = {};

    if (!evolutionTypes.includes(form.evolution_type)) {
      nextErrors.evolution_type =
        "Seleccioná un tipo de evolución válido.";
    }

    if (!form.content.trim()) {
      nextErrors.content = "Ingresá el registro clínico.";
    }

    setErrors(nextErrors);

    if (nextErrors.evolution_type) {
      typeRef.current?.focus();
    } else if (nextErrors.content) {
      contentRef.current?.focus();
    }

    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitError("");

    try {
      await detail.save(normalizeForm(form));
      setDidSave(true);

      navigate(`/evolutions/${evolutionId}`, {
        replace: true,
        state: {
          evolutionUpdated: true,
          historyPath,
        },
      });
    } catch (error) {
      setSubmitError(getEvolutionUpdateErrorMessage(error));
    }
  };

  if (!evolutionId) {
    return <StatePage kind="missing" />;
  }

  if (detail.isLoading) {
    return (
      <main className={styles.page}>
        <SectionState
          type="loading"
          message="Cargando evolución clínica…"
        />
      </main>
    );
  }

  if (detail.error) {
    const isMissing = detail.error?.status === 404;

    return (
      <StatePage
        kind={isMissing ? "missing" : "error"}
        retry={isMissing ? null : detail.retry}
        evolutionId={isMissing ? null : evolutionId}
        detailState={detailState}
      />
    );
  }

  const {
    authorUser,
    authorProfile,
  } = detail.data;

  if (!patient) {
    return (
      <StatePage
        kind="patient"
        retry={detail.retry}
        evolutionId={evolutionId}
        detailState={detailState}
      />
    );
  }

  const isAuthor =
    Boolean(evolution.author) &&
    evolution.author === user.id;

  if (!isAuthor) {
    return (
      <StatePage
        kind="author"
        evolutionId={evolutionId}
        detailState={detailState}
      />
    );
  }

  if (!isEvolutionEditable(evolution, user)) {
    return (
      <StatePage
        kind="expired"
        evolutionId={evolutionId}
        detailState={detailState}
      />
    );
  }

  const patientName = getFullName(patient);
  const document = patient.document_number
    ? `${getPatientDocumentType(patient.document_type)} ${patient.document_number}`
    : "Documento no informado";

  return (
    <main className={styles.page}>
      <nav
        className={styles.breadcrumb}
        aria-label="Migas de pan"
      >
        <span>Portal Médico</span>
        <Icon name="chevron" size={15} />

        <Link to="/patients">Pacientes</Link>
        <Icon name="chevron" size={15} />

        <Link to={`/patients/${patient.id}`}>
          {patientName}
        </Link>
        <Icon name="chevron" size={15} />

        <Link to={historyPath}>Historia clínica</Link>
        <Icon name="chevron" size={15} />

        <Link
          to={`/evolutions/${evolutionId}`}
          state={detailState}
        >
          Detalle
        </Link>
        <Icon name="chevron" size={15} />

        <strong>Editar evolución</strong>
      </nav>

      <Link
        className={styles.back}
        to={`/evolutions/${evolutionId}`}
        state={detailState}
        onClick={confirmLeave}
      >
        <Icon name="arrow-left" size={18} />
        Volver al detalle de la evolución
      </Link>

      <header className={styles.patientCard}>
        <span
          className={styles.avatar}
          aria-hidden="true"
        >
          {getInitials(
            patient.first_name,
            patient.last_name,
          )}
        </span>

        <div>
          <h1>{patientName}</h1>

          <p>
            <span>{document}</span>
            <span>HC {historyNumber(patient)}</span>
          </p>
        </div>
      </header>

      <header className={styles.heading}>
        <Icon name="edit" size={31} />

        <div>
          <h1>Editar evolución clínica</h1>
          <p>
            Modificá únicamente la información clínica que
            necesite ser actualizada.
          </p>
        </div>
      </header>

      <aside className={styles.notice} role="status">
        <Icon name="shield" size={22} />

        <p>
          <strong>
            Edición disponible durante 72 horas
          </strong>
          Podés modificar esta evolución durante las primeras
          72 horas desde su creación. Los cambios actualizarán
          el registro existente.
        </p>
      </aside>

      <form onSubmit={submit} noValidate>
        {submitError && (
          <div
            className={styles.formError}
            role="alert"
          >
            {submitError}
          </div>
        )}

        <section
          className={styles.card}
          aria-labelledby="original-title"
        >
          <h2 id="original-title">
            <Icon name="file" size={22} />
            Información original
          </h2>

          <dl className={styles.infoGrid}>
            <div>
              <dt>ID de evolución</dt>
              <dd>{evolution.id}</dd>
            </div>

            <div>
              <dt>Fecha original</dt>
              <dd>
                {formatDateTime(
                  evolution.evolution_date ||
                    evolution.created,
                )}
              </dd>
            </div>

            <div>
              <dt>Profesional</dt>
              <dd>
                {professionalName(
                  authorProfile,
                  authorUser,
                )}
              </dd>
            </div>

            <div>
              <dt>Profesión / especialidad</dt>
              <dd>
                {professionalDescription(authorProfile)}
              </dd>
            </div>

            <div>
              <dt>Tiempo disponible</dt>
              <dd>{remainingTime(evolution.created)}</dd>
            </div>
          </dl>

          {!authorUser && !authorProfile && (
            <p
              className={styles.inlineWarning}
              role="status"
            >
              Los datos de presentación del autor no están
              disponibles. La autoría del registro fue
              validada con tu usuario.
            </p>
          )}
        </section>

        <section
          className={styles.card}
          aria-labelledby="record-title"
        >
          <h2 id="record-title">
            <Icon name="edit" size={22} />
            Información del registro
          </h2>

          <div className={styles.cardBody}>
            <div className={styles.twoColumns}>
              <div className={styles.field}>
                <label htmlFor="evolution-type">
                  Tipo de evolución <span>*</span>
                </label>

                <select
                  id="evolution-type"
                  ref={typeRef}
                  value={form.evolution_type}
                  onChange={update("evolution_type")}
                  aria-invalid={Boolean(
                    errors.evolution_type,
                  )}
                  aria-describedby={
                    errors.evolution_type
                      ? "type-error"
                      : undefined
                  }
                >
                  {Object.entries(typeLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>

                {errors.evolution_type && (
                  <span
                    className={styles.fieldError}
                    id="type-error"
                  >
                    {errors.evolution_type}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="title">
                  Título <small>(opcional)</small>
                </label>

                <input
                  id="title"
                  value={form.title}
                  onChange={update("title")}
                  maxLength={255}
                  placeholder="Ej.: Sesión de seguimiento"
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="content">
                Registro clínico <span>*</span>
              </label>

              <p
                className={styles.hint}
                id="content-hint"
              >
                Conservá en este único campo las
                observaciones, intervención, respuesta y plan
                de seguimiento.
              </p>

              <textarea
                id="content"
                ref={contentRef}
                value={form.content}
                onChange={update("content")}
                rows={14}
                aria-invalid={Boolean(errors.content)}
                aria-describedby={`content-hint${
                  errors.content
                    ? " content-error"
                    : ""
                }`}
              />

              {errors.content && (
                <span
                  className={styles.fieldError}
                  id="content-error"
                >
                  {errors.content}
                </span>
              )}
            </div>
          </div>
        </section>

        {!hasChanges && (
          <p
            className={styles.noChanges}
            role="status"
          >
            No hay cambios para guardar.
          </p>
        )}

        <div className={styles.actions}>
          <Link
            className={styles.cancel}
            to={`/evolutions/${evolutionId}`}
            state={detailState}
            onClick={confirmLeave}
          >
            <Icon name="close" size={18} />
            Cancelar
          </Link>

          <button
            className={styles.submit}
            type="submit"
            disabled={detail.isSaving || !hasChanges}
          >
            <Icon name="check" size={19} />
            {detail.isSaving
              ? "Guardando…"
              : "Guardar cambios"}
          </button>
        </div>
      </form>
    </main>
  );
}