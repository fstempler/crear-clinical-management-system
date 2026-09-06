import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Icon } from "../../components/common/Icon";
import {
  createPatient,
  findPatientByDocumentNumber,
  isDuplicateDocumentError,
  normalizeDocumentNumber,
} from "../../services/patientsService";
import styles from "./NewPatientPage.module.scss";

const INITIAL_VALUES = {
  first_name: "",
  last_name: "",
  document_type: "dni",
  document_number: "",
  birth_date: "",
  gender: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  health_insurance: "",
  affiliate_number: "",
  status: "active",
  emergency_contact_name: "",
  emergency_contact_relationship: "",
  emergency_contact_phone: "",
  administrative_notes: "",
};

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "document_type",
  "document_number",
  "birth_date",
  "gender",
  "emergency_contact_name",
  "emergency_contact_relationship",
  "emergency_contact_phone",
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function todayLocal() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function validate(values) {
  const errors = {};
  REQUIRED_FIELDS.forEach((field) => {
    if (!values[field].trim()) errors[field] = "Este campo es obligatorio.";
  });
  if (values.birth_date && values.birth_date > todayLocal()) {
    errors.birth_date = "La fecha de nacimiento no puede ser futura.";
  }
  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Ingresá un correo electrónico válido.";
  }
  return errors;
}

function cleanValues(values) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === "document_number" ? normalizeDocumentNumber(value) : value.trim(),
    ]),
  );
}

function Field({ id, label, error, required = false, children, hint }) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ") || undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
      {children({ describedBy })}
      {error && <span className={styles.fieldError} id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function NewPatientPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const submittingRef = useRef(false);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (event) => {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitError) setSubmitError("");
  };

  const inputProps = (name) => ({
    id: name,
    name,
    value: values[name],
    onChange: update,
    "aria-invalid": Boolean(errors[name]),
  });

  const focusFirstError = (nextErrors) => {
    const firstName = Object.keys(nextErrors)[0];
    requestAnimationFrame(() => formRef.current?.elements.namedItem(firstName)?.focus());
  };

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
      const duplicate = await findPatientByDocumentNumber(cleaned.document_number);
      if (duplicate) {
        const duplicateError = { document_number: "Ya existe un paciente con este número de documento." };
        setErrors(duplicateError);
        setSubmitError("No se pudo registrar el paciente porque el documento ya está en uso.");
        focusFirstError(duplicateError);
        return;
      }

      await createPatient(cleaned);
      navigate("/patients", {
        replace: true,
        state: {
          patientCreated: true,
          patientName: `${cleaned.first_name} ${cleaned.last_name}`,
        },
      });
    } catch (error) {
      if (isDuplicateDocumentError(error)) {
        const duplicateError = { document_number: "Ya existe un paciente con este número de documento." };
        setErrors(duplicateError);
        setSubmitError("No se pudo registrar el paciente porque el documento ya está en uso.");
        focusFirstError(duplicateError);
      } else {
        setSubmitError("No pudimos guardar el paciente. Verificá tu conexión e intentá nuevamente.");
        if (import.meta.env.DEV) console.error("Error al crear paciente", error);
      }
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const control = (name, describedBy, extra = {}) => ({
    ...inputProps(name),
    "aria-describedby": describedBy,
    ...extra,
  });

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/">Portal Administrativo</Link><Icon name="chevron" size={16} />
        <Link to="/patients">Pacientes</Link><Icon name="chevron" size={16} />
        <span aria-current="page">Nuevo paciente</span>
      </nav>

      <Link className={styles.back} to="/patients"><Icon name="arrow-left" size={18} /> Volver a pacientes</Link>
      <header className={styles.heading}>
        <h1>Nuevo paciente</h1>
        <p>Completá los datos administrativos para registrar un nuevo paciente.</p>
        <span><strong aria-hidden="true">*</strong> Campos obligatorios</span>
      </header>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {submitError && <div className={styles.formError} role="alert">{submitError}</div>}

        <fieldset className={styles.section}>
          <legend>1. Datos personales</legend>
          <div className={styles.grid}>
            <Field id="first_name" label="Nombre" required error={errors.first_name}>{({ describedBy }) => <input {...control("first_name", describedBy, { autoComplete: "given-name" })} />}</Field>
            <Field id="last_name" label="Apellido" required error={errors.last_name}>{({ describedBy }) => <input {...control("last_name", describedBy, { autoComplete: "family-name" })} />}</Field>
            <Field id="document_type" label="Tipo de documento" required error={errors.document_type}>{({ describedBy }) => <select {...control("document_type", describedBy)}><option value="dni">DNI</option><option value="passport">Pasaporte</option><option value="other">Otro</option></select>}</Field>
            <Field id="document_number" label="Número de documento" required error={errors.document_number} hint="Sin puntos ni guiones.">{({ describedBy }) => <input {...control("document_number", describedBy, { autoComplete: "off" })} />}</Field>
            <Field id="birth_date" label="Fecha de nacimiento" required error={errors.birth_date}>{({ describedBy }) => <input {...control("birth_date", describedBy, { type: "date", max: todayLocal() })} />}</Field>
            <Field id="gender" label="Género" required error={errors.gender}>{({ describedBy }) => <select {...control("gender", describedBy)}><option value="">Seleccionar</option><option value="female">Femenino</option><option value="male">Masculino</option><option value="non_binary">No binario</option><option value="other">Otro</option><option value="not_specified">Prefiero no especificar</option></select>}</Field>
            <Field id="status" label="Estado" error={errors.status}>{({ describedBy }) => <select {...control("status", describedBy)}><option value="active">Activo</option><option value="inactive">Inactivo</option><option value="discharged">Dado de alta</option></select>}</Field>
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>2. Datos de contacto</legend>
          <div className={styles.grid}>
            <Field id="address" label="Dirección" error={errors.address}>{({ describedBy }) => <input {...control("address", describedBy, { autoComplete: "street-address" })} />}</Field>
            <Field id="city" label="Localidad" error={errors.city}>{({ describedBy }) => <input {...control("city", describedBy, { autoComplete: "address-level2" })} />}</Field>
            <Field id="phone" label="Teléfono" error={errors.phone}>{({ describedBy }) => <input {...control("phone", describedBy, { type: "tel", autoComplete: "tel" })} />}</Field>
            <Field id="email" label="Correo electrónico" error={errors.email}>{({ describedBy }) => <input {...control("email", describedBy, { type: "email", autoComplete: "email" })} />}</Field>
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>3. Cobertura médica</legend>
          <div className={styles.grid}>
            <Field id="health_insurance" label="Obra social o prepaga" error={errors.health_insurance}>{({ describedBy }) => <input {...control("health_insurance", describedBy)} />}</Field>
            <Field id="affiliate_number" label="Número de afiliado" error={errors.affiliate_number}>{({ describedBy }) => <input {...control("affiliate_number", describedBy)} />}</Field>
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>4. Contacto de emergencia</legend>
          <div className={styles.grid}>
            <Field id="emergency_contact_name" label="Nombre y apellido" required error={errors.emergency_contact_name}>{({ describedBy }) => <input {...control("emergency_contact_name", describedBy)} />}</Field>
            <Field id="emergency_contact_relationship" label="Relación con el paciente" required error={errors.emergency_contact_relationship}>{({ describedBy }) => <input {...control("emergency_contact_relationship", describedBy)} />}</Field>
            <Field id="emergency_contact_phone" label="Teléfono" required error={errors.emergency_contact_phone}>{({ describedBy }) => <input {...control("emergency_contact_phone", describedBy, { type: "tel" })} />}</Field>
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>5. Información administrativa</legend>
          <div className={styles.grid}>
            <Field id="administrative_notes" label="Notas administrativas" error={errors.administrative_notes} hint="No incluyas información clínica en este campo.">{({ describedBy }) => <textarea {...control("administrative_notes", describedBy, { rows: 5 })} />}</Field>
          </div>
        </fieldset>

        <div className={styles.actions}>
          <Link className={styles.cancel} to="/patients">Cancelar</Link>
          <button className={styles.submit} type="submit" disabled={isSubmitting}>{isSubmitting ? "Guardando…" : "Guardar paciente"}</button>
        </div>
      </form>
    </main>
  );
}
