/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1820489269",
    "help": "",
    "hidden": false,
    "id": "relation450549739",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "patient",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3297381887",
    "help": "",
    "hidden": false,
    "id": "relation3015013290",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "professional",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "bool1260321794",
    "name": "active",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update field
  collection.fields.addAt(1, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_1820489269",
    "help": "",
    "hidden": false,
    "id": "relation450549739",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "patient",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_3297381887",
    "help": "",
    "hidden": false,
    "id": "relation3015013290",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "professional",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "bool1260321794",
    "name": "active",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "bool"
  }))

  return app.save(collection)
})
