import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/crear-logo.png";
import { confirmPasswordReset, isRecoveryConnectionError, isRecoveryUnavailable } from "../../services/passwordRecoveryService";
import login from "./LoginPage.module.scss";
import styles from "./PasswordRecovery.module.scss";

function PasswordInput({ id, label, value, onChange, error, visible, onToggle, inputRef }) {
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={login.passwordField}>
        <input ref={inputRef} id={id} name={id} type={visible ? "text" : "password"} autoComplete="new-password" value={value} onChange={onChange} aria-invalid={Boolean(error)} aria-describedby={[id === "new-password" ? "password-requirements" : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined} />
        <button className={login.visibilityButton} type="button" onClick={onToggle} aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} aria-pressed={visible}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="3" /></svg>
        </button>
      </div>
      {error && <p id={`${id}-error`} className={styles.fieldError} role="alert">{error}</p>}
    </div>
  );
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token")?.trim();
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [invalidToken, setInvalidToken] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const passwordRef = useRef(null);
  const confirmationRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (savingRef.current || !token || invalidToken || success) return;
    const nextErrors = {};
    if (!password || !password.trim()) nextErrors.password = "Ingresá una nueva contraseña.";
    else if (password.length < 8) nextErrors.password = "Usá al menos 8 caracteres.";
    if (!confirmation || !confirmation.trim()) nextErrors.confirmation = "Confirmá la nueva contraseña.";
    else if (confirmation !== password) nextErrors.confirmation = "Las contraseñas no coinciden.";
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) {
      (nextErrors.password ? passwordRef : confirmationRef).current?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      await confirmPasswordReset(token, password, confirmation);
      logout();
      setPassword("");
      setConfirmation("");
      setSuccess(true);
    } catch (error) {
      if (isRecoveryConnectionError(error)) setSubmitError("No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.");
      else if (isRecoveryUnavailable(error)) setSubmitError("El servicio no está disponible en este momento. Intentá nuevamente más tarde.");
      else if ([400, 401, 403, 404].includes(error?.status)) setInvalidToken(true);
      else setSubmitError("No pudimos actualizar la contraseña. Intentá nuevamente.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <main className={login.page}>
      <section className={login.intro} aria-label="Presentación de CREAR">
        <img className={login.introLogo} src={logo} alt="CREAR" />
        <div className={login.introContent}><h2>Gestión clínica centrada en cada persona</h2><p>Un espacio seguro para acompañar, registrar y compartir el progreso de cada paciente.</p></div>
      </section>
      <section className={login.loginArea}>
        <img className={login.mobileLogo} src={logo} alt="CREAR" />
        <div className={login.card}>
          <header className={login.heading}><h1>Crear nueva contraseña</h1><p>Elegí una contraseña segura para acceder a tu cuenta.</p></header>
          {success ? (
            <div role="status" aria-live="polite"><p className={login.confirmation}>Tu contraseña fue actualizada. Ya podés iniciar sesión.</p><Link className={styles.primaryLink} to="/login" state={{ confirmation: "Contraseña actualizada. Ya podés iniciar sesión." }}>Ir al inicio de sesión</Link></div>
          ) : !token || invalidToken ? (
            <div role="alert"><p className={login.error}>Este enlace no es válido o ya venció.</p><Link className={styles.primaryLink} to="/recuperar-contrasena">Solicitar un nuevo enlace</Link></div>
          ) : (
            <form className={login.form} onSubmit={handleSubmit} noValidate>
              <PasswordInput inputRef={passwordRef} id="new-password" label="Nueva contraseña" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: "" })); setSubmitError(""); }} error={errors.password} visible={visible.password} onToggle={() => setVisible((current) => ({ ...current, password: !current.password }))} />
              <p id="password-requirements" className={styles.hint}>Usá al menos 8 caracteres. No puede estar formada solo por espacios.</p>
              <PasswordInput inputRef={confirmationRef} id="confirm-password" label="Confirmar contraseña" value={confirmation} onChange={(event) => { setConfirmation(event.target.value); setErrors((current) => ({ ...current, confirmation: "" })); setSubmitError(""); }} error={errors.confirmation} visible={visible.confirmation} onToggle={() => setVisible((current) => ({ ...current, confirmation: !current.confirmation }))} />
              {submitError && <p className={login.error} role="alert">{submitError}</p>}
              <button className={login.submitButton} type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar nueva contraseña"}</button>
            </form>
          )}
          <Link className={styles.backLink} to="/login">Volver al inicio de sesión</Link>
        </div>
      </section>
    </main>
  );
}
