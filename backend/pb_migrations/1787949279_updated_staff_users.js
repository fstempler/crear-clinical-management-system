/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "authRule": "active = true",
    "manageRule": "@request.auth.id != \"\" && @request.auth.active = true && @request.auth.role = \"admin\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "authRule": "",
    "manageRule": null
  }, collection)

  return app.save(collection)
})
