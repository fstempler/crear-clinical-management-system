/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // remove field
  collection.fields.removeById("autodate1257476049")

  // add field
  collection.fields.addAt(7, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_2365206861",
    "help": "",
    "hidden": false,
    "id": "relation1108093075",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "evolution",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "help": "",
    "hidden": false,
    "id": "date1257476049",
    "max": "",
    "min": "",
    "name": "deleted_at",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

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
    "collectionId": "pbc_338227426",
    "help": "",
    "hidden": false,
    "id": "relation3823579430",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "uploaded_by",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 0,
    "maxSize": 104857600,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
      "audio/mp4",
      "video/quicktime",
      "audio/x-m4a",
      "image/heic",
      "video/webm",
      "application/pdf"
    ],
    "name": "file",
    "presentable": false,
    "protected": true,
    "required": true,
    "system": false,
    "thumbs": [
      "100x100",
      "300x300"
    ],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select105650625",
    "maxSelect": 0,
    "name": "category",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "select",
    "values": [
      "document",
      "image",
      "video",
      "audio",
      "other"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559")

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "autodate1257476049",
    "name": "deleted_at",
    "onCreate": true,
    "onUpdate": false,
    "presentable": false,
    "system": false,
    "type": "autodate"
  }))

  // remove field
  collection.fields.removeById("relation1108093075")

  // remove field
  collection.fields.removeById("date1257476049")

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
    "collectionId": "pbc_338227426",
    "help": "",
    "hidden": false,
    "id": "relation3823579430",
    "maxSelect": 0,
    "minSelect": 0,
    "name": "uploaded_by",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  // update field
  collection.fields.addAt(3, new Field({
    "help": "",
    "hidden": false,
    "id": "file2359244304",
    "maxSelect": 0,
    "maxSize": 104857600,
    "mimeTypes": [
      "image/jpeg",
      "image/png",
      "image/webp",
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
      "audio/mp4",
      "video/quicktime",
      "audio/x-m4a",
      "image/heic",
      "video/webm",
      "application/pdf"
    ],
    "name": "file",
    "presentable": false,
    "protected": true,
    "required": false,
    "system": false,
    "thumbs": [
      "100x100",
      "300x300"
    ],
    "type": "file"
  }))

  // update field
  collection.fields.addAt(5, new Field({
    "help": "",
    "hidden": false,
    "id": "select105650625",
    "maxSelect": 0,
    "name": "category",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "document",
      "image",
      "video",
      "audio",
      "other"
    ]
  }))

  return app.save(collection)
})
