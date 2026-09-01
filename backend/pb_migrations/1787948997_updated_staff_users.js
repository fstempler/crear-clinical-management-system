/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  id = @request.auth.id\n)",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  (\n    id = @request.auth.id &&\n    @request.body.role:changed = false &&\n    @request.body.active:changed = false\n  )\n)",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  id = @request.auth.id\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
