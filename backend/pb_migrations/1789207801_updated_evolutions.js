/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.author = @request.auth.id &&\n@request.body.patient != \"\" &&\n@collection.patient_professionals.patient ?= @request.body.patient &&\n@collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n@collection.patient_professionals.active ?= true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.author = @request.auth.id"
  }, collection)

  return app.save(collection)
})
