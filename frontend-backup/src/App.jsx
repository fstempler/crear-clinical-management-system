import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AppLayout } from "./components/layouts/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { NewPatientPage } from "./pages/patients/NewPatientPage";
import { PlaceholderPage } from "./pages/placeholder/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="patients" element={<PatientsPage />} />
          <Route
            path="patients/:patientId"
            element={<PlaceholderPage title="Detalle del paciente" />}
          />
          <Route
            path="activity"
            element={<PlaceholderPage title="Actividad reciente" />}
          />
          <Route
            path="account"
            element={<PlaceholderPage title="Mi cuenta" />}
          />
          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route
              path="patients/new"
              element={<NewPatientPage />}
            />
            <Route
              path="professionals"
              element={<PlaceholderPage title="Profesionales" />}
            />
          </Route>
          <Route element={<RoleRoute allowedRoles={["professional"]} />}>
            <Route
              path="evolutions/new"
              element={<PlaceholderPage title="Nueva evolución" />}
            />
          </Route>

          <Route
            element={<RoleRoute allowedRoles={["admin", "professional"]} />}
          >
            <Route
              path="evolutions/:evolutionId"
              element={<PlaceholderPage title="Detalle de evolución" />}
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
