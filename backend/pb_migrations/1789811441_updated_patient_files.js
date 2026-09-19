/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.patient != \"\" &&\n@request.body.evolution != \"\" &&\n@request.body.uploaded_by = @request.auth.id &&\n@request.body.is_deleted != true &&\n@collection.patient_professionals.patient ?= @request.body.patient &&\n@collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n@collection.patient_professionals.active ?= true &&\n@collection.evolutions.id ?= @request.body.evolution &&\n@collection.evolutions.patient ?= @request.body.patient &&\n@collection.evolutions.author ?= @request.auth.id &&\n@collection.evolutions.created ?>= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours')"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.patient != \"\" &&\n@request.body.evolution != \"\" &&\n@request.body.uploaded_by = @request.auth.id &&\n@request.body.is_deleted != true &&\n@collection.patient_professionals.patient ?= @request.body.patient &&\n@collection.patient_professionals.professional.staff_user ?= @request.auth.id &&\n@collection.patient_professionals.active ?= true &&\n@collection.evolutions.id ?= @request.body.evolution &&\n@collection.evolutions.patient ?= @request.body.patient &&\n@collection.evolutions.author ?= @request.auth.id"
  }, collection)

  return app.save(collection)
})
