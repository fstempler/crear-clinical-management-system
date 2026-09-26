/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208")

  // update collection data
  unmarshal({
    "listRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
})
