import { NavLink } from "react-router";
import { Icon } from "../common/Icon";
import { getNavigation } from "./navigation";
import styles from "./DashboardSidebar.module.scss";
export function DashboardSidebar({
  role,
  presentation,
  onLogout,
  isOpen,
  onClose,
}) {
  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
      aria-label="Menú principal"
    >
      <div className={styles.brand}>
        <img src="/crear-logo.png" alt="CREAR" />
        <button type="button" onClick={onClose} aria-label="Cerrar menú">
          <Icon name="close" />
        </button>
      </div>
      <nav>
        {getNavigation(role).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => (isActive ? styles.active : undefined)}
          >
            <Icon name={item.icon} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className={styles.footer}>
        {role === "professional" && (
          <NavLink
            className={styles.newEvolution}
            to="/evolutions/new"
            onClick={onClose}
          >
            <Icon name="plus" />
            Nueva evolución
          </NavLink>
        )}
        <div className={styles.divider} />
        <NavLink to="/account" onClick={onClose}>
          <Icon name="account" />
          Mi cuenta
        </NavLink>
        <button type="button" onClick={onLogout}>
          <Icon name="logout" />
          Cerrar sesión
        </button>
        <div className={styles.profile}>
          <span>{presentation.initials}</span>
          <div>
            <strong>{presentation.name}</strong>
            <small>{presentation.description}</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
