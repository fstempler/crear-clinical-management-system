/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.patient != \"\" &&\n@request.body.evolution != \"\" &&\n@request.body.uploaded_by = @request.auth.id &&\n@request.body.is_deleted != true &&\n@collection.patient_professionals.patient ?= @request.body.patient &&\n@collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n@collection.patient_professionals.active ?= true &&\n@collection.evolutions.id ?= @request.body.evolution &&\n@collection.evolutions.patient ?= @request.body.patient &&\n@collection.evolutions.author ?= @request.auth.id",
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    @collection.patient_professionals.patient ?= patient &&\n    @collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n    @collection.patient_professionals.active ?= true\n  )\n)",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nuploaded_by = @request.auth.id &&\nis_deleted = false &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.evolution:changed = false &&\n@request.body.uploaded_by:changed = false &&\n@request.body.file:changed = false &&\n(\n  @request.body.is_deleted:changed = false ||\n  (\n    @request.body.is_deleted = true &&\n    @request.body.deleted_at != \"\"\n  )\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.uploaded_by = @request.auth.id &&\n@request.body.is_deleted != true",
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nuploaded_by = @request.auth.id &&\nis_deleted = false &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.uploaded_by:changed = false &&\n@request.body.file:changed = false"
  }, collection)

  return app.save(collection)
})
