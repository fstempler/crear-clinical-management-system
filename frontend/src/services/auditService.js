import { pb } from "../lib/pocketbase";

export const AUDIT_PAGE_SIZE = 20;
export const actionLabels = {
  login: "Inicio de sesión", view: "Consulta", create: "Creación", update: "Modificación",
  activate: "Activación", deactivate: "Desactivación", assign: "Asignación", unassign: "Desasignación",
  upload: "Carga de archivo", download: "Descarga de archivo", soft_delete: "Eliminación lógica",
  password_change: "Cambio de contraseña",
};
export const entityLabels = {
  session: "Sesión", staff_user: "Usuario", professional: "Profesional", patient: "Paciente",
  assignment: "Asignación", evolution: "Evolución clínica", patient_file: "Archivo clínico", account: "Cuenta",
};
export const fieldLabels = {
  document_number: "Documento", first_name: "Nombre", last_name: "Apellido", birth_date: "Fecha de nacimiento",
  gender: "Género", phone: "Teléfono", email: "Correo electrónico", address: "Dirección",
  status: "Estado", administrative_notes: "Notas administrativas", profession: "Profesión",
  specialty: "Especialidad", license_number: "Matrícula", title: "Título", evolution_type: "Tipo de evolución",
  content: "Registro clínico", description: "Descripción", category: "Categoría", active: "Estado activo",
  city: "Ciudad", province: "Provincia", postal_code: "Código postal", health_insurance: "Obra social",
  health_insurance_number: "Número de afiliado", emergency_contact_name: "Contacto de emergencia",
  emergency_contact_phone: "Teléfono de emergencia", role: "Rol", assigned_at: "Fecha de asignación",
  unassigned_at: "Fecha de desasignación", is_deleted: "Eliminación lógica", deleted_at: "Fecha de eliminación",
};
export const readable = (value, labels) => labels[value] || String(value || "Sin especificar").replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());

export async function getAuditLogs({ page = 1, q = "", action = "", entity = "", role = "", from = "", to = "" } = {}) {
  const parts = [];
  const args = {};
  if (q.trim()) {
    parts.push("(actor_label ~ {:search} || summary ~ {:search} || entity_id ~ {:search})");
    args.search = q.trim().slice(0, 100);
  }
  if (action) { parts.push("action = {:action}"); args.action = action; }
  if (entity) { parts.push("entity_type = {:entity}"); args.entity = entity; }
  if (role) { parts.push("actor_role = {:role}"); args.role = role; }
  // PocketBase date fields are stored as UTC. Convert the browser's local day boundaries
  // to UTC; the exclusive upper bound includes every instant of the selected end day.
  if (from) { parts.push("created >= {:from}"); args.from = new Date(`${from}T00:00:00`).toISOString(); }
  if (to) {
    const [year, month, day] = to.split("-").map(Number);
    args.to = new Date(year, month - 1, day + 1).toISOString();
    parts.push("created < {:to}");
  }
  return pb.collection("audit_logs").getList(page, AUDIT_PAGE_SIZE, {
    sort: "-created", expand: "actor,patient", filter: parts.length ? pb.filter(parts.join(" && "), args) : "", requestKey: null,
  });
}

export function auditErrorMessage(error) {
  if ([401, 403].includes(error?.status)) return "No tenés permiso para consultar la auditoría.";
  if (error?.status === 0 || error?.name === "TypeError" || (typeof navigator !== "undefined" && !navigator.onLine))
    return "No pudimos conectarnos con el sistema. Revisá tu conexión e intentá nuevamente.";
  return "No pudimos cargar los eventos de auditoría. Intentá nuevamente.";
}
