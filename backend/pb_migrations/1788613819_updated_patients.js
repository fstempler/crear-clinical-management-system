/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1820489269")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "select1274211008",
    "maxSelect": 0,
    "name": "document_type",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "dni",
      "passport",
      "other"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1820489269")

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "select1274211008",
    "maxSelect": 0,
    "name": "select",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "dni",
      "passport",
      "other"
    ]
  }))

  return app.save(collection)
})
