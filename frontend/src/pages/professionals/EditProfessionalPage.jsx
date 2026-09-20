import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import {
  findProfessionalByDocumentNumber,
  findStaffUserByEmail,
  getProfessionalDetail,
  isDuplicateProfessionalDocumentError,
  isDuplicateStaffEmailError,
  normalizeProfessionalDocument,
  updateProfessional,
  updateProfessionalAccount,
} from "../../services/professionalsService";
import { formatDate, formatDateTime } from "../../utils/date";
import { getFullName, getInitials } from "../../utils/presentation";
import styles from "./EditProfessionalPage.module.scss";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PROFESSIONAL_FIELDS = [
  "first_name", "last_name", "document_number", "profession", "specialty",
  "license_number", "email", "phone", "administrative_notes",
];
const REQUIRED_PROFESSIONAL_FIELDS = [
  "first_name", "last_name", "document_number", "profession", "license_number", "email",
];

function safeReturnPath(value) {
  return typeof value === "string" && /^\/professionals(?:[/?]|$)/.test(value)
    ? value
    : "/professionals";
}

function professionalValues(record) {
  return Object.fromEntries(PROFESSIONAL_FIELDS.map((field) => [field, `${record?.[field] ?? ""}`]));
}

function cleanProfessionalValues(values) {
  return Object.fromEntries(PROFESSIONAL_FIELDS.map((field) => [
    field,
    field === "document_number" ? normalizeProfessionalDocument(values[field]) : values[field].trim(),
  ]));
}

function validateProfessional(values) {
  const errors = {};
  REQUIRED_PROFESSIONAL_FIELDS.forEach((field) => {
    if (!values[field]) errors[field] = "Este campo es obligatorio.";
  });
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

function ReadOnly({ label, children }) {
  return <div className={styles.readOnly}><span>{label}</span><strong>{children}</strong></div>;
}

function ConfirmStatusDialog({ professionalName, nextActive, isSubmitting, onCancel, onConfirm }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const previousFocus = useRef(document.activeElement);

  useEffect(() => {
    const focusToRestore = previousFocus.current;
    cancelRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) onCancel();
      if (event.key !== "Tab") return;
      const focusable = [...dialogRef.current.querySelectorAll("button:not(:disabled)")];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      focusToRestore?.focus?.();
    };
  }, [isSubmitting, onCancel]);

  const action = nextActive ? "Activar" : "Desactivar";
  return (
    <div className={styles.dialogBackdrop} role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget && !isSubmitting) onCancel();
    }}>
      <div ref={dialogRef} className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="status-dialog-title" aria-describedby="status-dialog-description">
        <span className={`${styles.dialogIcon} ${nextActive ? styles.activateIcon : styles.deactivateIcon}`} aria-hidden="true"><Icon name="shield" size={28} /></span>
        <h2 id="status-dialog-title">{action} cuenta de acceso</h2>
        <div id="status-dialog-description">
          <p>Vas a {nextActive ? "activar" : "desactivar"} la cuenta de <strong>{professionalName}</strong>.</p>
          {nextActive ? (
            <p>Podrá volver a iniciar sesión con sus credenciales existentes.</p>
          ) : (
            <p>Ya no podrá iniciar sesión. Sus registros clínicos y toda la información histórica permanecerán intactos.</p>
          )}
        </div>
        <div className={styles.dialogActions}>
          <button ref={cancelRef} type="button" className={styles.cancel} onClick={onCancel} disabled={isSubmitting}>Cancelar</button>
          <button type="button" className={nextActive ? styles.activate : styles.deactivate} onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? `${nextActive ? "Activando" : "Desactivando"}…` : `${action} cuenta`}
          </button>
        </div>
      </div>
    </div>
  );
}

export function EditProfessionalPage() {
  const { professionalId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const professionalFormRef = useRef(null);
  const accountFormRef = useRef(null);
  const professionalSubmittingRef = useRef(false);
  const accountSubmittingRef = useRef(false);
  const returnPath = safeReturnPath(location.state?.returnPath);
  const profilePath = `/professionals/${professionalId}`;

  const [professional, setProfessional] = useState(null);
  const [account, setAccount] = useState(null);
  const [professionalForm, setProfessionalForm] = useState(null);
  const [initialProfessionalForm, setInitialProfessionalForm] = useState(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [initialAccountEmail, setInitialAccountEmail] = useState("");
  const [professionalErrors, setProfessionalErrors] = useState({});
  const [accountErrors, setAccountErrors] = useState({});
  const [professionalMessage, setProfessionalMessage] = useState(null);
  const [accountMessage, setAccountMessage] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfessional, setIsSavingProfessional] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    let active = true;
    // Starting a fresh remote request is the synchronization owned by this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);
    setLoadError(null);
    getProfessionalDetail(professionalId)
      .then((record) => {
        if (!active) return;
        const nextProfessionalForm = professionalValues(record);
        const relatedAccount = record.expand?.staff_user || null;
        const nextAccountEmail = relatedAccount?.email || "";
        setProfessional(record);
        setAccount(relatedAccount);
        setProfessionalForm(nextProfessionalForm);
        setInitialProfessionalForm(nextProfessionalForm);
        setAccountEmail(nextAccountEmail);
        setInitialAccountEmail(nextAccountEmail);
      })
      .catch((error) => { if (active) setLoadError(error); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [professionalId, reloadKey]);

  const professionalDirty = useMemo(
    () => Boolean(professionalForm && initialProfessionalForm && JSON.stringify(professionalForm) !== JSON.stringify(initialProfessionalForm)),
    [initialProfessionalForm, professionalForm],
  );
  const accountDirty = Boolean(account && accountEmail !== initialAccountEmail);
  const isDirty = professionalDirty || accountDirty;
  const anySubmitting = isSavingProfessional || isSavingAccount || isSavingStatus;

  useEffect(() => {
    const warn = (event) => {
      if (!isDirty || anySubmitting) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [anySubmitting, isDirty]);

  const canLeave = () => !isDirty || window.confirm("Hay cambios sin guardar. ¿Querés salir de todos modos?");
  const leaveToProfile = () => {
    if (canLeave()) navigate(profilePath, { state: { returnPath, professionalUpdated: hasSaved } });
  };
  const confirmLinkNavigation = (event) => {
    if (!canLeave()) event.preventDefault();
  };

  const updateProfessionalField = (event) => {
    const { name, value } = event.target;
    setProfessionalForm((current) => ({ ...current, [name]: value }));
    if (professionalErrors[name]) setProfessionalErrors((current) => ({ ...current, [name]: undefined }));
    if (professionalMessage) setProfessionalMessage(null);
  };

  const professionalControl = (name, describedBy, extra = {}) => ({
    id: name,
    name,
    value: professionalForm[name],
    onChange: updateProfessionalField,
    "aria-invalid": Boolean(professionalErrors[name]),
    "aria-describedby": describedBy,
    ...extra,
  });

  const focusFirstError = (formRef, errors) => {
    const field = Object.keys(errors)[0];
    requestAnimationFrame(() => formRef.current?.elements.namedItem(field)?.focus());
  };

  const submitProfessional = async (event) => {
    event.preventDefault();
    if (professionalSubmittingRef.current || !professionalDirty) return;
    const cleaned = cleanProfessionalValues(professionalForm);
    const nextErrors = validateProfessional(cleaned);
    if (Object.keys(nextErrors).length) {
      setProfessionalErrors(nextErrors);
      setProfessionalMessage({ type: "error", text: "Revisá los campos señalados antes de guardar la información profesional." });
      focusFirstError(professionalFormRef, nextErrors);
      return;
    }

    professionalSubmittingRef.current = true;
    setIsSavingProfessional(true);
    setProfessionalMessage(null);
    try {
      const duplicate = await findProfessionalByDocumentNumber(cleaned.document_number, professionalId);
      if (duplicate) {
        const duplicateErrors = { document_number: "Ya existe otro profesional con este número de documento." };
        setProfessionalErrors(duplicateErrors);
        setProfessionalMessage({ type: "error", text: "No se guardó la información profesional porque el documento ya está en uso." });
        focusFirstError(professionalFormRef, duplicateErrors);
        return;
      }
      const updated = await updateProfessional(professionalId, cleaned);
      setProfessional((current) => ({ ...current, ...updated }));
      setProfessionalForm(cleaned);
      setInitialProfessionalForm(cleaned);
      setProfessionalErrors({});
      setHasSaved(true);
      setProfessionalMessage({ type: "success", text: "La información profesional se guardó correctamente." });
    } catch (error) {
      if (isDuplicateProfessionalDocumentError(error)) {
        const duplicateErrors = { document_number: "Ya existe otro profesional con este número de documento." };
        setProfessionalErrors(duplicateErrors);
        setProfessionalMessage({ type: "error", text: "No se guardó la información profesional porque el documento ya está en uso." });
        focusFirstError(professionalFormRef, duplicateErrors);
      } else {
        setProfessionalMessage({ type: "error", text: "No pudimos guardar la información profesional. Verificá la conexión e intentá nuevamente." });
        if (import.meta.env.DEV) console.error("Error al actualizar profesional", error);
      }
    } finally {
      professionalSubmittingRef.current = false;
      setIsSavingProfessional(false);
    }
  };

  const submitAccountEmail = async (event) => {
    event.preventDefault();
    if (accountSubmittingRef.current || !account || !accountDirty) return;
    const cleanedEmail = accountEmail.trim().toLowerCase();
    const nextErrors = {};
    if (!cleanedEmail) nextErrors.email = "Este campo es obligatorio.";
    else if (!EMAIL_PATTERN.test(cleanedEmail)) nextErrors.email = "Ingresá un correo electrónico válido.";
    if (Object.keys(nextErrors).length) {
      setAccountErrors(nextErrors);
      setAccountMessage({ type: "error", text: "Revisá el email de acceso antes de guardarlo." });
      focusFirstError(accountFormRef, nextErrors);
      return;
    }

    accountSubmittingRef.current = true;
    setIsSavingAccount(true);
    setAccountMessage(null);
    try {
      const duplicate = await findStaffUserByEmail(cleanedEmail, account.id);
      if (duplicate) {
        const duplicateErrors = { email: "Este email de acceso ya está siendo utilizado por otra cuenta." };
        setAccountErrors(duplicateErrors);
        setAccountMessage({ type: "error", text: "No se guardó el email de acceso porque ya está en uso." });
        focusFirstError(accountFormRef, duplicateErrors);
        return;
      }
      const updated = await updateProfessionalAccount(account.id, { email: cleanedEmail });
      setAccount((current) => ({ ...current, ...updated }));
      setAccountEmail(cleanedEmail);
      setInitialAccountEmail(cleanedEmail);
      setAccountErrors({});
      setHasSaved(true);
      setAccountMessage({ type: "success", text: "El email de acceso se guardó correctamente." });
    } catch (error) {
      if (isDuplicateStaffEmailError(error)) {
        const duplicateErrors = { email: "Este email de acceso ya está siendo utilizado por otra cuenta." };
        setAccountErrors(duplicateErrors);
        setAccountMessage({ type: "error", text: "No se guardó el email de acceso porque ya está en uso." });
        focusFirstError(accountFormRef, duplicateErrors);
      } else {
        setAccountMessage({ type: "error", text: "No pudimos guardar el email de acceso. Verificá la conexión e intentá nuevamente." });
        if (import.meta.env.DEV) console.error("Error al actualizar email de acceso", error);
      }
    } finally {
      accountSubmittingRef.current = false;
      setIsSavingAccount(false);
    }
  };

  const changeAccountStatus = async () => {
    if (!account || isSavingStatus) return;
    const nextActive = !account.active;
    setIsSavingStatus(true);
    setStatusMessage(null);
    try {
      const updated = await updateProfessionalAccount(account.id, { active: nextActive });
      setAccount((current) => ({ ...current, ...updated }));
      setHasSaved(true);
      setStatusDialogOpen(false);
      setStatusMessage({
        type: "success",
        text: nextActive
          ? "La cuenta está activa. El profesional puede volver a iniciar sesión con sus credenciales existentes."
          : "La cuenta fue desactivada. El profesional ya no puede iniciar sesión.",
      });
    } catch (error) {
      setStatusDialogOpen(false);
      setStatusMessage({ type: "error", text: `No pudimos ${nextActive ? "activar" : "desactivar"} la cuenta. Verificá la conexión e intentá nuevamente.` });
      if (import.meta.env.DEV) console.error("Error al actualizar estado de cuenta", error);
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (isLoading) {
    return <main className={styles.page}><SectionState type="loading" message="Cargando profesional…" /></main>;
  }

  if (loadError) {
    const notFound = loadError?.status === 404;
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon name={notFound ? "professional" : "retry"} size={38} />
          <h1>{notFound ? "Profesional no encontrado" : "No pudimos cargar el profesional"}</h1>
          <p>{notFound ? "El registro no existe o no está disponible." : "Revisá la conexión con PocketBase e intentá nuevamente."}</p>
          <div><Link to="/professionals">Volver a profesionales</Link>{!notFound && <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Reintentar</button>}</div>
        </div>
      </main>
    );
  }

  const name = getFullName(professional);
  const summaryName = getFullName(professionalForm);
  const nextActive = !account?.active;

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/" onClick={confirmLinkNavigation}>Portal Administrativo</Link><Icon name="chevron" size={16} />
        <Link to={returnPath} onClick={confirmLinkNavigation}>Profesionales</Link><Icon name="chevron" size={16} />
        <Link to={profilePath} state={{ returnPath }} onClick={confirmLinkNavigation}>{name}</Link><Icon name="chevron" size={16} />
        <span aria-current="page">Editar</span>
      </nav>

      <button className={styles.back} type="button" onClick={leaveToProfile}><Icon name="arrow-left" size={18} />Volver al perfil</button>
      <header className={styles.heading}><h1>Editar profesional</h1><p>Actualizá los datos profesionales y administrá su cuenta de acceso.</p></header>

      <section className={styles.professionalSummary} aria-label="Profesional seleccionado">
        <span className={styles.avatar} aria-hidden="true">{getInitials(professionalForm.first_name, professionalForm.last_name, "PR")}</span>
        <div className={styles.summaryIdentity}>
          <strong>{summaryName}</strong>
          <span>{[professionalForm.profession, professionalForm.specialty].filter(Boolean).join(" · ") || "Profesión no informada"}</span>
          <small>Documento {professionalForm.document_number || "no informado"} · Matrícula {professionalForm.license_number || "no informada"}</small>
        </div>
        <span className={`${styles.status} ${!account ? styles.unavailable : account.active ? styles.active : styles.inactive}`}>
          {!account ? "Cuenta no disponible" : account.active ? "Cuenta activa" : "Cuenta inactiva"}
        </span>
      </section>

      <div className={styles.columns}>
        <form ref={professionalFormRef} className={styles.primaryColumn} onSubmit={submitProfessional} noValidate>
          <section className={styles.formCard}>
            <div className={styles.cardHeading}><Icon name="professional" size={23} /><div><h2>Datos profesionales y de contacto</h2><p>Estos cambios se guardan únicamente en el registro profesional.</p></div></div>
            {professionalMessage && <div className={`${styles.message} ${styles[professionalMessage.type]}`} role={professionalMessage.type === "error" ? "alert" : "status"}>{professionalMessage.text}</div>}

            <fieldset><legend>Identidad</legend><div className={styles.grid}>
              <Field id="first_name" label="Nombre" required error={professionalErrors.first_name}>{(describedBy) => <input {...professionalControl("first_name", describedBy, { autoComplete: "given-name" })} />}</Field>
              <Field id="last_name" label="Apellido" required error={professionalErrors.last_name}>{(describedBy) => <input {...professionalControl("last_name", describedBy, { autoComplete: "family-name" })} />}</Field>
              <Field id="document_number" label="Documento" required error={professionalErrors.document_number} hint="Se guardará sin espacios, puntos ni guiones.">{(describedBy) => <input {...professionalControl("document_number", describedBy, { autoComplete: "off" })} />}</Field>
              <ReadOnly label="Fecha de incorporación">{professional.joined_at ? formatDate(professional.joined_at) : "No informada"}</ReadOnly>
            </div></fieldset>

            <fieldset><legend>Información profesional</legend><div className={styles.grid}>
              <Field id="profession" label="Profesión" required error={professionalErrors.profession}>{(describedBy) => <input {...professionalControl("profession", describedBy)} />}</Field>
              <Field id="specialty" label="Especialidad" error={professionalErrors.specialty}>{(describedBy) => <input {...professionalControl("specialty", describedBy)} />}</Field>
              <Field id="license_number" label="Matrícula" required error={professionalErrors.license_number}>{(describedBy) => <input {...professionalControl("license_number", describedBy)} />}</Field>
            </div></fieldset>

            <fieldset><legend>Contacto</legend><div className={styles.grid}>
              <Field id="email" label="Email profesional" required error={professionalErrors.email}>{(describedBy) => <input {...professionalControl("email", describedBy, { type: "email", autoComplete: "email" })} />}</Field>
              <Field id="phone" label="Teléfono" error={professionalErrors.phone}>{(describedBy) => <input {...professionalControl("phone", describedBy, { type: "tel", autoComplete: "tel" })} />}</Field>
            </div></fieldset>

            <fieldset><legend>Información administrativa</legend><div className={styles.singleGrid}>
              <Field id="administrative_notes" label="Notas administrativas" error={professionalErrors.administrative_notes} hint="No incluyas datos clínicos en este campo.">{(describedBy) => <textarea {...professionalControl("administrative_notes", describedBy, { rows: 5 })} />}</Field>
            </div></fieldset>

            <div className={styles.formActions}>
              <button className={styles.cancel} type="button" onClick={leaveToProfile} disabled={isSavingProfessional}>Cancelar</button>
              <button className={styles.submit} type="submit" disabled={!professionalDirty || isSavingProfessional}>{isSavingProfessional ? "Guardando datos profesionales…" : "Guardar información profesional"}</button>
            </div>
          </section>
        </form>

        <aside className={styles.secondaryColumn} aria-label="Cuenta de acceso">
          <form ref={accountFormRef} onSubmit={submitAccountEmail} noValidate>
            <section className={styles.formCard}>
              <div className={styles.cardHeading}><Icon name="shield" size={23} /><div><h2>Cuenta de acceso</h2><p>El email de acceso se utiliza para iniciar sesión. Puede ser diferente del email profesional de contacto.</p></div></div>
              {!account ? (
                <div className={styles.accountMissing} role="status"><Icon name="shield" size={28} /><strong>Cuenta relacionada ausente</strong><p>No se encontró una cuenta asociada. La información profesional puede seguir editándose, pero esta sección está bloqueada.</p></div>
              ) : (
                <>
                  {accountMessage && <div className={`${styles.message} ${styles[accountMessage.type]}`} role={accountMessage.type === "error" ? "alert" : "status"}>{accountMessage.text}</div>}
                  <Field id="account-email" label="Email de acceso" required error={accountErrors.email}>{(describedBy) => <input id="account-email" name="email" type="email" autoComplete="username" value={accountEmail} onChange={(event) => { setAccountEmail(event.target.value); setAccountErrors({}); setAccountMessage(null); }} aria-invalid={Boolean(accountErrors.email)} aria-describedby={describedBy} />}</Field>
                  <div className={styles.accountDetails}>
                    <ReadOnly label="Rol">Profesional</ReadOnly>
                    <ReadOnly label="Estado">{account.active ? "Activa" : "Inactiva"}</ReadOnly>
                    <ReadOnly label="Email verificado">{account.verified ? "Sí" : "No"}</ReadOnly>
                    <ReadOnly label="Último acceso">{account.last_login_at ? formatDateTime(account.last_login_at) : "Sin ingresos registrados"}</ReadOnly>
                    <ReadOnly label="Fecha de creación">{account.created ? formatDateTime(account.created) : "No informada"}</ReadOnly>
                  </div>
                  <div className={styles.formActions}>
                    <button className={styles.submit} type="submit" disabled={!accountDirty || isSavingAccount}>{isSavingAccount ? "Guardando email…" : "Guardar email de acceso"}</button>
                  </div>
                </>
              )}
            </section>
          </form>

          <section className={`${styles.formCard} ${styles.sensitiveCard}`}>
            <div className={styles.cardHeading}><Icon name="shield" size={23} /><div><h2>Estado de la cuenta</h2><p>Esta acción controla el acceso sin eliminar el usuario ni su historial.</p></div></div>
            {statusMessage && <div className={`${styles.message} ${styles[statusMessage.type]}`} role={statusMessage.type === "error" ? "alert" : "status"}>{statusMessage.text}</div>}
            {!account ? (
              <p className={styles.muted}>La acción no está disponible porque no existe una cuenta relacionada.</p>
            ) : (
              <div className={styles.sensitiveAction}>
                <div><strong>{account.active ? "La cuenta está activa" : "La cuenta está inactiva"}</strong><p>{account.active ? "El profesional puede iniciar sesión normalmente." : "El profesional no puede iniciar sesión, pero conserva sus credenciales."}</p></div>
                <button type="button" className={account.active ? styles.deactivate : styles.activate} onClick={() => setStatusDialogOpen(true)} disabled={isSavingStatus}>{account.active ? "Desactivar cuenta" : "Activar cuenta"}</button>
              </div>
            )}
          </section>
        </aside>
      </div>

      {statusDialogOpen && account && <ConfirmStatusDialog professionalName={summaryName} nextActive={nextActive} isSubmitting={isSavingStatus} onCancel={() => setStatusDialogOpen(false)} onConfirm={changeAccountStatus} />}
    </main>
  );
}
