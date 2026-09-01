/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3297381887")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\" && @request.auth.active = true",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.active = true"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3297381887")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
