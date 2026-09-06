import { pb } from "../lib/pocketbase";

export const PATIENTS_PER_PAGE = 10;

export function normalizeDocumentNumber(value) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export async function findPatientByDocumentNumber(documentNumber) {
  const normalizedDocument = normalizeDocumentNumber(documentNumber);
  if (!normalizedDocument) return null;
  const patients = await pb.collection("patients").getFullList({
    fields: "id,document_number",
    requestKey: null,
  });
  return patients.find(
    (patient) => normalizeDocumentNumber(patient.document_number) === normalizedDocument,
  ) || null;
}

export async function createPatient(patient) {
  return pb.collection("patients").create(patient, { requestKey: null });
}

export function isDuplicateDocumentError(error) {
  const field = error?.response?.data?.document_number;
  const message = `${field?.code || ""} ${field?.message || ""} ${error?.message || ""}`;
  return Boolean(field) && /(unique|already|exist|usado|existe|único)/i.test(message);
}

function patientFilter(search, status, prefix = "") {
  const filters = [];
  const params = {};

  if (search) {
    filters.push(
      `(${prefix}first_name ~ {:search} || ${prefix}last_name ~ {:search} || ${prefix}document_number ~ {:search})`,
    );
    params.search = search;
  }

  if (status) {
    filters.push(`${prefix}status = {:status}`);
    params.status = status;
  }

  return filters.length ? pb.filter(filters.join(" && "), params) : "";
}

export async function getPatientsPage({ role, professionalId, page, search, status }) {
  if (role === "professional") {
    if (!professionalId) {
      return { page: 1, perPage: PATIENTS_PER_PAGE, totalItems: 0, totalPages: 0, items: [] };
    }

    const assignmentFilter = [
      pb.filter("professional = {:professionalId} && active = true", {
        professionalId,
      }),
      patientFilter(search, status, "patient."),
    ]
      .filter(Boolean)
      .join(" && ");

    const result = await pb.collection("patient_professionals").getList(
      page,
      PATIENTS_PER_PAGE,
      {
        filter: assignmentFilter,
        expand: "patient",
        sort: "patient.last_name,patient.first_name",
        requestKey: null,
      },
    );

    return {
      ...result,
      items: result.items.map((assignment) => assignment.expand?.patient).filter(Boolean),
    };
  }

  return pb.collection("patients").getList(page, PATIENTS_PER_PAGE, {
    filter: patientFilter(search, status),
    sort: "last_name,first_name",
    requestKey: null,
  });
}
