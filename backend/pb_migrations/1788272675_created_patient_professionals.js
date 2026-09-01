/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != \"\" && @request.auth.active = true && @request.auth.role = \"admin\"",
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
      },
      {
        "help": "",
        "hidden": false,
        "id": "date876511337",
        "max": "",
        "min": "",
        "name": "assigned_at",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "date"
      },
      {
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
      },
      {
        "help": "",
        "hidden": false,
        "id": "bool1260321794",
        "name": "active",
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
      }
    ],
    "id": "pbc_4284009459",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_patient_professional_unique` ON `patient_professionals` (\n  `professional`,\n  `patient`\n)"
    ],
    "listRule": "@request.auth.id != \"\" && @request.auth.active = true",
    "name": "patient_professionals",
    "system": false,
    "type": "base",
    "updateRule": "@request.auth.id != \"\" && @request.auth.active = true && @request.auth.role = \"admin\"",
    "viewRule": "@request.auth.id != \"\" && @request.auth.active = true"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459");

  return app.delete(collection);
})
