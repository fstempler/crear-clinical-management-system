import { pb } from "../lib/pocketbase";

export async function getAssignedPatients(professionalId) {
  return pb.collection("patient_professionals").getFullList({
    filter: pb.filter("professional = {:professionalId} && active = true", { professionalId }),
    expand: "patient",
    sort: "patient.last_name,patient.first_name",
    requestKey: null,
  }).then((assignments) => assignments
    .map((assignment) => assignment.expand?.patient)
    .filter(Boolean));
}

export async function getAssignedPatient(professionalId, patientId) {
  return pb.collection("patient_professionals").getFirstListItem(
    pb.filter(
      "professional = {:professionalId} && patient = {:patientId} && active = true",
      { professionalId, patientId },
    ),
    { expand: "patient", requestKey: null },
  ).then((assignment) => assignment.expand?.patient || null);
}

export async function patientExists(patientId) {
  try {
    await pb.collection("patients").getOne(patientId, { fields: "id", requestKey: null });
    return true;
  } catch (error) {
    if (error?.status === 404) return false;
    throw error;
  }
}

export async function createEvolution(payload) {
  return pb.collection("evolutions").create(payload, { requestKey: null });
}

export const evolutionTypes = ["regular", "assessment", "interconsultation", "other"];

export async function updateEvolution(evolutionId, payload) {
  const evolutionType = String(payload?.evolution_type || "");
  const title = String(payload?.title || "").trim();
  const content = String(payload?.content || "").trim();

  if (!evolutionTypes.includes(evolutionType) || !content) {
    const error = new Error("Datos de evolución inválidos");
    error.code = "INVALID_EVOLUTION_DATA";
    throw error;
  }

  return pb.collection("evolutions").update(
    evolutionId,
    { evolution_type: evolutionType, title, content },
    { requestKey: null },
  );
}

export async function getEvolutionDetail(evolutionId) {
  return pb.collection("evolutions").getOne(evolutionId, {
    expand: "patient,author",
    requestKey: null,
  });
}

export async function getEvolutionAuthorProfile(staffUserId) {
  if (!staffUserId) return null;
  try {
    return await pb.collection("professionals").getFirstListItem(
      pb.filter("staff_user = {:staffUserId}", { staffUserId }),
      { requestKey: null },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function getPatientEvolutionTimeline(patientId) {
  if (!patientId) return [];
  return pb.collection("evolutions").getFullList({
    filter: pb.filter("patient = {:patientId}", { patientId }),
    sort: "evolution_date,created,id",
    requestKey: null,
  });
}

export function isEvolutionEditable(evolution, user, now = new Date()) {
  if (!evolution || !user || user.active !== true || user.role !== "professional" || evolution.author !== user.id) {
    return false;
  }
  const createdAt = new Date(evolution.created);
  if (Number.isNaN(createdAt.getTime())) return false;
  return now.getTime() - createdAt.getTime() < 72 * 60 * 60 * 1000;
}

export function getEvolutionErrorMessage(error) {
  if (error?.status === 0 || error?.name === "TypeError") {
    return "No pudimos conectarnos con el sistema. Revisá tu conexión e intentá nuevamente.";
  }
  if (error?.status === 401 || error?.status === 403) {
    return "No tenés permiso para registrar esta evolución o la asignación ya no está activa.";
  }
  return "No pudimos guardar la evolución. Verificá los datos e intentá nuevamente.";
}

export function getEvolutionUpdateErrorMessage(error) {
  if (error?.status === 0 || error?.name === "TypeError") {
    return "No pudimos conectarnos con el sistema. Revisá tu conexión e intentá nuevamente.";
  }
  if ([401, 403, 404].includes(error?.status)) {
    return "No fue posible guardar los cambios. Es posible que el plazo de edición haya finalizado o que ya no tengas permiso para modificar esta evolución.";
  }
  return "No pudimos guardar los cambios. Conservamos el contenido del formulario para que puedas intentarlo nuevamente.";
}
