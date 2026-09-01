/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.uploaded_by = @request.auth.id &&\n@request.body.is_deleted != true",
    "deleteRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text1843675174",
        "max": 0,
        "min": 0,
        "name": "description",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
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
      },
      {
        "help": "",
        "hidden": false,
        "id": "bool4245145851",
        "name": "is_deleted",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "bool"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3332085495",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate3367411737",
        "name": "filedate",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate1257476049",
        "name": "deleted_at",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2050467559",
    "indexes": [],
    "listRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false",
    "name": "patient_files",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nuploaded_by = @request.auth.id &&\nis_deleted = false &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.uploaded_by:changed = false &&\n@request.body.file:changed = false",
    "viewRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\nis_deleted = false"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2050467559");

  return app.delete(collection);
})
