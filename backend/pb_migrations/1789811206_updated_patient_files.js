/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    @collection.patient_professionals.patient ?= patient &&\n    @collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n    @collection.patient_professionals.active ?= true\n  )\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false"
  }, collection)

  return app.save(collection)
})
