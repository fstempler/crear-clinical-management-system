import { BrowserRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AppLayout } from "./components/layouts/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PatientsPage } from "./pages/patients/PatientsPage";
import { NewPatientPage } from "./pages/patients/NewPatientPage";
import { PatientProfilePage } from "./pages/patients/PatientProfilePage";
import { PatientHistoryPage } from "./pages/patients/PatientHistoryPage";
import { PatientFilesPage } from "./pages/patients/PatientFilesPage";
import { PatientAdministrationPage } from "./pages/patients/PatientAdministrationPage";
import { NewEvolutionPage } from "./pages/evolutions/NewEvolutionPage";
import { EvolutionDetailPage } from "./pages/evolutions/EvolutionDetailPage";
import { EditEvolutionPage } from "./pages/evolutions/EditEvolutionPage";
import { ProfessionalsPage } from "./pages/professionals/ProfessionalsPage";
import { ProfessionalProfilePage } from "./pages/professionals/ProfessionalProfilePage";
import { PlaceholderPage } from "./pages/placeholder/PlaceholderPage";
import { EditProfessionalPage } from "./pages/professionals/EditProfessionalPage";
import { NewProfessionalPage } from "./pages/professionals/NewProfessionalPage";

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
              path="patients/:patientId/administration"
              element={<PatientAdministrationPage />}
            />

            <Route path="professionals" element={<ProfessionalsPage />} />

            <Route path="professionals/new" element={<NewProfessionalPage />} />

            <Route
              path="professionals/:professionalId"
              element={<ProfessionalProfilePage />}
            />

            <Route
              path="professionals/:professionalId/edit"
              element={<EditProfessionalPage />}
            />
          </Route>

          <Route element={<RoleRoute allowedRoles={["professional"]} />}>
            <Route path="evolutions/new" element={<NewEvolutionPage />} />

            <Route
              path="evolutions/:evolutionId/edit"
              element={<EditEvolutionPage />}
            />
          </Route>

          <Route
            element={<RoleRoute allowedRoles={["admin", "professional"]} />}
          >
            <Route
              path="patients/:patientId/history"
              element={<PatientHistoryPage />}
            />

            <Route
              path="patients/:patientId/files"
              element={<PatientFilesPage />}
            />

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
