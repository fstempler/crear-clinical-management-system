export const patientStatus = {
  active: { label: "Activo", tone: "active" },
  inactive: { label: "Inactivo", tone: "inactive" },
  discharged: { label: "Dado de alta", tone: "discharged" },
};
export function getPatientStatus(status) {
  return patientStatus[status] || { label: "Sin estado", tone: "unknown" };
}
export function getInitials(firstName, lastName, fallback = "—") {
  const value = [firstName, lastName]
    .filter(Boolean)
    .map((part) => part.trim()[0])
    .join("")
    .toUpperCase();
  return value || fallback;
}
export function getFullName(record) {
  return (
    [record?.first_name, record?.last_name].filter(Boolean).join(" ").trim() ||
    "Paciente sin nombre"
  );
}
export const patientDocumentTypes = {
  dni: "DNI",
  passport: "Pasaporte",
  other: "Documento",
};

export function getPatientDocumentType(type) {
  return patientDocumentTypes[type] || "Documento";
}
export function getUserPresentation(user, profile) {
  if (user?.role === "admin")
    return {
      portal: "Portal Administrativo",
      name: "Administración",
      description: user.email,
      initials: "AD",
    };
  const name = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  const description = [profile?.profession, profile?.specialty]
    .filter(Boolean)
    .join(" · ");
  return {
    portal: "Portal Médico",
    name: name || "Profesional",
    description: description || user?.email,
    initials: getInitials(profile?.first_name, profile?.last_name, "PR"),
  };
}
