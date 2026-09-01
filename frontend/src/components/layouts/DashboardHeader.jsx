import { Icon } from "../common/Icon";
import styles from "./DashboardHeader.module.scss";
export function DashboardHeader({ presentation, onMenu }) {
  return (
    <header className={styles.header}>
      <button
        className={styles.menu}
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
      >
        <Icon name="menu" />
      </button>
      <div className={styles.breadcrumb}>
        {presentation.portal}
        <span>/</span>
        <strong>Inicio</strong>
      </div>
      <img src="/crear-logo.png" alt="CREAR" />
      <button
        className={styles.notifications}
        type="button"
        disabled
        title="Notificaciones no disponibles"
        aria-label="Notificaciones no disponibles"
      >
        <span aria-hidden="true">●</span>
      </button>
      <span className={styles.avatar} aria-label={presentation.name}>
        {presentation.initials}
      </span>
    </header>
  );
}
