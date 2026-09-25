import { useRef, useState } from "react";
import { Link } from "react-router";
import logo from "../../assets/crear-logo.png";
import { requestPasswordReset, isRecoveryConnectionError, isRecoveryUnavailable } from "../../services/passwordRecoveryService";
import login from "./LoginPage.module.scss";
import styles from "./PasswordRecovery.module.scss";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const emailRef = useRef(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (sendingRef.current) return;
    const normalized = email.trim().toLowerCase();
    setEmail(normalized);
    setFieldError("");
    setSubmitError("");
    setSuccess(false);
    if (!normalized || !EMAIL_PATTERN.test(normalized)) {
      setFieldError(normalized ? "Ingresá un email válido." : "Ingresá tu email.");
      emailRef.current?.focus();
      return;
    }
    sendingRef.current = true;
    setSending(true);
    try {
      await requestPasswordReset(normalized);
      setSuccess(true);
    } catch (error) {
      if (isRecoveryConnectionError(error)) setSubmitError("No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.");
      else if (isRecoveryUnavailable(error)) setSubmitError("El servicio no está disponible en este momento. Intentá nuevamente más tarde.");
      else setSuccess(true); // No revelar si existe la cuenta.
    } finally {
      sendingRef.current = false;
      setSending(false);
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
          <header className={login.heading}><h1>Recuperar contraseña</h1><p>Ingresá tu email para recibir un enlace y crear una nueva contraseña.</p></header>
          <form className={login.form} onSubmit={handleSubmit} noValidate>
            <label htmlFor="recovery-email">Email</label>
            <input ref={emailRef} id="recovery-email" name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(event) => { setEmail(event.target.value); setFieldError(""); setSubmitError(""); setSuccess(false); }} aria-invalid={Boolean(fieldError)} aria-describedby={fieldError ? "recovery-email-error" : undefined} disabled={sending} />
            {fieldError && <p id="recovery-email-error" className={login.error} role="alert">{fieldError}</p>}
            {submitError && <p className={login.error} role="alert">{submitError}</p>}
            {success && <p className={login.confirmation} role="status">Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.</p>}
            <button className={login.submitButton} type="submit" disabled={sending}>{sending ? "Enviando…" : success ? "Solicitar otro enlace" : "Enviar enlace"}</button>
          </form>
          <Link className={styles.backLink} to="/login">Volver al inicio de sesión</Link>
        </div>
      </section>
    </main>
  );
}
