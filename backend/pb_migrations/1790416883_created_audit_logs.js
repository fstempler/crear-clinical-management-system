/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "createRule": null,
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
        "collectionId": "pbc_338227426",
        "help": "",
        "hidden": false,
        "id": "relation1148540665",
        "maxSelect": 0,
        "minSelect": 0,
        "name": "actor",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text706984828",
        "max": 0,
        "min": 0,
        "name": "actor_label",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1730263193",
        "maxSelect": 0,
        "name": "actor_role",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "admin",
          "professional"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select1204587666",
        "maxSelect": 0,
        "name": "action",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "login",
          "view",
          "create",
          "update",
          "activate",
          "deactivate",
          "assign",
          "unassign",
          "upload",
          "download",
          "soft_delete",
          "password_change"
        ]
      },
      {
        "help": "",
        "hidden": false,
        "id": "select3592887498",
        "maxSelect": 0,
        "name": "entity_tape",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "select",
        "values": [
          "session",
          "staff_user",
          "professional",
          "patient",
          "assignment",
          "evolution",
          "patient_file",
          "account"
        ]
      },
      {
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text2166717789",
        "max": 0,
        "min": 0,
        "name": "entity_id",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
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
        "autogeneratePattern": "",
        "help": "",
        "hidden": false,
        "id": "text3458754147",
        "max": 0,
        "min": 0,
        "name": "summary",
        "pattern": "",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text"
      },
      {
        "help": "",
        "hidden": false,
        "id": "json539015229",
        "maxSize": 0,
        "name": "changes",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
      },
      {
        "help": "",
        "hidden": false,
        "id": "json3797779838",
        "maxSize": 0,
        "name": "context",
        "presentable": false,
        "required": false,
        "system": false,
        "type": "json"
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
    "id": "pbc_681515208",
    "indexes": [],
    "listRule": null,
    "name": "audit_logs",
    "system": false,
    "type": "base",
    "updateRule": null,
    "viewRule": null
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_681515208");

  return app.delete(collection);
})
