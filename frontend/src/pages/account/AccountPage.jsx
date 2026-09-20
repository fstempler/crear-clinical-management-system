import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Icon } from "../../components/common/Icon";
import { SectionState } from "../../components/dashboard/SectionState";
import { useAuth } from "../../hooks/useAuth";
import { useAccount } from "../../hooks/useAccount";
import { pb } from "../../lib/pocketbase";
import {
  isConnectionError,
  isSessionError,
  isWrongPasswordError,
} from "../../services/accountService";
import { formatDate, formatDateTime } from "../../utils/date";
import { getInitials, getUserPresentation } from "../../utils/presentation";
import styles from "./AccountPage.module.scss";

const EMPTY_VALUE = "Sin información registrada";
const INITIAL_PASSWORDS = {
  currentPassword: "",
  newPassword: "",
  passwordConfirmation: "",
};

function roleLabel(role) {
  return role === "admin" ? "Administración" : role === "professional" ? "Profesional" : "Sin rol";
}

function professionalName(profile) {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() || "Profesional";
}

function Value({ children }) {
  return children === null || children === undefined || children === ""
    ? <span className={styles.muted}>{EMPTY_VALUE}</span>
    : children;
}

function Detail({ label, children }) {
  return <div><dt>{label}</dt><dd><Value>{children}</Value></dd></div>;
}

function Card({ title, icon, children }) {
  return (
    <section className={styles.card}>
      <h2><Icon name={icon} size={23} />{title}</h2>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

function PasswordField({ id, label, value, error, visible, onChange, onToggle }) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <div className={styles.passwordControl}>
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          autoComplete={id === "currentPassword" ? "current-password" : "new-password"}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>
      {error && <span className={styles.fieldError} id={errorId}>{error}</span>}
    </div>
  );
}

function validatePasswords(values) {
  const errors = {};
  if (!values.currentPassword) errors.currentPassword = "Ingresá tu contraseña actual.";
  if (!values.newPassword) errors.newPassword = "Ingresá una nueva contraseña.";
  else if (values.newPassword.length < 8) errors.newPassword = "La nueva contraseña debe tener al menos 8 caracteres.";
  if (!values.passwordConfirmation) errors.passwordConfirmation = "Confirmá la nueva contraseña.";
  else if (values.passwordConfirmation !== values.newPassword) errors.passwordConfirmation = "La confirmación no coincide con la nueva contraseña.";
  if (values.currentPassword && values.newPassword === values.currentPassword) {
    errors.newPassword = "La nueva contraseña debe ser diferente de la actual.";
  }
  return errors;
}

export function AccountPage() {
  const { user } = useAuth();
  const accountState = useAccount(user);
  const navigate = useNavigate();
  const formRef = useRef(null);
  const [passwords, setPasswords] = useState(INITIAL_PASSWORDS);
  const [visible, setVisible] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!accountState.accountError || accountState.accountError?.isAbort) return;
    if (isSessionError(accountState.accountError)) {
      pb.authStore.clear();
      navigate("/login", {
        replace: true,
        state: { confirmation: "Tu sesión venció. Iniciá sesión nuevamente." },
      });
    }
  }, [accountState.accountError, navigate]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setPasswords((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
    if (submitError) setSubmitError("");
  };

  const focusFirstError = (nextErrors) => {
    const firstField = Object.keys(nextErrors)[0];
    requestAnimationFrame(() => formRef.current?.elements.namedItem(firstField)?.focus());
  };

  const handlePasswordChange = async (event) => {
    event.preventDefault();
    if (accountState.isUpdatingPassword) return;
    const cleaned = Object.fromEntries(
      Object.entries(passwords).map(([key, value]) => [key, value.trim()]),
    );
    const nextErrors = validatePasswords(cleaned);
    setPasswords(cleaned);
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length) {
      focusFirstError(nextErrors);
      return;
    }

    try {
      await accountState.updatePassword(cleaned);
      setPasswords(INITIAL_PASSWORDS);
      pb.authStore.clear();
      navigate("/login", {
        replace: true,
        state: { confirmation: "Tu contraseña fue actualizada. Iniciá sesión nuevamente." },
      });
    } catch (error) {
      if (error?.isAbort) return;
      if (isWrongPasswordError(error)) {
        const passwordErrors = { currentPassword: "La contraseña actual no es correcta." };
        setErrors(passwordErrors);
        setSubmitError("No pudimos verificar tu contraseña actual.");
        focusFirstError(passwordErrors);
      } else if (isSessionError(error)) {
        pb.authStore.clear();
        navigate("/login", {
          replace: true,
          state: { confirmation: "Tu sesión venció. Iniciá sesión nuevamente." },
        });
      } else if (isConnectionError(error)) {
        setSubmitError("No pudimos conectarnos. Revisá tu conexión e intentá nuevamente.");
      } else {
        const passwordData = error?.response?.data?.password || error?.data?.data?.password;
        if (/length|character|8/i.test(`${passwordData?.message || ""} ${passwordData?.code || ""}`)) {
          const passwordErrors = { newPassword: "La nueva contraseña debe tener al menos 8 caracteres." };
          setErrors(passwordErrors);
          focusFirstError(passwordErrors);
        } else {
          setSubmitError("No pudimos actualizar la contraseña. Intentá nuevamente.");
        }
      }
    }
  };

  if (accountState.isAccountLoading) {
    return <main className={styles.page}><SectionState type="loading" message="Cargando cuenta…" /></main>;
  }

  if (accountState.accountError) {
    if (isSessionError(accountState.accountError)) return null;
    return (
      <main className={styles.page}>
        <div className={styles.state} role="alert">
          <Icon name="retry" size={38} />
          <h1>No pudimos cargar tu cuenta</h1>
          <p>{isConnectionError(accountState.accountError) ? "Revisá tu conexión e intentá nuevamente." : "Ocurrió un error inesperado al consultar la cuenta."}</p>
          <button type="button" onClick={accountState.retry}>Reintentar</button>
        </div>
      </main>
    );
  }

  const account = accountState.account;
  const profile = accountState.profile;
  const presentation = getUserPresentation(account, profile);
  const displayName = profile ? professionalName(profile) : presentation.name;
  const initials = profile
    ? getInitials(profile.first_name, profile.last_name, "PR")
    : (account.email?.trim()?.[0] || "A").toUpperCase();

  return (
    <main className={styles.page}>
      <nav className={styles.breadcrumb} aria-label="Migas de pan">
        <Link to="/">{presentation.portal}</Link><Icon name="chevron" size={16} />
        <strong aria-current="page">Mi cuenta</strong>
      </nav>

      <header className={styles.heading}>
        <h1>Mi cuenta</h1>
        <p>Consultá tus datos de acceso y administrá la seguridad de tu cuenta.</p>
      </header>

      <section className={styles.accountHeader} aria-label="Cuenta autenticada">
        <span className={styles.avatar} aria-hidden="true">{initials}</span>
        <div className={styles.identity}>
          <h2>{displayName}</h2>
          <p>{account.email}</p>
          <div className={styles.badges}>
            <span className={styles.roleBadge}>{roleLabel(account.role)}</span>
            <span className={`${styles.statusBadge} ${account.active ? styles.active : styles.inactive}`}>
              {account.active ? "Cuenta activa" : "Cuenta inactiva"}
            </span>
          </div>
        </div>
      </section>

      {!account.active && (
        <div className={styles.warning} role="alert">
          Esta cuenta está inactiva. Comunicate con Administración para recuperar el acceso.
        </div>
      )}

      <div className={styles.columns}>
        <div className={styles.informationColumn}>
          <Card title="Resumen de cuenta" icon="account">
            <dl className={styles.details}>
              <Detail label="Email de acceso">{account.email}</Detail>
              <Detail label="Rol">{roleLabel(account.role)}</Detail>
              <Detail label="Estado">{account.active ? "Activa" : "Inactiva"}</Detail>
              <Detail label="Email verificado">{account.verified ? "Sí" : "No"}</Detail>
              <Detail label="Último acceso">{account.last_login_at ? formatDateTime(account.last_login_at) : "Sin accesos registrados"}</Detail>
              <Detail label="Cuenta creada">{account.created ? formatDateTime(account.created) : ""}</Detail>
              {account.updated && account.updated !== account.created && (
                <Detail label="Última actualización">{formatDateTime(account.updated)}</Detail>
              )}
            </dl>
          </Card>

          {account.role === "professional" && (
            <Card title="Perfil profesional" icon="professional">
              {accountState.isProfileLoading ? (
                <SectionState type="loading" message="Cargando perfil profesional…" />
              ) : accountState.profileError ? (
                <div className={styles.localError} role="alert">
                  <div><strong>No pudimos cargar tu perfil profesional.</strong><p>La información de tu cuenta continúa disponible.</p></div>
                  <button type="button" onClick={accountState.retry}>Reintentar</button>
                </div>
              ) : !profile ? (
                <div className={styles.notice} role="status">
                  No encontramos un perfil profesional relacionado con esta cuenta. Comunicate con Administración.
                </div>
              ) : (
                <>
                  <dl className={styles.details}>
                    <Detail label="Nombre completo">{professionalName(profile)}</Detail>
                    <Detail label="Documento">{profile.document_number}</Detail>
                    <Detail label="Profesión">{profile.profession}</Detail>
                    <Detail label="Especialidad">{profile.specialty}</Detail>
                    <Detail label="Matrícula">{profile.license_number}</Detail>
                    <Detail label="Email profesional">{profile.email}</Detail>
                    <Detail label="Teléfono">{profile.phone}</Detail>
                    <Detail label="Fecha de incorporación">{profile.joined_at ? formatDate(profile.joined_at) : ""}</Detail>
                  </dl>
                  <p className={styles.adminNotice}>Para modificar tus datos profesionales, comunicate con Administración.</p>
                </>
              )}
            </Card>
          )}
        </div>

        <aside className={styles.securityColumn} aria-label="Seguridad de la cuenta">
          <Card title="Cambiar contraseña" icon="shield">
            <p className={styles.securityIntro}>Después del cambio deberás iniciar sesión nuevamente con tu nueva contraseña.</p>
            <form ref={formRef} className={styles.form} onSubmit={handlePasswordChange} noValidate>
              <PasswordField id="currentPassword" label="Contraseña actual" value={passwords.currentPassword} error={errors.currentPassword} visible={visible.currentPassword} onChange={updateField} onToggle={() => setVisible((current) => ({ ...current, currentPassword: !current.currentPassword }))} />
              <PasswordField id="newPassword" label="Nueva contraseña" value={passwords.newPassword} error={errors.newPassword} visible={visible.newPassword} onChange={updateField} onToggle={() => setVisible((current) => ({ ...current, newPassword: !current.newPassword }))} />
              <PasswordField id="passwordConfirmation" label="Confirmar nueva contraseña" value={passwords.passwordConfirmation} error={errors.passwordConfirmation} visible={visible.passwordConfirmation} onChange={updateField} onToggle={() => setVisible((current) => ({ ...current, passwordConfirmation: !current.passwordConfirmation }))} />
              <p className={styles.passwordHint}>Usá al menos 8 caracteres.</p>
              {submitError && <div className={styles.formError} role="alert" aria-live="assertive">{submitError}</div>}
              <button className={styles.submitButton} type="submit" disabled={accountState.isUpdatingPassword || !account.active}>
                {accountState.isUpdatingPassword ? "Actualizando…" : "Actualizar contraseña"}
              </button>
            </form>
          </Card>
        </aside>
      </div>
    </main>
  );
}
