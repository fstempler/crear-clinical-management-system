import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Icon } from "../../components/common/Icon";
import {
  createProfessional,
  createProfessionalAccount,
  findProfessionalByDocumentNumber,
  findProfessionalByStaffUser,
  findStaffUserByEmail,
  isDuplicateProfessionalDocumentError,
  isDuplicateStaffEmailError,
  normalizeProfessionalDocument,
  updateProfessionalAccount,
} from "../../services/professionalsService";
import styles from "./NewProfessionalPage.module.scss";

const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL_VALUES = {
  first_name: "", last_name: "", document_number: "", profession: "", specialty: "",
  license_number: "", email: "", phone: "", administrative_notes: "", access_email: "",
  password: "", passwordConfirm: "", activate: true,
};
const REQUIRED = ["first_name", "last_name", "document_number", "profession", "license_number", "email", "access_email"];
const BUSY_PHASES = new Set(["validating", "creating-account", "creating-profile", "activating"]);
const PHASE_LABELS = {
  validating: "Validando…", "creating-account": "Creando cuenta…",
  "creating-profile": "Creando perfil…", activating: "Activando cuenta…",
};

function cleanValues(values) {
  return {
    ...values,
    first_name: values.first_name.trim(), last_name: values.last_name.trim(),
    document_number: normalizeProfessionalDocument(values.document_number),
    profession: values.profession.trim(), specialty: values.specialty.trim(),
    license_number: values.license_number.trim(), email: values.email.trim().toLowerCase(),
    phone: values.phone.trim(), administrative_notes: values.administrative_notes.trim(),
    access_email: values.access_email.trim().toLowerCase(),
  };
}

function validate(values, needsPassword) {
  const errors = {};
  REQUIRED.forEach((field) => { if (!values[field]) errors[field] = "Este campo es obligatorio."; });
  if (values.email && !EMAIL_PATTERN.test(values.email)) errors.email = "Ingresá un correo electrónico válido.";
  if (values.access_email && !EMAIL_PATTERN.test(values.access_email)) errors.access_email = "Ingresá un correo electrónico válido.";
  if (needsPassword) {
    if (!values.password) errors.password = "La contraseña temporal es obligatoria.";
    else if (values.password !== values.password.trim()) errors.password = "La contraseña no puede comenzar ni terminar con espacios.";
    else if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = `Usá al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
    if (!values.passwordConfirm) errors.passwordConfirm = "Confirmá la contraseña temporal.";
    else if (values.passwordConfirm !== values.password) errors.passwordConfirm = "Las contraseñas no coinciden.";
  }
  return errors;
}

function Field({ id, label, error, hint, required, children }) {
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return <div className={styles.field}>
    <label htmlFor={id}>{label} {required && <span aria-hidden="true">*</span>}</label>
    {hint && <span className={styles.hint} id={`${id}-hint`}>{hint}</span>}
    {children(describedBy)}
    {error && <span className={styles.fieldError} id={`${id}-error`}>{error}</span>}
  </div>;
}

function PasswordControl({ name, label, value, error, onChange, visible, onToggle }) {
  return <Field id={name} label={label} error={error} required hint={name === "password" ? `Mínimo ${PASSWORD_MIN_LENGTH} caracteres.` : undefined}>
    {(describedBy) => <div className={styles.passwordControl}>
      <input id={name} name={name} type={visible ? "text" : "password"} value={value} onChange={onChange} autoComplete="new-password" aria-invalid={Boolean(error)} aria-describedby={describedBy} />
      <button type="button" onClick={onToggle} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}>{visible ? "Ocultar" : "Mostrar"}</button>
    </div>}
  </Field>;
}

function errorMessage(error) {
  if (error?.status === 0) return "No pudimos conectarnos con PocketBase. Revisá la conexión e intentá nuevamente.";
  if (error?.status === 403) return "Tu cuenta no tiene permisos para realizar esta operación.";
  return "Ocurrió un error inesperado. Conservamos los datos para que puedas intentarlo nuevamente.";
}

export function NewProfessionalPage() {
  const navigate = useNavigate();
  const formRef = useRef(null);
  const submittingRef = useRef(false);
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [phase, setPhase] = useState("initial");
  const [pendingAccount, setPendingAccount] = useState(null);
  const [createdProfessional, setCreatedProfessional] = useState(null);
  const [recoveryConfirmed, setRecoveryConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const isBusy = BUSY_PHASES.has(phase);
  const isDirty = useMemo(() => Object.entries(values).some(([key, value]) => key === "activate" ? value !== true : value !== ""), [values]);

  useEffect(() => {
    const warn = (event) => {
      if (!isDirty || isBusy || phase === "success") return;
      event.preventDefault(); event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isBusy, isDirty, phase]);

  const canLeave = () => !isDirty || phase === "success" || window.confirm("Hay datos sin guardar. ¿Querés salir de todos modos?");
  const onLeaveLink = (event) => { if (!canLeave()) event.preventDefault(); };
  const cancel = () => { if (canLeave()) navigate("/professionals"); };
  const focusFirstError = (nextErrors) => {
    const first = Object.keys(nextErrors)[0];
    requestAnimationFrame(() => formRef.current?.elements.namedItem(first)?.focus());
  };
  const update = (event) => {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (name === "access_email") { setPendingAccount(null); setRecoveryConfirmed(false); }
    if (message) setMessage("");
  };
  const control = (name, describedBy, extra = {}) => ({
    id: name, name, value: values[name], onChange: update, "aria-invalid": Boolean(errors[name]),
    "aria-describedby": describedBy, disabled: isBusy, ...extra,
  });

  const finish = (professional, inactive) => {
    setValues((current) => ({ ...current, password: "", passwordConfirm: "" }));
    setPhase("success");
    navigate(`/professionals/${professional.id}`, {
      replace: true,
      state: { professionalCreated: true, accountInactive: inactive, returnPath: "/professionals" },
    });
  };

  const activateCreatedAccount = async () => {
    if (!pendingAccount || !createdProfessional || submittingRef.current) return;
    submittingRef.current = true; setPhase("activating"); setMessage("");
    try {
      await updateProfessionalAccount(pendingAccount.id, { active: true });
      finish(createdProfessional, false);
    } catch (error) {
      setPhase("activation-pending"); setMessage(errorMessage(error));
    } finally { submittingRef.current = false; }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (submittingRef.current || isBusy) return;
    const cleaned = cleanValues(values);
    const needsPassword = !pendingAccount;
    const nextErrors = validate(cleaned, needsPassword);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors); setPhase("validation-error");
      setMessage("Revisá los campos señalados antes de continuar."); focusFirstError(nextErrors); return;
    }
    submittingRef.current = true; setPhase("validating"); setMessage("");
    let accountToUse = pendingAccount;
    try {
      const duplicateDocument = await findProfessionalByDocumentNumber(cleaned.document_number);
      if (duplicateDocument) {
        const next = { document_number: "Ya existe un profesional con este número de documento." };
        setErrors(next); setPhase("validation-error"); setMessage("El documento ingresado ya está en uso."); focusFirstError(next); return;
      }
      if (!accountToUse) {
        const existingAccount = await findStaffUserByEmail(cleaned.access_email);
        if (existingAccount) {
          const existingProfessional = await findProfessionalByStaffUser(existingAccount.id);
          if (existingProfessional) {
            setCreatedProfessional(existingProfessional); setPhase("existing-profile");
            setMessage("Este email de acceso ya pertenece a un profesional registrado."); return;
          }
          if (existingAccount.role !== "professional") {
            setPhase("incompatible-account");
            setMessage("Este email pertenece a una cuenta con un rol incompatible y no puede vincularse a un profesional."); return;
          }
          setPendingAccount(existingAccount); setValues((current) => ({ ...current, password: "", passwordConfirm: "" }));
          setRecoveryConfirmed(false); setPhase("incomplete-account");
          setMessage(`Ya existe una cuenta profesional ${existingAccount.active ? "activa" : "inactiva"} sin perfil. Confirmá si querés completar el perfil utilizando esa cuenta. No se modificará su contraseña.`); return;
        }
        setPhase("creating-account");
        accountToUse = await createProfessionalAccount({
          email: cleaned.access_email, password: cleaned.password, passwordConfirm: cleaned.passwordConfirm,
          role: "professional", active: false,
        });
        setPendingAccount(accountToUse);
        setValues((current) => ({ ...current, password: "", passwordConfirm: "" }));
      } else if (!recoveryConfirmed && phase === "incomplete-account") {
        setMessage("Confirmá la vinculación de la cuenta incompleta antes de continuar."); return;
      }

      if (accountToUse.active) {
        accountToUse = await updateProfessionalAccount(accountToUse.id, { active: false });
        setPendingAccount(accountToUse);
      }

      setPhase("creating-profile");
      let professional;
      try {
        professional = await createProfessional({
          staff_user: accountToUse.id, first_name: cleaned.first_name, last_name: cleaned.last_name,
          document_number: cleaned.document_number, profession: cleaned.profession, specialty: cleaned.specialty,
          license_number: cleaned.license_number, email: cleaned.email, phone: cleaned.phone,
          administrative_notes: cleaned.administrative_notes,
        });
      } catch (error) {
        setPhase("profile-pending");
        setMessage(isDuplicateProfessionalDocumentError(error)
          ? "El documento ingresado ya está en uso. La cuenta de acceso permanece inactiva."
          : "La cuenta de acceso fue creada, pero no pudimos completar el perfil profesional. La cuenta permanece inactiva y no puede iniciar sesión.");
        return;
      }
      setCreatedProfessional(professional);
      if (!cleaned.activate) { finish(professional, true); return; }
      setPhase("activating");
      try {
        await updateProfessionalAccount(accountToUse.id, { active: true });
        finish(professional, false);
      } catch {
        setPhase("activation-pending");
        setMessage("El profesional fue creado correctamente, pero la cuenta permanece inactiva.");
      }
    } catch (error) {
      if (isDuplicateStaffEmailError(error)) {
        setPhase("validation-error"); setMessage("El email de acceso ya está en uso. Volvé a intentar para revisar la cuenta existente.");
      } else { setPhase("connection-error"); setMessage(errorMessage(error)); }
    } finally { submittingRef.current = false; }
  };

  return <main className={styles.page}>
    <nav className={styles.breadcrumb} aria-label="Migas de pan"><Link to="/">Portal Administrativo</Link><Icon name="chevron" size={16} /><Link to="/professionals" onClick={onLeaveLink}>Profesionales</Link><Icon name="chevron" size={16} /><span aria-current="page">Nuevo profesional</span></nav>
    <Link className={styles.back} to="/professionals" onClick={onLeaveLink}><Icon name="arrow-left" size={18} />Volver a profesionales</Link>
    <header className={styles.heading}><h1>Registrar profesional</h1><p>Creá el perfil profesional y su cuenta de acceso de forma coordinada.</p><span><strong aria-hidden="true">*</strong> Campos obligatorios</span></header>

    <form ref={formRef} onSubmit={submit} noValidate>
      {message && <div className={`${styles.notice} ${phase === "incomplete-account" || phase === "activation-pending" ? styles.warning : styles.error}`} role={phase === "validating" ? "status" : "alert"}>{message}
        {phase === "existing-profile" && createdProfessional && <Link to={`/professionals/${createdProfessional.id}`} state={{ returnPath: "/professionals" }}>Ver profesional</Link>}
      </div>}
      {isBusy && <p className={styles.progress} role="status" aria-live="polite">{PHASE_LABELS[phase]}</p>}

      <div className={styles.columns}>
        <div className={styles.primary}>
          <fieldset className={styles.section}><legend>Identidad</legend><div className={styles.grid}>
            <Field id="first_name" label="Nombre" required error={errors.first_name}>{(d) => <input {...control("first_name", d, { autoComplete: "given-name" })} />}</Field>
            <Field id="last_name" label="Apellido" required error={errors.last_name}>{(d) => <input {...control("last_name", d, { autoComplete: "family-name" })} />}</Field>
            <Field id="document_number" label="Documento" required error={errors.document_number} hint="Se guardará sin espacios, puntos ni guiones.">{(d) => <input {...control("document_number", d, { autoComplete: "off" })} />}</Field>
          </div></fieldset>
          <fieldset className={styles.section}><legend>Información profesional</legend><div className={styles.grid}>
            <Field id="profession" label="Profesión" required error={errors.profession}>{(d) => <input {...control("profession", d)} />}</Field>
            <Field id="specialty" label="Especialidad" error={errors.specialty}>{(d) => <input {...control("specialty", d)} />}</Field>
            <Field id="license_number" label="Matrícula" required error={errors.license_number}>{(d) => <input {...control("license_number", d)} />}</Field>
          </div></fieldset>
          <fieldset className={styles.section}><legend>Contacto profesional</legend><div className={styles.grid}>
            <Field id="email" label="Email profesional" required error={errors.email} hint="Se utiliza como dato de contacto y puede ser diferente del email de acceso.">{(d) => <input {...control("email", d, { type: "email", autoComplete: "email" })} />}</Field>
            <Field id="phone" label="Teléfono" error={errors.phone}>{(d) => <input {...control("phone", d, { type: "tel", autoComplete: "tel" })} />}</Field>
          </div></fieldset>
          <fieldset className={styles.section}><legend>Información administrativa</legend><div className={styles.grid}>
            <Field id="administrative_notes" label="Notas administrativas" error={errors.administrative_notes} hint="No incluyas información clínica en este campo.">{(d) => <textarea {...control("administrative_notes", d, { rows: 5 })} />}</Field>
          </div></fieldset>
        </div>

        <aside className={styles.secondary}>
          <fieldset className={styles.section}><legend>Cuenta de acceso</legend><div className={styles.accountFields}>
            <Field id="access_email" label="Email de acceso" required error={errors.access_email} hint="El profesional utilizará este email para iniciar sesión.">{(d) => <input {...control("access_email", d, { type: "email", autoComplete: "username" })} />}</Field>
            {!pendingAccount && <><PasswordControl name="password" label="Contraseña temporal" value={values.password} error={errors.password} onChange={update} visible={showPassword} onToggle={() => setShowPassword((v) => !v)} /><PasswordControl name="passwordConfirm" label="Confirmación de contraseña" value={values.passwordConfirm} error={errors.passwordConfirm} onChange={update} visible={showConfirmation} onToggle={() => setShowConfirmation((v) => !v)} /></>}
            <div className={styles.readOnly}><span>Rol</span><strong>Profesional</strong></div>
            <label className={styles.checkbox}><input type="checkbox" name="activate" checked={values.activate} onChange={update} disabled={isBusy} /><span><strong>Activar cuenta al finalizar</strong><small>La cuenta se crea inactiva y solo se activa después de completar el perfil.</small></span></label>
            {phase === "incomplete-account" && <label className={`${styles.checkbox} ${styles.confirm}`}><input type="checkbox" checked={recoveryConfirmed} onChange={(event) => setRecoveryConfirmed(event.target.checked)} /><span><strong>Confirmo que quiero vincular esta cuenta existente</strong><small>Su contraseña actual no será modificada.</small></span></label>}
          </div></fieldset>
          <section className={styles.security}><Icon name="shield" size={23} /><div><h2>Creación segura</h2><p>La contraseña temporal no se guarda en el navegador ni se envía por email. Actualmente no se exige cambiarla en el primer acceso.</p></div></section>
        </aside>
      </div>

      {phase === "activation-pending" && createdProfessional ? <div className={styles.recoveryActions}><button type="button" className={styles.submit} onClick={activateCreatedAccount}>Reintentar activación</button><button type="button" className={styles.cancel} onClick={() => finish(createdProfessional, true)}>Ir al perfil profesional</button></div> : <div className={styles.actions}><button type="button" className={styles.cancel} onClick={cancel} disabled={isBusy}>Cancelar</button><button className={styles.submit} type="submit" disabled={isBusy || (phase === "incomplete-account" && !recoveryConfirmed)}>{PHASE_LABELS[phase] || (phase === "profile-pending" ? "Reintentar creación del perfil" : phase === "incomplete-account" ? "Completar perfil" : "Crear profesional")}</button></div>}
    </form>
  </main>;
}
