import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useNewEvolution } from "../../hooks/useNewEvolution";
import { useProfessionalProfile } from "../../hooks/useProfessionalProfile";
import { getEvolutionErrorMessage } from "../../services/evolutionsService";
import { formatDateTime } from "../../utils/date";
import { getFullName, getInitials, getPatientDocumentType } from "../../utils/presentation";
import styles from "./NewEvolutionPage.module.scss";

const evolutionTypes = [
  ["regular", "Evolución"], ["assessment", "Evaluación"],
  ["interconsultation", "Interconsulta"], ["other", "Otro"],
];

function professionalName(profile, user) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || user?.email || "Profesional";
}

function professionalDescription(profile) {
  return [profile?.profession, profile?.specialty].filter(Boolean).join(" · ") || "Profesión no informada";
}

function PatientCard({ patient }) {
  const document = patient.document_number
    ? `${getPatientDocumentType(patient.document_type)} ${patient.document_number}`
    : "Documento no informado";
  return (
    <div className={styles.patientCard}>
      <span className={styles.avatar} aria-hidden="true">{getInitials(patient.first_name, patient.last_name)}</span>
      <div><strong>{getFullName(patient)}</strong><span>{document}</span></div>
      <span className={styles.locked}><Icon name="shield" size={17} />Paciente seleccionado</span>
    </div>
  );
}

export function NewEvolutionPage() {
  const { user } = useAuth();
  const profileState = useProfessionalProfile(user);
  const [searchParams] = useSearchParams();
  const requestedPatientId = (
    searchParams.get("patientId") || searchParams.get("patient") || ""
  ).trim();
  const navigate = useNavigate();
  const patientRef = useRef(null);
  const typeRef = useRef(null);
  const contentRef = useRef(null);
  const [form, setForm] = useState({ patient: "", type: "regular", title: "", content: "" });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const data = useNewEvolution({ professionalId: profileState.data?.id, requestedPatientId });

  const hasUnsavedChanges = Boolean(form.title.trim() || form.content.trim());
  useEffect(() => {
    const warn = (event) => {
      if (!hasUnsavedChanges || isSaving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges, isSaving]);

  const effectivePatientId = data.lockedPatient?.id || form.patient;
  const selectedPatient = useMemo(
    () => data.patients.find((patient) => patient.id === effectivePatientId) || null,
    [data.patients, effectivePatientId],
  );
  const cancelTarget = effectivePatientId ? `/patients/${effectivePatientId}` : "/patients";

  const leave = (event) => {
    event.preventDefault();
    if (hasUnsavedChanges && !window.confirm("Hay contenido sin guardar. ¿Querés salir de esta página?")) return;
    navigate(cancelTarget);
  };

  const update = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    if (isSaving) return;
    const nextErrors = {};
    if (!effectivePatientId) nextErrors.patient = "Seleccioná un paciente.";
    if (!form.type) nextErrors.type = "Seleccioná un tipo de evolución.";
    if (!form.content.trim()) nextErrors.content = "Ingresá el registro clínico.";
    setErrors(nextErrors);
    const firstInvalid = [["patient", patientRef], ["type", typeRef], ["content", contentRef]]
      .find(([field]) => nextErrors[field]);
    if (firstInvalid) {
      firstInvalid[1].current?.focus();
      return;
    }
    setIsSaving(true);
    setSubmitError("");
    try {
      await data.createEvolution({
        patient: effectivePatientId,
        author: user.id,
        evolution_type: form.type,
        title: form.title.trim(),
        content: form.content.trim(),
      });
      navigate(`/patients/${effectivePatientId}`, { replace: true, state: { evolutionCreated: true } });
    } catch (error) {
      setSubmitError(getEvolutionErrorMessage(error));
      setIsSaving(false);
    }
  };

  if (profileState.isLoading) return <main className={styles.page}><SectionState type="loading" message="Cargando perfil profesional…" /></main>;
  if (profileState.error || !profileState.data) {
    return <main className={styles.page}><div className={styles.state} role="alert"><h1>No pudimos cargar tu perfil profesional</h1><p>Revisá la conexión e intentá nuevamente.</p><button type="button" onClick={profileState.retry}>Reintentar</button></div></main>;
  }
  if (data.isLoading) return <main className={styles.page}><SectionState type="loading" message={requestedPatientId ? "Verificando paciente asignado…" : "Cargando pacientes asignados…"} /></main>;
  if (data.loadError) {
    return <main className={styles.page}><div className={styles.state} role="alert"><h1>No pudimos cargar los pacientes</h1><p>Revisá la conexión con el sistema e intentá nuevamente.</p><button type="button" onClick={data.retry}>Reintentar</button></div></main>;
  }
  if (data.patientStatus === "not-found" || data.patientStatus === "unassigned") {
    const notFound = data.patientStatus === "not-found";
    return <main className={styles.page}><div className={styles.state} role="alert"><Icon name="shield" size={38} /><h1>{notFound ? "Paciente inexistente" : "Paciente no asignado"}</h1><p>{notFound ? "El paciente indicado no existe o ya no está disponible." : "No podés crear una evolución porque este paciente no tiene una asignación activa con tu perfil profesional."}</p><Link to="/patients">Volver a pacientes</Link></div></main>;
  }
  if (data.patientStatus === "empty") {
    return <main className={styles.page}><div className={styles.state} role="status"><Icon name="patients" size={38} /><h1>Sin pacientes asignados</h1><p>Necesitás al menos una asignación activa para registrar una evolución clínica.</p><Link to="/patients">Volver a pacientes</Link></div></main>;
  }

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <span>Portal Médico</span><Icon name="chevron" size={16} /><Link to="/patients">Pacientes</Link><Icon name="chevron" size={16} /><strong>Nueva evolución</strong>
      </nav>
      <Link className={styles.back} to={cancelTarget} onClick={leave}><Icon name="arrow-left" size={18} />Volver</Link>
      <header className={styles.heading}><h1>Nueva evolución clínica</h1><p>Registrá la atención y el seguimiento clínico del paciente.</p><span>Los campos marcados con <strong>*</strong> son obligatorios.</span></header>

      <form onSubmit={submit} noValidate>
        {submitError && <div className={styles.formError} role="alert">{submitError}</div>}
        <section className={styles.card} aria-labelledby="context-title">
          <h2 id="context-title">Contexto de la evolución</h2>
          <div className={styles.cardBody}>
            {data.lockedPatient ? <PatientCard patient={data.lockedPatient} /> : (
              <div className={styles.field}>
                <label htmlFor="patient">Paciente <span>*</span></label>
                <select id="patient" ref={patientRef} value={form.patient} onChange={update("patient")} aria-invalid={Boolean(errors.patient)} aria-describedby={errors.patient ? "patient-error" : undefined}>
                  <option value="">Seleccionar paciente</option>
                  {data.patients.map((patient) => <option value={patient.id} key={patient.id}>{getFullName(patient)}{patient.document_number ? ` — ${patient.document_number}` : ""}</option>)}
                </select>
                {errors.patient && <span className={styles.fieldError} id="patient-error">{errors.patient}</span>}
              </div>
            )}
            {selectedPatient && !data.lockedPatient && <PatientCard patient={selectedPatient} />}
            <dl className={styles.contextGrid}>
              <div><dt>Autor</dt><dd>{professionalName(profileState.data, user)}</dd></div>
              <div><dt>Profesión / especialidad</dt><dd>{professionalDescription(profileState.data)}</dd></div>
              <div><dt>Fecha y hora</dt><dd>{formatDateTime(new Date())}</dd></div>
            </dl>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="record-title">
          <h2 id="record-title">Registro clínico</h2>
          <div className={styles.cardBody}>
            <div className={styles.twoColumns}>
              <div className={styles.field}>
                <label htmlFor="evolution-type">Tipo de evolución <span>*</span></label>
                <select id="evolution-type" ref={typeRef} value={form.type} onChange={update("type")} aria-invalid={Boolean(errors.type)} aria-describedby={errors.type ? "type-error" : undefined}>
                  {evolutionTypes.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
                {errors.type && <span className={styles.fieldError} id="type-error">{errors.type}</span>}
              </div>
              <div className={styles.field}>
                <label htmlFor="title">Título <small>(opcional)</small></label>
                <input id="title" value={form.title} onChange={update("title")} maxLength={255} placeholder="Ej.: Sesión de seguimiento" />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="content">Registro clínico <span>*</span></label>
              <p className={styles.hint} id="content-hint">Describí observaciones, intervención, respuesta del paciente y plan de seguimiento en un único registro.</p>
              <textarea id="content" ref={contentRef} value={form.content} onChange={update("content")} rows={12} placeholder="Ingresá la información clínica relevante…" aria-invalid={Boolean(errors.content)} aria-describedby={`content-hint${errors.content ? " content-error" : ""}`} />
              {errors.content && <span className={styles.fieldError} id="content-error">{errors.content}</span>}
            </div>
          </div>
        </section>

        <aside className={styles.notice}><Icon name="shield" size={22} /><p><strong>Edición disponible durante 72 horas</strong>Podrás editar esta evolución durante las próximas 72 horas. Después quedará registrada sin posibilidad de modificación.</p></aside>
        <div className={styles.actions}>
          <Link className={styles.cancel} to={cancelTarget} onClick={leave}>Cancelar</Link>
          <button className={styles.submit} type="submit" disabled={isSaving}>{isSaving ? "Guardando…" : "Guardar evolución"}</button>
        </div>
      </form>
    </main>
  );
}
