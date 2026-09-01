/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\n@request.body.author = @request.auth.id",
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
        "id": "relation3182418120",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "author",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "relation"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select3918408128",
        "maxSelect": 0,
        "name": "evolution_type",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "select",
        "values": [
          "regular",
          "assessment",
          "interconsultation",
          "other"
        ]
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text724990059",
        "max": 0,
        "min": 0,
        "name": "title",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text"
      },
      {
        "convertURLs": false,
        "help": "",
        "hidden": false,
        "id": "editor4274335913",
        "maxSize": 0,
        "name": "content",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "editor"
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
        "id": "autodate3486402963",
        "name": "evolution_date",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2365206861",
    "indexes": [],
    "listRule": "@request.auth.id != \"\" && @request.auth.active = true",
    "name": "evolutions",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" &&\n@request.auth.active = true &&\n@request.auth.role = \"professional\" &&\nauthor = @request.auth.id &&\ncreated >= strftime('%Y-%m-%d %H:%M:%fZ', @now, '-72 hours') &&\n@request.body.patient:changed = false &&\n@request.body.author:changed = false",
    "viewRule": "@request.auth.id != \"\" && @request.auth.active = true"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2365206861");

  return app.delete(collection);
})
