/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nauthor = @request.auth.id &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.author:changed = false &&\n@request.body.evolution_date:changed = false",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n(\n  @request.auth.role = \"admin\" ||\n  @request.auth.role = \"professional\"\n)"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861")

  // update collection data
  unmarshal({
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nauthor = @request.auth.id &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.author:changed = false",
    "viewRule": "@request.auth.id != \"\" && @request.auth.active = true"
  }, collection)

  return app.save(collection)
})
