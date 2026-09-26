/// <reference path="../pb_data/types.d.ts" />

const AUDITED_FIELDS = {
  staff_users: ["email", "role", "active"],
  professionals: ["first_name", "last_name", "document_number", "profession", "specialty", "license_number", "email", "phone", "administrative_notes"],
  patients: ["first_name", "last_name", "document_number", "birth_date", "gender", "phone", "email", "address", "city", "province", "postal_code", "health_insurance", "health_insurance_number", "emergency_contact_name", "emergency_contact_phone", "status", "administrative_notes"],
  patient_professionals: ["active", "assigned_at", "unassigned_at"],
  evolutions: ["evolution_type", "title", "content"],
  patient_files: ["description", "category", "is_deleted", "deleted_at"],
};

function safeString(value) { return value == null ? "" : String(value); }
function getActorLabel(app, actor) {
  if (!actor) return "Usuario no identificado";
  try {
    const profile = app.findFirstRecordByFilter("professionals", "staff_user = {:staffUser}", { staffUser: actor.id });
    const fullName = (profile.getString("first_name") + " " + profile.getString("last_name")).trim();
    if (fullName) return fullName;
  } catch (_) {}
  return actor.email ? actor.email() : actor.getString("email") || actor.id;
}
function patientIdFor(name, record) {
  if (!record) return "";
  if (name === "patients") return record.id;
  if (name === "patient_professionals" || name === "evolutions" || name === "patient_files") return record.getString("patient");
  return "";
}
function snapshot(record, name) {
  const data = {};
  (AUDITED_FIELDS[name] || []).forEach((field) => { data[field] = record.get(field); });
  return data;
}
function changedFields(record, name, before) {
  const result = [];
  (AUDITED_FIELDS[name] || []).forEach((field) => { if (JSON.stringify(before[field]) !== JSON.stringify(record.get(field))) result.push(field); });
  return result;
}
function writeAudit(app, actor, data) {
  if (!actor || actor.collection().name !== "staff_users") return;
  try {
    const record = new Record(app.findCollectionByNameOrId("audit_logs"));
    record.set("actor", actor.id);
    record.set("actor_label", getActorLabel(app, actor));
    record.set("actor_role", actor.getString("role"));
    record.set("action", data.action);
    record.set("entity_type", data.entityType);
    record.set("entity_id", safeString(data.entityId));
    if (data.patient) record.set("patient", safeString(data.patient));
    record.set("summary", data.summary);
    if (data.fields && data.fields.length) record.set("changes", { fields: data.fields });
    if (data.context) record.set("context", data.context);
    app.save(record);
  } catch (error) {
    app.logger().error("CREAR audit event could not be persisted", "action", safeString(data.action), "entityType", safeString(data.entityType), "entityId", safeString(data.entityId), "error", error);
    console.log("CREAR audit error:", safeString(error));
  }
}
function entityTypeFor(name) { return { staff_users: "staff_user", professionals: "professional", patients: "patient", patient_professionals: "assignment", evolutions: "evolution", patient_files: "patient_file" }[name]; }
function createSummary(name) { return { staff_users: "Se creó una cuenta de usuario.", professionals: "Se creó un perfil profesional.", patients: "Se registró un paciente.", patient_professionals: "Se asignó un paciente a un profesional.", evolutions: "Se registró una evolución clínica.", patient_files: "Se adjuntó un archivo clínico." }[name]; }
function updateDescriptor(name, record, before) {
  if (name === "staff_users" && before.active !== record.getBool("active")) return record.getBool("active") ? { action: "activate", summary: "Se activó una cuenta de usuario." } : { action: "deactivate", summary: "Se desactivó una cuenta de usuario." };
  if (name === "patient_professionals" && before.active !== record.getBool("active")) return record.getBool("active") ? { action: "assign", summary: "Se reactivó una asignación profesional." } : { action: "unassign", summary: "Se desactivó una asignación profesional." };
  if (name === "patient_files" && !before.is_deleted && record.getBool("is_deleted")) return { action: "soft_delete", summary: "Se eliminó lógicamente un archivo clínico." };
  return { action: "update", summary: { staff_users: "Se actualizó una cuenta de usuario.", professionals: "Se actualizó un perfil profesional.", patients: "Se actualizaron datos de un paciente.", patient_professionals: "Se actualizó una asignación profesional.", evolutions: "Se actualizó una evolución clínica.", patient_files: "Se actualizaron los datos de un archivo clínico." }[name] };
}

module.exports = { changedFields, createSummary, entityTypeFor, patientIdFor, snapshot, updateDescriptor, writeAudit };
