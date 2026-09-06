/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "date913639302",
    "max": "",
    "min": "",
    "name": "unassigned_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update field
  collection.fields.addAt(4, new Field({
    "help": "",
    "hidden": false,
    "id": "date913639302",
    "max": "",
    "min": "",
    "name": "unassigned_at",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
