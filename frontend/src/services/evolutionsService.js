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
  if (!evolution || !user || user.role !== "professional" || evolution.author !== user.id) {
    return false;
  }
  const createdAt = new Date(evolution.created || evolution.evolution_date);
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
