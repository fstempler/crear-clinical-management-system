import { pb } from "../lib/pocketbase";
export async function getProfessionalProfile(userId) {
  return pb
    .collection("professionals")
    .getFirstListItem(pb.filter("staff_user = {:userId}", { userId }), {
      requestKey: null,
    });
}
export async function getProfessionalPatients(professionalId) {
  const assignments = await pb
    .collection('patient_professionals')
    .getFullList({
      filter: pb.filter(
        'professional = {:professionalId} && active = true',
        { professionalId }
      ),
      expand: 'patient',
      sort: '-created',
      requestKey: null,
    })

  const assignedPatients = assignments
    .map((assignment) => assignment.expand?.patient)
    .filter(Boolean)

  return {
    patients: assignedPatients.slice(0, 5),
    activePatients: assignedPatients.filter(
      (patient) => patient.status === 'active'
    ).length,
  }
}
export async function getProfessionalEvolutions(userId) {
  return pb
    .collection("evolutions")
    .getList(1, 5, {
      filter: pb.filter("author = {:userId}", { userId }),
      expand: "patient",
      sort: "-created",
      requestKey: null,
    })
    .then((result) => result.items);
}
export async function getAdminPatients() {
  return pb
    .collection("patients")
    .getList(1, 5, { sort: "-created", requestKey: null })
    .then((result) => result.items);
}
export async function getAdminMetrics() {
  const [activePatients, professionals] = await Promise.all([
    pb.collection("patients").getList(1, 1, {
      filter: 'status = "active"',
      fields: "id",
      requestKey: null,
    }),
    pb
      .collection("professionals")
      .getList(1, 1, { fields: "id", requestKey: null }),
  ]);
  return {
    activePatients: activePatients.totalItems,
    professionals: professionals.totalItems,
  };
}
