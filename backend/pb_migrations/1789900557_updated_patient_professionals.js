/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\" &&\n@request.body.patient != \"\" &&\n@request.body.professional != \"\" &&\n@request.body.active = true &&\n@request.body.assigned_at != \"\"",
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    professional.staff_user = @request.auth.id\n  )\n)",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\" &&\n@request.body.patient:changed = false &&\n@request.body.professional:changed = false",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    @request.auth.role = \"professional\" &&\n    professional.staff_user = @request.auth.id\n  )\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" && @request.auth.active = true && @request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\" && @request.auth.active = true",
    "updateRule": "@request.auth.id != \"\" && @request.auth.active = true && @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.active = true"
  }, collection)

  return app.save(collection)
})
