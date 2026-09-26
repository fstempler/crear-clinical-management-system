import { useLocation } from "react-router";
import { Icon } from "../common/Icon";
import styles from "./DashboardHeader.module.scss";

const routeTitles = {
  "/": "Inicio",
  "/patients": "Pacientes",
  "/patients/new": "Nuevo paciente",
  "/professionals": "Profesionales",
  "/activity": "Actividad",
  "/account": "Mi cuenta",
  "/403": "Sin permisos",
  "/404": "Página no encontrada",
  "/error": "Error",
  "/offline": "Sin conexión",
  "/evolutions/new": "Nueva evolución",
};

function getCurrentTitle(pathname) {
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  if (pathname.startsWith("/patients/")) {
    return "Detalle del paciente";
  }

  if (pathname.startsWith("/evolutions/")) {
    return "Detalle de evolución";
  }

  return "Página no encontrada";
}

export function DashboardHeader({ presentation, onMenu }) {
  const { pathname } = useLocation();
  const currentTitle = getCurrentTitle(pathname);

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
        <strong>{currentTitle}</strong>
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