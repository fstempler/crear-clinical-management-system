import { useAuth } from '../../hooks/useAuth'
import styles from './DashboardPage.module.scss'

export function DashboardPage() {
  const { user, logout, isAdmin } = useAuth()

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>CREAR</p>
        <h1>Bienvenido</h1>

        <p>
          Sesión iniciada como <strong>{user.email}</strong>
        </p>

        <p>
          Rol: <strong>{isAdmin ? 'Administración' : 'Profesional'}</strong>
        </p>

        <button type="button" onClick={logout}>
          Cerrar sesión
        </button>
      </section>
    </main>
  )
}