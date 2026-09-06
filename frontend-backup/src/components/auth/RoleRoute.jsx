import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();
  return allowedRoles.includes(user?.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
}
