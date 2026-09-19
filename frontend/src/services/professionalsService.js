import { pb } from "../lib/pocketbase";

export const PROFESSIONALS_PER_PAGE = 10;

const BASE_FILTER = "staff_user.role = {:professionalRole}";

export function getProfessionalDetail(professionalId) {
  return pb.collection("professionals").getOne(professionalId, {
    expand: "staff_user",
    requestKey: null,
  });
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
