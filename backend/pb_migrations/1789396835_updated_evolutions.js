/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    @collection.patient_professionals.patient ?= patient &&\n    @collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n    @collection.patient_professionals.active ?= true\n  )\n)",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    @collection.patient_professionals.patient ?= patient &&\n    @collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n    @collection.patient_professionals.active ?= true\n  )\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" && @request.auth.active = true",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  @request.auth.role = \"professional\"\n)"
  }, collection)

  return app.save(collection)
})
