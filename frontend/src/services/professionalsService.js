import { pb } from "../lib/pocketbase";

export const PROFESSIONALS_PER_PAGE = 10;
export const ASSIGNMENTS_PER_PAGE = 10;
export const ASSIGNMENT_CANDIDATES_PER_PAGE = 8;

const BASE_FILTER = "staff_user.role = {:professionalRole}";

export function getProfessionalDetail(professionalId) {
  return pb.collection("professionals").getOne(professionalId, {
    expand: "staff_user",
    requestKey: null,
  });
}

export function updateProfessional(professionalId, payload) {
  return pb.collection("professionals").update(professionalId, payload, {
    requestKey: null,
  });
}

export function updateProfessionalAccount(staffUserId, payload) {
  return pb.collection("staff_users").update(staffUserId, payload, {
    requestKey: null,
  });
}

export function createProfessionalAccount(payload) {
  return pb.collection("staff_users").create(payload, { requestKey: null });
}

export function createProfessional(payload) {
  return pb.collection("professionals").create(payload, { requestKey: null });
}

export async function findProfessionalByStaffUser(staffUserId) {
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

export function normalizeProfessionalDocument(documentNumber) {
  return `${documentNumber ?? ""}`.replace(/[\s.-]+/g, "").toUpperCase();
}

export async function findProfessionalByDocumentNumber(documentNumber, excludeProfessionalId) {
  const normalized = normalizeProfessionalDocument(documentNumber);
  if (!normalized) return null;

  const filters = ["document_number = {:documentNumber}"];
  const params = { documentNumber: normalized };
  if (excludeProfessionalId) {
    filters.push("id != {:excludeProfessionalId}");
    params.excludeProfessionalId = excludeProfessionalId;
  }

  try {
    return await pb.collection("professionals").getFirstListItem(
      pb.filter(filters.join(" && "), params),
      { requestKey: null },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export async function findStaffUserByEmail(email, excludeStaffUserId) {
  const normalized = `${email ?? ""}`.trim().toLowerCase();
  if (!normalized) return null;

  const filters = ["email = {:email}"];
  const params = { email: normalized };
  if (excludeStaffUserId) {
    filters.push("id != {:excludeStaffUserId}");
    params.excludeStaffUserId = excludeStaffUserId;
  }

  try {
    return await pb.collection("staff_users").getFirstListItem(
      pb.filter(filters.join(" && "), params),
      { requestKey: null },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

function hasUniqueError(error, field) {
  const fieldError = error?.response?.data?.[field] || error?.data?.data?.[field];
  return /unique|already|exist/i.test(`${fieldError?.code ?? ""} ${fieldError?.message ?? ""}`);
}

export function isDuplicateProfessionalDocumentError(error) {
  return hasUniqueError(error, "document_number");
}

export function isDuplicateStaffEmailError(error) {
  return hasUniqueError(error, "email");
}

export async function getProfessionalAssignments(professionalId) {
  const records = await pb.collection("patient_professionals").getFullList({
    filter: pb.filter(
      "professional = {:professionalId} && active = {:active}",
      { professionalId, active: true },
    ),
    expand: "patient",
    sort: "patient.last_name,patient.first_name",
    requestKey: null,
  });

  return records
    .filter((assignment) => assignment.expand?.patient)
    .map((assignment) => ({
      assignment,
      patient: assignment.expand.patient,
    }));
}

function assignmentFilter(professionalId, search, status) {
  const filters = ["professional = {:professionalId}"];
  const params = { professionalId };
  if (search) {
    filters.push("(patient.first_name ~ {:search} || patient.last_name ~ {:search} || patient.document_number ~ {:search})");
    params.search = search;
  }
  if (status === "active" || status === "inactive") {
    filters.push("active = {:active}");
    params.active = status === "active";
  }
  return pb.filter(filters.join(" && "), params);
}

export function getProfessionalAssignmentsPage({ professionalId, page, search, status }) {
  return pb.collection("patient_professionals").getList(page, ASSIGNMENTS_PER_PAGE, {
    filter: assignmentFilter(professionalId, search, status),
    expand: "patient",
    sort: "-active,patient.last_name,patient.first_name",
    requestKey: null,
  });
}

async function getAssignmentMetric(professionalId, active) {
  const parts = ["professional = {:professionalId}"];
  const params = { professionalId };
  if (typeof active === "boolean") {
    parts.push("active = {:active}");
    params.active = active;
  }
  return pb.collection("patient_professionals").getList(1, 1, {
    filter: pb.filter(parts.join(" && "), params),
    fields: "id",
    requestKey: null,
  }).then((result) => result.totalItems);
}

export async function getProfessionalAssignmentMetrics(professionalId) {
  const [total, active, inactive] = await Promise.all([
    getAssignmentMetric(professionalId),
    getAssignmentMetric(professionalId, true),
    getAssignmentMetric(professionalId, false),
  ]);
  return { total, active, inactive };
}

export async function searchAssignmentCandidates({ professionalId, search, page = 1 }) {
  const filters = ["status = {:patientStatus}"];
  const params = { patientStatus: "active" };
  if (search) {
    filters.push("(first_name ~ {:search} || last_name ~ {:search} || document_number ~ {:search})");
    params.search = search;
  }
  const result = await pb.collection("patients").getList(page, ASSIGNMENT_CANDIDATES_PER_PAGE, {
    filter: pb.filter(filters.join(" && "), params),
    sort: "last_name,first_name",
    requestKey: null,
  });
  const patientIds = result.items.map((patient) => patient.id);
  let relations = [];
  if (patientIds.length) {
    const relationParts = ["professional = {:professionalId}"];
    const relationParams = { professionalId };
    const patientParts = patientIds.map((patientId, index) => {
      const key = `patientId${index}`;
      relationParams[key] = patientId;
      return `patient = {:${key}}`;
    });
    relationParts.push(`(${patientParts.join(" || ")})`);
    relations = await pb.collection("patient_professionals").getFullList({
      filter: pb.filter(relationParts.join(" && "), relationParams),
      requestKey: null,
    });
  }
  const byPatient = new Map(relations.map((relation) => [relation.patient, relation]));
  return {
    ...result,
    items: result.items.map((patient) => ({ patient, assignment: byPatient.get(patient.id) || null })),
  };
}

export async function findPatientProfessionalAssignment(professionalId, patientId) {
  try {
    return await pb.collection("patient_professionals").getFirstListItem(
      pb.filter("professional = {:professionalId} && patient = {:patientId}", { professionalId, patientId }),
      { requestKey: null },
    );
  } catch (error) {
    if (error?.status === 404) return null;
    throw error;
  }
}

export function createPatientProfessionalAssignment(professionalId, patientId) {
  return pb.collection("patient_professionals").create({
    patient: patientId,
    professional: professionalId,
    assigned_at: new Date().toISOString(),
    unassigned_at: "",
    active: true,
  }, { requestKey: null });
}

export function reactivatePatientProfessionalAssignment(assignmentId) {
  return pb.collection("patient_professionals").update(assignmentId, {
    active: true,
    assigned_at: new Date().toISOString(),
    unassigned_at: "",
  }, { requestKey: null });
}

export function deactivatePatientProfessionalAssignment(assignmentId) {
  return pb.collection("patient_professionals").update(assignmentId, {
    active: false,
    unassigned_at: new Date().toISOString(),
  }, { requestKey: null });
}

export function isDuplicateAssignmentError(error) {
  const response = error?.response || error?.data || {};
  return error?.status === 400 && /unique|already|exist|duplicate/i.test(JSON.stringify(response));
}

function buildFilter({ search, profession, specialty, status } = {}) {
  const filters = [BASE_FILTER];
  const params = { professionalRole: "professional" };

  if (search) {
    filters.push(`(
      first_name ~ {:search} ||
      last_name ~ {:search} ||
      document_number ~ {:search} ||
      license_number ~ {:search} ||
      profession ~ {:search} ||
      specialty ~ {:search} ||
      email ~ {:search} ||
      staff_user.email ~ {:search}
    )`);
    params.search = search;
  }
  if (profession) {
    filters.push("profession = {:profession}");
    params.profession = profession;
  }
  if (specialty) {
    filters.push("specialty = {:specialty}");
    params.specialty = specialty;
  }
  if (status === "active" || status === "inactive") {
    filters.push("staff_user.active = {:active}");
    params.active = status === "active";
  }

  return pb.filter(filters.join(" && "), params);
}

export function getProfessionalsPage({ page, search, profession, specialty, status }) {
  return pb.collection("professionals").getList(page, PROFESSIONALS_PER_PAGE, {
    filter: buildFilter({ search, profession, specialty, status }),
    expand: "staff_user",
    sort: "last_name,first_name",
    requestKey: null,
  });
}

async function getMetric(filter) {
  const result = await pb.collection("professionals").getList(1, 1, {
    filter,
    fields: "id",
    requestKey: null,
  });
  return result.totalItems;
}

export async function getProfessionalsMetrics() {
  const base = pb.filter(BASE_FILTER, { professionalRole: "professional" });
  const active = pb.filter(`${BASE_FILTER} && staff_user.active = {:active}`, {
    professionalRole: "professional",
    active: true,
  });
  const inactive = pb.filter(`${BASE_FILTER} && staff_user.active = {:active}`, {
    professionalRole: "professional",
    active: false,
  });
  const [total, activeCount, inactiveCount] = await Promise.all([
    getMetric(base),
    getMetric(active),
    getMetric(inactive),
  ]);
  return { total, active: activeCount, inactive: inactiveCount };
}

export async function getProfessionalFilterOptions() {
  const records = await pb.collection("professionals").getFullList({
    filter: pb.filter(BASE_FILTER, { professionalRole: "professional" }),
    fields: "profession,specialty",
    sort: "profession,specialty",
    requestKey: null,
  });
  const unique = (field) => [...new Set(records.map((record) => record[field]?.trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  return { professions: unique("profession"), specialties: unique("specialty") };
}
