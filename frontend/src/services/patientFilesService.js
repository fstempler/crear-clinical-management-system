import { pb } from "../lib/pocketbase";

export const FILES_PER_PAGE = 12;
export const fileCategories = ["document", "image", "video", "audio", "other"];
export const fileCategoryLabels = { document: "Documento", image: "Imagen", video: "Video", audio: "Audio", other: "Otro" };
export const allowedFileTypes = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf",
  "audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a",
  "video/mp4", "video/quicktime", "video/webm",
]);
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value || ""); }

function buildFilter({ patientId, search, category, evolutionId, dateFrom, dateTo }) {
  const parts = ["patient = {:patientId}", "is_deleted = false"];
  const params = { patientId };
  const q = String(search || "").trim();
  if (q) { parts.push("(file ~ {:search} || description ~ {:search})"); params.search = q; }
  if (fileCategories.includes(category)) { parts.push("category = {:category}"); params.category = category; }
  if (evolutionId) { parts.push("evolution = {:evolutionId}"); params.evolutionId = evolutionId; }
  if (validDate(dateFrom)) { parts.push("created >= {:dateFrom}"); params.dateFrom = `${dateFrom} 00:00:00.000Z`; }
  if (validDate(dateTo)) { parts.push("created <= {:dateTo}"); params.dateTo = `${dateTo} 23:59:59.999Z`; }
  return pb.filter(parts.join(" && "), params);
}

export function getPatientFilesPage(options) {
  return pb.collection("patient_files").getList(options.page || 1, options.perPage || FILES_PER_PAGE, {
    filter: buildFilter(options),
    expand: "uploaded_by,evolution",
    sort: "-created,-id",
    requestKey: null,
  });
}

export function getEvolutionFiles(evolutionId) {
  return pb.collection("patient_files").getFullList({
    filter: pb.filter("evolution = {:evolutionId} && is_deleted = false", { evolutionId }),
    expand: "uploaded_by,evolution",
    sort: "-created,-id",
    requestKey: null,
  });
}

export function getPatientFileEvolutions(patientId) {
  return pb.collection("evolutions").getList(1, 100, {
    filter: pb.filter("patient = {:patientId}", { patientId }),
    fields: "id,title,evolution_type,evolution_date,created",
    sort: "-evolution_date,-created",
    requestKey: null,
  }).then((result) => result.items);
}

export function getAssignedPatientForStaff(staffUserId, patientId) {
  return pb
    .collection("patient_professionals")
    .getFirstListItem(
      pb.filter(
        "professional.staff_user = {:staffUserId} && patient = {:patientId} && active = true",
        { staffUserId, patientId },
      ),
      {
        expand: "patient",
        requestKey: null,
      },
    )
    .then((assignment) => assignment.expand?.patient || null);
}

export function createPatientFile({ evolution, user, file, category, description }) {
  const form = new FormData();
  form.set("patient", evolution.patient);
  form.set("evolution", evolution.id);
  form.set("uploaded_by", user.id);
  form.set("file", file);
  form.set("category", category);
  form.set("description", description.trim());
  form.set("is_deleted", "false");
  return pb.collection("patient_files").create(form, { expand: "uploaded_by,evolution", requestKey: null });
}

export function softDeletePatientFile(fileId) {
  return pb.collection("patient_files").update(fileId, {
    is_deleted: true,
    deleted_at: new Date().toISOString(),
  }, { requestKey: null });
}

export function getProtectedFileToken() { return pb.files.getToken(); }
export function getProtectedFileUrl(record, token, options = {}) {
  return record?.file && token ? pb.files.getURL(record, record.file, { ...options, token }) : "";
}

export function inferFileCategory(type) {
  if (type === "application/pdf") return "document";
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "other";
}

export function validateClinicalFile(file) {
  if (!file) return "Seleccioná un archivo.";
  if (!allowedFileTypes.has(file.type)) return "El formato del archivo no está admitido.";
  if (file.size > MAX_FILE_SIZE) return "El archivo supera el tamaño máximo de 100 MB.";
  return "";
}
