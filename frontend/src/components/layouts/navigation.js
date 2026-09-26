export function getNavigation(role) {
  const shared = [
    { to: "/", label: "Inicio", icon: "home", end: true },
    { to: "/patients", label: "Pacientes", icon: "patients" },
    { to: "/activity", label: "Actividad", icon: "activity" },
  ];
  if (role === "admin")
    shared.splice(2, 0,
      { to: "/professionals", label: "Profesionales", icon: "professional" },
      { to: "/audit", label: "Auditoría", icon: "shield" },
    );
  return shared;
}
