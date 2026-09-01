import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../../hooks/useAuth'
import styles from './LoginPage.module.scss'

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const destination = location.state?.from?.pathname || '/'

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(email.trim(), password)
      navigate(destination, { replace: true })
    } catch {
      setError('El correo electrónico o la contraseña son incorrectos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <p>Cargando sesión...</p>
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>C</div>

          <div>
            <p className={styles.brandName}>CREAR</p>
            <p className={styles.brandDescription}>
              Plataforma de atención centralizada
            </p>
          </div>
        </div>

        <div className={styles.heading}>
          <h1>Iniciar sesión</h1>
          <p>Ingresá con tu cuenta institucional.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}