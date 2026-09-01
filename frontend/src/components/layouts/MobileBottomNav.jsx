import { NavLink } from "react-router";
import { Icon } from "../common/Icon";
import { getNavigation } from "./navigation";
import styles from "./MobileBottomNav.module.scss";
export function MobileBottomNav({ role }) {
  const items = getNavigation(role).slice(0, 4);
  return (
    <nav className={styles.nav} aria-label="Navegación móvil">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => (isActive ? styles.active : undefined)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
