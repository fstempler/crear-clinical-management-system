import { pb } from "../lib/pocketbase";

export const EVOLUTIONS_PER_PAGE = 10;

export const evolutionTypes = [
  "regular",
  "assessment",
  "interconsultation",
  "other",
];

export const evolutionTypeLabels = {
  regular: "Evolución",
  assessment: "Evaluación",
  interconsultation: "Interconsulta",
  other: "Otro",
};

export async function getAssignedPatients(professionalId) {
  return pb
    .collection("patient_professionals")
    .getFullList({
      filter: pb.filter(
        "professional = {:professionalId} && active = true",
        { professionalId },
      ),
      expand: "patient",
      sort: "patient.last_name,patient.first_name",
      requestKey: null,
    })
    .then((assignments) =>
      assignments
        .map((assignment) => assignment.expand?.patient)
        .filter(Boolean),
    );
}

export async function getAssignedPatient(professionalId, patientId) {
  return pb
    .collection("patient_professionals")
    .getFirstListItem(
      pb.filter(
        "professional = {:professionalId} && patient = {:patientId} && active = true",
        { professionalId, patientId },
      ),
      {
        expand: "patient",
        requestKey: null,
      },
    )
    .then((assignment) => assignment.expand?.patient || null);
}

export async function patientExists(patientId) {
  try {
    await pb.collection("patients").getOne(patientId, {
      fields: "id",
      requestKey: null,
    });

    return true;
  } catch (error) {
    if (error?.status === 404) return false;
    throw error;
  }
}

export async function createEvolution(payload) {
  return pb.collection("evolutions").create(payload, {
    requestKey: null,
  });
}

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
    {
      evolution_type: evolutionType,
      title,
      content,
    },
    {
      requestKey: null,
    },
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
      pb.filter("staff_user = {:staffUserId}", {
        staffUserId,
      }),
      {
        requestKey: null,
      },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function getEvolutionAuthorProfiles(staffUserIds) {
  const uniqueIds = [...new Set(staffUserIds.filter(Boolean))];

  if (!uniqueIds.length) return [];

  const parameters = {};
  const conditions = uniqueIds.map((staffUserId, index) => {
    const parameter = `staffUser${index}`;
    parameters[parameter] = staffUserId;
    return `staff_user = {:${parameter}}`;
  });

  return pb.collection("professionals").getFullList({
    filter: pb.filter(`(${conditions.join(" || ")})`, parameters),
    expand: "staff_user",
    sort: "last_name,first_name",
    requestKey: null,
  });
}

export async function getPatientHistoryProfessionals(patientId) {
  if (!patientId) return [];

  const assignments = await pb
    .collection("patient_professionals")
    .getFullList({
      filter: pb.filter("patient = {:patientId} && active = true", {
        patientId,
      }),
      expand: "professional,professional.staff_user",
      sort: "professional.last_name,professional.first_name",
      requestKey: null,
    });

  const professionals = assignments
    .map((assignment) => assignment.expand?.professional)
    .filter((professional) => professional?.staff_user);

  const unique = new Map();

  professionals.forEach((professional) => {
    unique.set(professional.staff_user, professional);
  });

  return [...unique.values()];
}

function normalizeSearch(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function isValidDate(value) {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function buildPatientEvolutionsFilter({
  patientId,
  search,
  evolutionType,
  authorId,
  dateFrom,
  dateTo,
}) {
  const filters = ["patient = {:patientId}"];
  const parameters = { patientId };

  const normalizedSearch = normalizeSearch(search);

  if (normalizedSearch) {
    filters.push("(title ~ {:search} || content ~ {:search})");
    parameters.search = normalizedSearch;
  }

  if (evolutionTypes.includes(evolutionType)) {
    filters.push("evolution_type = {:evolutionType}");
    parameters.evolutionType = evolutionType;
  }

  if (authorId) {
    filters.push("author = {:authorId}");
    parameters.authorId = authorId;
  }

  if (isValidDate(dateFrom)) {
    filters.push("evolution_date >= {:dateFrom}");
    parameters.dateFrom = `${dateFrom} 00:00:00.000Z`;
  }

  if (isValidDate(dateTo)) {
    filters.push("evolution_date <= {:dateTo}");
    parameters.dateTo = `${dateTo} 23:59:59.999Z`;
  }

  return pb.filter(filters.join(" && "), parameters);
}

export async function getPatientEvolutions({
  patientId,
  page = 1,
  perPage = EVOLUTIONS_PER_PAGE,
  search = "",
  evolutionType = "",
  authorId = "",
  dateFrom = "",
  dateTo = "",
}) {
  if (!patientId) {
    throw new Error("El identificador del paciente es obligatorio");
  }

  return pb.collection("evolutions").getList(page, perPage, {
    filter: buildPatientEvolutionsFilter({
      patientId,
      search,
      evolutionType,
      authorId,
      dateFrom,
      dateTo,
    }),
    expand: "author",
    sort: "-evolution_date,-created,-id",
    requestKey: null,
  });
}

export async function getPatientEvolutionTimeline(patientId) {
  if (!patientId) return [];

  return pb.collection("evolutions").getFullList({
    filter: pb.filter("patient = {:patientId}", {
      patientId,
    }),
    sort: "evolution_date,created,id",
    requestKey: null,
  });
}

export function isEvolutionEditable(evolution, user, now = new Date()) {
  if (
    !evolution ||
    !user ||
    user.active !== true ||
    user.role !== "professional" ||
    evolution.author !== user.id
  ) {
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

export function getPatientHistoryErrorMessage(error) {
  if ([401, 403, 404].includes(error?.status)) {
    return "No pudimos acceder a la historia clínica de este paciente.";
  }

  if (error?.status === 0 || error?.name === "TypeError") {
    return "No pudimos conectarnos con el sistema. Revisá tu conexión e intentá nuevamente.";
  }

  return "No pudimos cargar la historia clínica. Intentá nuevamente.";
}