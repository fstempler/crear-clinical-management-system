import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../hooks/useAuth";

export function RoleRoute({ allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();
  return allowedRoles.includes(user?.role) ? (
    <Outlet />
  ) : (
    <Navigate to="/403" replace state={{ from: { pathname: location.pathname } }} />
  );
}
