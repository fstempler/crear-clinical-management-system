import { BrowserRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AppLayout } from "./components/layouts/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { NewPatientPage } from "./pages/patients/NewPatientPage";
import { PatientProfilePage } from "./pages/patients/PatientProfilePage";
import { NewEvolutionPage } from "./pages/evolutions/NewEvolutionPage";
import { EvolutionDetailPage } from "./pages/evolutions/EvolutionDetailPage";
import { PlaceholderPage } from "./pages/placeholder/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />

          <Route path="patients" element={<PatientsPage />} />

          <Route path="patients/:patientId" element={<PatientProfilePage />} />

          <Route
            path="activity"
            element={<PlaceholderPage title="Actividad reciente" />}
          />

          <Route
            path="account"
            element={<PlaceholderPage title="Mi cuenta" />}
          />

          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route path="patients/new" element={<NewPatientPage />} />

            <Route
              path="professionals"
              element={<PlaceholderPage title="Profesionales" />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={["professional"]} />}>
            <Route
              path="evolutions/new"
              element={<NewEvolutionPage />}
            />
          </Route>

          <Route
            element={<RoleRoute allowedRoles={["admin", "professional"]} />}
          >
            <Route
              path="evolutions/:evolutionId"
              element={<EvolutionDetailPage />}
            />
          </Route>

          <Route
            path="*"
            element={<PlaceholderPage title="Página no encontrada" />}
          />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
