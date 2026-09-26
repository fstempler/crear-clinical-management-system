import { useEffect, useMemo, useState } from "react";
import { Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import { useProfessionalProfile } from "../../hooks/useProfessionalProfile";
import { getUserPresentation } from "../../utils/presentation";
import { NetworkStatusBanner } from "../system/NetworkStatusBanner";
import { DashboardHeader } from "./DashboardHeader";
import { DashboardSidebar } from "./DashboardSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import styles from "./AppLayout.module.scss";

export function AppLayout() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const profileState = useProfessionalProfile(user);
  const presentation = useMemo(
    () => getUserPresentation(user, profileState.data),
    [profileState.data, user],
  );
  useEffect(() => {
    const close = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);
  return (
    <div className={styles.shell}>
      <DashboardSidebar
        role={user.role}
        presentation={presentation}
        onLogout={logout}
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      {menuOpen && (
        <button
          className={styles.overlay}
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuOpen(false)}
        />
      )}
      <div className={styles.content}>
        <DashboardHeader
          presentation={presentation}
          onMenu={() => setMenuOpen(true)}
        />
        <NetworkStatusBanner />
        <Outlet context={{ profileState, presentation }} />
      </div>
      <MobileBottomNav role={user.role} />
    </div>
  );
}
