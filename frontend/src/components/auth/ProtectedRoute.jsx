import { Navigate, useLocation } from "react-router";
import { RouteLoadingFallback } from "../system/RouteLoadingFallback";
import { useAuth } from "../../hooks/useAuth";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, sessionStatus } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <RouteLoadingFallback />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search }, sessionExpired: sessionStatus === "expired" }} />;
  }

  return children;
}
