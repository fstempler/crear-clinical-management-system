import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { RoleRoute } from "./components/auth/RoleRoute";
import { AppLayout } from "./components/layouts/AppLayout";
import { RouteLoadingFallback } from "./components/system/RouteLoadingFallback";
import { AppErrorBoundary } from "./components/system/AppErrorBoundary";
import { LoginPage } from "./pages/auth/LoginPage";

const lazyNamed = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));
const ForgotPasswordPage = lazyNamed(() => import("./pages/auth/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = lazyNamed(() => import("./pages/auth/ResetPasswordPage"), "ResetPasswordPage");
const DashboardPage = lazyNamed(() => import("./pages/dashboard/DashboardPage"), "DashboardPage");
const PatientsPage = lazyNamed(() => import("./pages/patients/PatientsPage"), "PatientsPage");
const NewPatientPage = lazyNamed(() => import("./pages/patients/NewPatientPage"), "NewPatientPage");
const PatientProfilePage = lazyNamed(() => import("./pages/patients/PatientProfilePage"), "PatientProfilePage");
const PatientHistoryPage = lazyNamed(() => import("./pages/patients/PatientHistoryPage"), "PatientHistoryPage");
const PatientFilesPage = lazyNamed(() => import("./pages/patients/PatientFilesPage"), "PatientFilesPage");
const PatientAdministrationPage = lazyNamed(() => import("./pages/patients/PatientAdministrationPage"), "PatientAdministrationPage");
const NewEvolutionPage = lazyNamed(() => import("./pages/evolutions/NewEvolutionPage"), "NewEvolutionPage");
const EvolutionDetailPage = lazyNamed(() => import("./pages/evolutions/EvolutionDetailPage"), "EvolutionDetailPage");
const EditEvolutionPage = lazyNamed(() => import("./pages/evolutions/EditEvolutionPage"), "EditEvolutionPage");
const ProfessionalsPage = lazyNamed(() => import("./pages/professionals/ProfessionalsPage"), "ProfessionalsPage");
const ProfessionalProfilePage = lazyNamed(() => import("./pages/professionals/ProfessionalProfilePage"), "ProfessionalProfilePage");
const EditProfessionalPage = lazyNamed(() => import("./pages/professionals/EditProfessionalPage"), "EditProfessionalPage");
const NewProfessionalPage = lazyNamed(() => import("./pages/professionals/NewProfessionalPage"), "NewProfessionalPage");
const ProfessionalAssignmentsPage = lazyNamed(() => import("./pages/professionals/ProfessionalAssignmentsPage"), "ProfessionalAssignmentsPage");
const AccountPage = lazyNamed(() => import("./pages/account/AccountPage"), "AccountPage");
const ActivityPage = lazyNamed(() => import("./pages/activity/ActivityPage"), "ActivityPage");
const AuditPage = lazyNamed(() => import("./pages/audit/AuditPage"), "AuditPage");
const ForbiddenPage = lazyNamed(() => import("./pages/system/ForbiddenPage"), "ForbiddenPage");
const NotFoundPage = lazyNamed(() => import("./pages/system/NotFoundPage"), "NotFoundPage");
const SystemErrorPage = lazyNamed(() => import("./pages/system/SystemErrorPage"), "SystemErrorPage");
const OfflinePage = lazyNamed(() => import("./pages/system/OfflinePage"), "OfflinePage");

function App() {
  return <BrowserRouter><AppErrorBoundary><Suspense fallback={<RouteLoadingFallback />}><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
    <Route path="/restablecer-contrasena" element={<ResetPasswordPage />} />
    <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="patients" element={<PatientsPage />} />
      <Route path="patients/:patientId" element={<PatientProfilePage />} />
      <Route path="activity" element={<ActivityPage />} />
      <Route path="account" element={<AccountPage />} />
      <Route path="403" element={<ForbiddenPage />} />
      <Route path="404" element={<NotFoundPage />} />
      <Route path="error" element={<SystemErrorPage />} />
      <Route path="offline" element={<OfflinePage />} />
      <Route element={<RoleRoute allowedRoles={["admin"]} />}>
        <Route path="audit" element={<AuditPage />} />
        <Route path="patients/new" element={<NewPatientPage />} />
        <Route path="patients/:patientId/administration" element={<PatientAdministrationPage />} />
        <Route path="professionals" element={<ProfessionalsPage />} />
        <Route path="professionals/new" element={<NewProfessionalPage />} />
        <Route path="professionals/:professionalId" element={<ProfessionalProfilePage />} />
        <Route path="professionals/:professionalId/edit" element={<EditProfessionalPage />} />
        <Route path="professionals/:professionalId/assignments" element={<ProfessionalAssignmentsPage />} />
      </Route>
      <Route element={<RoleRoute allowedRoles={["professional"]} />}>
        <Route path="evolutions/new" element={<NewEvolutionPage />} />
        <Route path="evolutions/:evolutionId/edit" element={<EditEvolutionPage />} />
      </Route>
      <Route element={<RoleRoute allowedRoles={["admin", "professional"]} />}>
        <Route path="patients/:patientId/history" element={<PatientHistoryPage />} />
        <Route path="patients/:patientId/files" element={<PatientFilesPage />} />
        <Route path="evolutions/:evolutionId" element={<EvolutionDetailPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></Suspense></AppErrorBoundary></BrowserRouter>;
}
export default App;
