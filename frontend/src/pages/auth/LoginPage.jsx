import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import logo from "../../assets/crear-logo.png";
import styles from "./LoginPage.module.scss";

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const destination = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch {
      setError("El correo electrónico o la contraseña son incorrectos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Cargando sesión...</p>;
  if (isAuthenticated) {
    return <Navigate to={destination} replace />;
  }

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-label="Presentación de CREAR">
        <img className={styles.introLogo} src={logo} alt="CREAR" />
        <div className={styles.introContent}>
          <h2>Gestión clínica centrada en cada persona</h2>
          <p>
            Un espacio seguro para acompañar, registrar y compartir el progreso
            de cada paciente.
          </p>
        </div>
      </section>

      <section className={styles.loginArea}>
        <img className={styles.mobileLogo} src={logo} alt="CREAR" />
        <div className={styles.card}>
          <header className={styles.heading}>
            <h1>Iniciar sesión</h1>
            <p>Ingresá tus datos para acceder a la plataforma</p>
          </header>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className={styles.passwordHeading}>
              <label htmlFor="password">Contraseña</label>
              <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
            </div>
            <div className={styles.passwordField}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button
                className={styles.visibilityButton}
                type="button"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                onClick={() => setShowPassword((isVisible) => !isVisible)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>

            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
              />
              <span>Recordarme</span>
            </label>

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <button
              className={styles.submitButton}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className={styles.securityMessage}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 3 5 6v5c0 4.8 2.9 8.4 7 10 4.1-1.6 7-5.2 7-10V6l-7-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            <span>Acceso seguro y protegido</span>
          </div>
        </div>
      </section>
    </main>
  );
}
