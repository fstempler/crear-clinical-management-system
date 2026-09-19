import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import {
  findPatientByDocumentNumber,
  getPatientProfile,
  isDuplicateDocumentError,
  normalizeDocumentNumber,
  updatePatient,
} from "../../services/patientsService";
import { calculateAge, formatDate } from "../../utils/date";
import { getFullName, getInitials, getPatientDocumentType } from "../../utils/presentation";
import styles from "./PatientAdministrationPage.module.scss";

const EDITABLE_FIELDS = [
  "first_name", "last_name", "document_type", "document_number", "birth_date",
  "gender", "address", "city", "phone", "email", "health_insurance",
  "affiliate_number", "status", "emergency_contact_name",
  "emergency_contact_relationship", "emergency_contact_phone", "administrative_notes",
];

const REQUIRED_FIELDS = [
  "first_name", "last_name", "document_type", "document_number", "birth_date", "gender",
  "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayLocal() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function patientValues(patient) {
  return Object.fromEntries(EDITABLE_FIELDS.map((field) => [field, `${patient?.[field] ?? ""}`]));
}

function cleanValues(values) {
  return Object.fromEntries(EDITABLE_FIELDS.map((field) => [
    field,
    field === "document_number" ? normalizeDocumentNumber(values[field]) : values[field].trim(),
  ]));
}

function validate(values) {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (!values[field]) errors[field] = "Este campo es obligatorio.";
  });
  if (values.birth_date && values.birth_date > todayLocal()) {
    errors.birth_date = "La fecha de nacimiento no puede ser futura.";
  }
  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    errors.email = "Ingresá un correo electrónico válido.";
  }
  return errors;
}

function Field({ id, label, error, required = false, hint, children }) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label} {required && <span aria-hidden="true">*</span>}</label>
      {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
      {children(describedBy)}
      {error && <span className={styles.fieldError} id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function PatientAdministrationPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const formRef = useRef(null);
  const submittingRef = useRef(false);
  const [patient, setPatient] = useState(null);
  const [values, setValues] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    // Starting a fresh remote request is the synchronization owned by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setLoadError(null);
    getPatientProfile(patientId)
      .then((record) => {
        if (!active) return;
        const nextValues = patientValues(record);
        setPatient(record);
        setValues(nextValues);
        setInitialValues(nextValues);
      })
      .catch((error) => { if (active) setLoadError(error); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [patientId, reloadKey]);

  const isDirty = useMemo(
    () => Boolean(values && initialValues && JSON.stringify(values) !== JSON.stringify(initialValues)),
    [initialValues, values],
  );

  useEffect(() => {
    const warn = (event) => {
      if (!isDirty || isSubmitting) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty, isSubmitting]);

  const leave = () => {
    if (!isDirty || window.confirm("Hay cambios sin guardar. ¿Querés salir de todos modos?")) {
      navigate(`/patients/${patientId}`);
    }
  };

  const confirmLinkNavigation = (event) => {
    if (isDirty && !window.confirm("Hay cambios sin guardar. ¿Querés salir de todos modos?")) {
      event.preventDefault();
    }
  };

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitError) setSubmitError("");
  };

  const focusFirstError = (nextErrors) => {
    const firstName = Object.keys(nextErrors)[0];
    requestAnimationFrame(() => formRef.current?.elements.namedItem(firstName)?.focus());
  };

  const control = (name, describedBy, extra = {}) => ({
    id: name, name, value: values[name], onChange: update,
    "aria-invalid": Boolean(errors[name]), "aria-describedby": describedBy, ...extra,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const cleaned = cleanValues(values);
    const nextErrors = validate(cleaned);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSubmitError("Revisá los campos señalados antes de continuar.");
      focusFirstError(nextErrors);
      return;
    }
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const duplicate = await findPatientByDocumentNumber(cleaned.document_number, patientId);
      if (duplicate) {
        const duplicateErrors = { document_number: "Ya existe otro paciente con este número de documento." };
        setErrors(duplicateErrors);
        setSubmitError("No se pudieron guardar los cambios porque el documento ya está en uso.");
        focusFirstError(duplicateErrors);
        return;
      }
      await updatePatient(patientId, cleaned);
      setInitialValues(cleaned);
      navigate(`/patients/${patientId}`, { replace: true, state: { patientUpdated: true } });
    } catch (error) {
      if (isDuplicateDocumentError(error)) {
        const duplicateErrors = { document_number: "Ya existe otro paciente con este número de documento." };
        setErrors(duplicateErrors);
        setSubmitError("No se pudieron guardar los cambios porque el documento ya está en uso.");
        focusFirstError(duplicateErrors);
      } else {
        setSubmitError("No pudimos guardar los cambios. Verificá tu conexión e intentá nuevamente.");
        if (import.meta.env.DEV) console.error("Error al actualizar paciente", error);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <main className={styles.page}><div className={styles.state} role="status">Cargando información administrativa…</div></main>;
  if (loadError) {
    const unavailable = loadError?.status === 404;
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon name={unavailable ? "patients" : "retry"} size={38} />
          <h1>{unavailable ? "Paciente no disponible" : "No pudimos cargar los datos"}</h1>
          <p>{unavailable ? "El paciente no existe o no tenés permiso para consultarlo." : "Revisá la conexión con PocketBase e intentá nuevamente."}</p>
          <div><Link to="/patients">Volver a pacientes</Link>{!unavailable && <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Reintentar</button>}</div>
        </div>
      </main>
    );
  }

  const name = getFullName(patient);
  const age = calculateAge(values.birth_date);
  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/" onClick={confirmLinkNavigation}>Portal Administrativo</Link><Icon name="chevron" size={16} />
        <Link to="/patients" onClick={confirmLinkNavigation}>Pacientes</Link><Icon name="chevron" size={16} />
        <Link to={`/patients/${patientId}`} onClick={confirmLinkNavigation}>{name}</Link><Icon name="chevron" size={16} />
        <span aria-current="page">Información administrativa</span>
      </nav>

      <button className={styles.back} type="button" onClick={leave}><Icon name="arrow-left" size={18} /> Volver al perfil</button>

      <header className={styles.heading}>
        <h1>Información administrativa</h1>
        <p>Consultá y actualizá los datos generales del paciente.</p>
      </header>

      <section className={styles.patientSummary} aria-label="Paciente seleccionado">
        <span className={styles.avatar} aria-hidden="true">{getInitials(patient.first_name, patient.last_name)}</span>
        <div><strong>{name}</strong><span>{getPatientDocumentType(patient.document_type)} {patient.document_number || "sin informar"}</span></div>
        <Link to={`/patients/${patientId}/files`} onClick={confirmLinkNavigation}>Ver archivos del paciente <Icon name="chevron" size={17} /></Link>
      </section>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {submitError && <div className={styles.formError} role="alert">{submitError}</div>}

        <div className={styles.formLayout}>
          <div className={styles.mainColumn}>
            <fieldset className={styles.section}>
              <legend>Identidad</legend>
              <div className={styles.grid}>
                <Field id="first_name" label="Nombre" required error={errors.first_name}>{(describedBy) => <input {...control("first_name", describedBy, { autoComplete: "given-name" })} />}</Field>
                <Field id="last_name" label="Apellido" required error={errors.last_name}>{(describedBy) => <input {...control("last_name", describedBy, { autoComplete: "family-name" })} />}</Field>
                <Field id="document_type" label="Tipo de documento" required error={errors.document_type}>{(describedBy) => <select {...control("document_type", describedBy)}><option value="dni">DNI</option><option value="passport">Pasaporte</option><option value="other">Otro</option></select>}</Field>
                <Field id="document_number" label="Número de documento" required error={errors.document_number} hint="Se guardará sin puntos ni guiones.">{(describedBy) => <input {...control("document_number", describedBy, { autoComplete: "off", inputMode: "text" })} />}</Field>
                <Field id="birth_date" label="Fecha de nacimiento" required error={errors.birth_date}>{(describedBy) => <input {...control("birth_date", describedBy, { type: "date", max: todayLocal() })} />}</Field>
                <Field id="gender" label="Género" required error={errors.gender}>{(describedBy) => <select {...control("gender", describedBy)}><option value="">Seleccionar</option><option value="female">Femenino</option><option value="male">Masculino</option><option value="non_binary">No binario</option><option value="other">Otro</option><option value="not_specified">Prefiero no especificar</option></select>}</Field>
                <div className={styles.readOnly}><span>Edad</span><strong>{age === null ? "No disponible" : `${age} años`}</strong></div>
                <div className={styles.readOnly}><span>Fecha de admisión</span><strong>{formatDate(patient.admission_date)}</strong></div>
              </div>
            </fieldset>

            <fieldset className={styles.section}>
              <legend>Contacto y domicilio</legend>
              <div className={styles.grid}>
                <Field id="phone" label="Teléfono" error={errors.phone}>{(describedBy) => <input {...control("phone", describedBy, { type: "tel", autoComplete: "tel" })} />}</Field>
                <Field id="email" label="Correo electrónico" error={errors.email}>{(describedBy) => <input {...control("email", describedBy, { type: "email", autoComplete: "email" })} />}</Field>
                <Field id="address" label="Dirección" error={errors.address}>{(describedBy) => <input {...control("address", describedBy, { autoComplete: "street-address" })} />}</Field>
                <Field id="city" label="Localidad" error={errors.city}>{(describedBy) => <input {...control("city", describedBy, { autoComplete: "address-level2" })} />}</Field>
              </div>
            </fieldset>
          </div>

          <div className={styles.sideColumn}>
            <fieldset className={styles.section}><legend>Cobertura médica</legend><div className={styles.singleGrid}>
              <Field id="health_insurance" label="Obra social o prepaga" error={errors.health_insurance}>{(describedBy) => <input {...control("health_insurance", describedBy)} />}</Field>
              <Field id="affiliate_number" label="Número de afiliado" error={errors.affiliate_number}>{(describedBy) => <input {...control("affiliate_number", describedBy)} />}</Field>
            </div></fieldset>

            <fieldset className={styles.section}><legend>Contacto de emergencia</legend><div className={styles.singleGrid}>
              <Field id="emergency_contact_name" label="Nombre y apellido" required error={errors.emergency_contact_name}>{(describedBy) => <input {...control("emergency_contact_name", describedBy)} />}</Field>
              <Field id="emergency_contact_relationship" label="Relación con el paciente" required error={errors.emergency_contact_relationship}>{(describedBy) => <input {...control("emergency_contact_relationship", describedBy)} />}</Field>
              <Field id="emergency_contact_phone" label="Teléfono" required error={errors.emergency_contact_phone}>{(describedBy) => <input {...control("emergency_contact_phone", describedBy, { type: "tel" })} />}</Field>
            </div></fieldset>

            <fieldset className={styles.section}><legend>Información administrativa</legend><div className={styles.singleGrid}>
              <Field id="status" label="Estado del paciente" error={errors.status} hint="Cambiar el estado no elimina al paciente ni sus registros clínicos.">{(describedBy) => <select {...control("status", describedBy)}><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="discharged">Dado de alta</option></select>}</Field>
              <Field id="administrative_notes" label="Notas administrativas" error={errors.administrative_notes} hint="No incluyas información clínica en este campo.">{(describedBy) => <textarea {...control("administrative_notes", describedBy, { rows: 5 })} />}</Field>
            </div></fieldset>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancel} type="button" onClick={leave} disabled={isSubmitting}>Cancelar</button>
          <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </form>
    </main>
  );
}
