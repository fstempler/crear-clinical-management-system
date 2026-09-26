/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE INDEX idx_audit_logs_created\nON audit_logs (created)\n",
      "CREATE INDEX idx_audit_logs_actor\nON audit_logs (actor)",
      "CREATE INDEX idx_audit_logs_entity\nON audit_logs (entity_type, entity_id)",
      "CREATE INDEX idx_audit_logs_patient\nON audit_logs (patient)"
    ]
  }, collection)

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3592887498",
    "maxSelect": 0,
    "name": "entity_type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "session",
      "staff_user",
      "professional",
      "patient",
      "assignment",
      "evolution",
      "patient_file",
      "account"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select3592887498",
    "maxSelect": 0,
    "name": "entity_tape",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "session",
      "staff_user",
      "professional",
      "patient",
      "assignment",
      "evolution",
      "patient_file",
      "account"
    ]
  }))

  return app.save(collection)
})
