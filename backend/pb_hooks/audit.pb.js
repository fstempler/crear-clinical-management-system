/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  e.next();
  const audit = require(`${__hooks}/audit-utils.js`);
  const name = e.collection.name;
  audit.writeAudit(e.app, e.auth, {
    action: name === "patient_files" ? "upload" : name === "patient_professionals" ? "assign" : "create",
    entityType: audit.entityTypeFor(name), entityId: e.record.id,
    patient: audit.patientIdFor(name, e.record), summary: audit.createSummary(name),
  });
}, "staff_users", "professionals", "patients", "patient_professionals", "evolutions", "patient_files");

onRecordUpdateRequest((e) => {
  const audit = require(`${__hooks}/audit-utils.js`);
  const name = e.collection.name;
  const before = audit.snapshot(e.record.original(), name);
  e.next();
  const fields = audit.changedFields(e.record, name, before);
  if (!fields.length) return;
  const descriptor = audit.updateDescriptor(name, e.record, before);
  audit.writeAudit(e.app, e.auth, {
    action: descriptor.action, entityType: audit.entityTypeFor(name), entityId: e.record.id,
    patient: audit.patientIdFor(name, e.record), summary: descriptor.summary, fields: fields,
  });
}, "staff_users", "professionals", "patients", "patient_professionals", "evolutions", "patient_files");

onRecordAuthWithPasswordRequest((e) => {
  e.next();
  if (!e.record || e.record.collection().name !== "staff_users") return;
  const audit = require(`${__hooks}/audit-utils.js`);
  audit.writeAudit(e.app, e.record, { action: "login", entityType: "session", entityId: e.record.id, summary: "El usuario inició sesión.", context: { method: "password" } });
}, "staff_users");

onRecordConfirmPasswordResetRequest((e) => {
  e.next();
  if (!e.record) return;
  const audit = require(`${__hooks}/audit-utils.js`);
  audit.writeAudit(e.app, e.record, { action: "password_change", entityType: "account", entityId: e.record.id, summary: "El usuario restableció su contraseña.", context: { method: "recovery" } });
}, "staff_users");

onRecordViewRequest((e) => {
  e.next();
  if (!e.auth) return;
  const audit = require(`${__hooks}/audit-utils.js`);
  audit.writeAudit(e.app, e.auth, { action: "view", entityType: "evolution", entityId: e.record.id, patient: e.record.getString("patient"), summary: "Se consultó el detalle de una evolución clínica." });
}, "evolutions");

onFileDownloadRequest((e) => {
  e.next();
  if (!e.auth || e.collection.name !== "patient_files") return;
  const audit = require(`${__hooks}/audit-utils.js`);
  audit.writeAudit(e.app, e.auth, { action: "download", entityType: "patient_file", entityId: e.record.id, patient: e.record.getString("patient"), summary: "Se descargó o visualizó un archivo clínico.", context: { category: e.record.getString("category") } });
});
