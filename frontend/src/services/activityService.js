import { pb } from "../lib/pocketbase";
import { evolutionTypeLabels } from "./evolutionsService";
import { fileCategoryLabels } from "./patientFilesService";
import { getFullName } from "../utils/presentation";

const BATCH = 8;
export const ACTIVITY_PAGE_SIZE = 12;
export const activityTypes = ["evolutions", "files", "patients", "professionals", "assignments"];

// This is a snapshot of each visible record's latest state, not an audit trail.
// There is no audit_logs collection: earlier edits, actors for administrative changes,
// deleted files and the difference between first assignment and reactivation are unknown.
const definitions = {
  evolutions: { collection: "evolutions", sort: "-updated,-id", expand: "patient,author", date: "updated", search: ["title", "patient.first_name", "patient.last_name", "patient.document_number"] },
  files: { collection: "patient_files", sort: "-created,-id", expand: "patient,evolution,uploaded_by", date: "created", search: ["file", "description", "patient.first_name", "patient.last_name", "patient.document_number"] },
  patients: { collection: "patients", sort: "-updated,-id", date: "updated", search: ["first_name", "last_name", "document_number"] },
  professionals: { collection: "professionals", sort: "-updated,-id", expand: "staff_user", date: "updated", search: ["first_name", "last_name", "profession", "specialty"] },
  assignments: { collection: "patient_professionals", sort: "-updated,-id", expand: "patient,professional,professional.staff_user", date: "updated", search: ["patient.first_name", "patient.last_name", "patient.document_number", "professional.first_name", "professional.last_name"] },
};
const name = (record) => record ? getFullName(record) : "";
const changed = (record) => new Date(record.updated).getTime() - new Date(record.created).getTime() > 1000;
const accessible = (record) => Boolean(record?.id);

function normalize(type, record, role) {
  const patient = type === "patients" ? record : record.expand?.patient;
  const professional = type === "professionals" ? record : record.expand?.professional;
  const patientName = name(patient);
  const professionalName = name(professional);
  const base = {
    key: `${definitions[type].collection}:${record.id}`, type, timestamp: record[definitions[type].date],
    patient: patientName, professional: professionalName, sourceCollection: definitions[type].collection,
    sourceId: record.id, destination: null, description: "",
  };
  if (type === "evolutions") return {
    ...base, title: changed(record) ? "Se actualizó una evolución" : "Se registró una nueva evolución",
    description: [record.title, evolutionTypeLabels[record.evolution_type], patientName && `Paciente: ${patientName}`].filter(Boolean).join(" · "),
    destination: accessible(record.expand?.patient) ? `/evolutions/${record.id}` : null,
  };
  if (type === "files") return {
    ...base, title: "Se agregó un archivo clínico",
    description: [record.description || record.file, fileCategoryLabels[record.category], patientName && `Paciente: ${patientName}`].filter(Boolean).join(" · "),
    destination: accessible(patient) ? `/patients/${patient.id}/files` : null,
  };
  if (type === "patients") return {
    ...base, title: changed(record) ? "Se actualizaron los datos del paciente" : "Se registró un nuevo paciente",
    description: [patientName, record.document_number && `DNI: ${record.document_number}`].filter(Boolean).join(" · "),
    destination: `/patients/${record.id}`,
  };
  if (type === "professionals") return {
    ...base, title: changed(record) ? "Se actualizó el perfil profesional" : "Se registró un nuevo profesional",
    description: [name(record), record.profession, record.specialty].filter(Boolean).join(" · "),
    destination: `/professionals/${record.id}`,
  };
  const ended = !record.active && Boolean(record.unassigned_at);
  return {
    ...base, timestamp: ended ? record.unassigned_at : record.assigned_at || record.created,
    title: ended ? "Finalizó una asignación profesional" : "Se asignó un paciente al profesional",
    description: [patientName && `Paciente: ${patientName}`, professionalName && `Profesional: ${professionalName}`].filter(Boolean).join(" · "),
    destination: role === "admin" && accessible(professional) ? `/professionals/${professional.id}/assignments` : null,
  };
}

function filterFor(type, { q, from, to, role, userId }) {
  const def = definitions[type];
  const parts = [];
  const args = {};
  if (type === "files") parts.push("is_deleted = false");
  if (type === "assignments") parts.push('(active = true || unassigned_at != "")');
  if (type === "assignments" && role === "professional") {
    parts.push("professional.staff_user = {:userId}"); args.userId = userId;
  }
  if (q) {
    parts.push(`(${def.search.map((field) => `${field} ~ {:q}`).join(" || ")})`);
    args.q = q.trim().slice(0, 100);
  }
  if (from) { parts.push(`${def.date} >= {:from}`); args.from = `${from} 03:00:00.000Z`; }
  if (to) { parts.push(`${def.date} <= {:to}`); args.to = `${new Date(Date.parse(`${to}T12:00:00Z`) + 86400000).toISOString().slice(0, 10)} 02:59:59.999Z`; }
  return parts.length ? pb.filter(parts.join(" && "), args) : "";
}

export function createActivityCursor(role, type) {
  const allowed = role === "admin" ? activityTypes : ["evolutions", "files", "assignments"];
  const sources = (type && allowed.includes(type) ? [type] : type ? [] : allowed);
  return Object.fromEntries(sources.map((source) => [source, { page: 1, buffer: [], exhausted: false, error: null }]));
}

const compare = (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime() || a.key.localeCompare(b.key);

export async function loadActivityPage(cursor, filters, role, userId) {
  const next = Object.fromEntries(Object.entries(cursor).map(([key, value]) => [key, { ...value, buffer: [...value.buffer] }]));
  const emitted = [];
  // A source only advances after its current batch is consumed. The head of every
  // source must be known before selecting the next newest record globally.
  while (emitted.length < ACTIVITY_PAGE_SIZE) {
    const missing = Object.entries(next).filter(([, state]) => !state.exhausted && !state.error && !state.buffer.length);
    if (missing.length) {
      const results = await Promise.allSettled(missing.map(([type, state]) => {
        const def = definitions[type];
        return pb.collection(def.collection).getList(state.page, BATCH, {
          sort: def.sort, expand: def.expand, filter: filterFor(type, { ...filters, role, userId }), requestKey: null,
        });
      }));
      results.forEach((result, index) => {
        const [type, state] = missing[index];
        if (result.status === "rejected") { state.error = result.reason; return; }
        const page = result.value;
        state.buffer = page.items.map((item) => normalize(type, item, role)).sort(compare);
        state.page += 1;
        state.exhausted = page.page >= page.totalPages || page.items.length === 0;
      });
    }
    const heads = Object.values(next).filter((state) => state.buffer.length).map((state) => state.buffer[0]).sort(compare);
    if (!heads.length) break;
    const selected = heads[0];
    next[selected.type].buffer.shift();
    if (!emitted.some((item) => item.key === selected.key)) emitted.push(selected);
  }
  return { cursor: next, items: emitted, hasMore: Object.values(next).some((state) => state.buffer.length || !state.exhausted && !state.error),
    failures: Object.entries(next).filter(([, state]) => state.error).map(([type, state]) => ({ type, error: state.error })) };
}

export function activityErrorMessage(error) {
  if ([401, 403].includes(error?.status)) return "No tenés permiso para consultar esta actividad.";
  if (error?.status === 0 || error?.name === "TypeError") return "No pudimos conectarnos con el sistema. Revisá tu conexión e intentá nuevamente.";
  return "No pudimos cargar toda la actividad. Intentá nuevamente.";
}
