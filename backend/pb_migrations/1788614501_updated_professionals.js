/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3297381887")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_professionals_staff_user`\nON `professionals` (`staff_user`),\n",
      "CREATE UNIQUE INDEX `idx_professionals_document_number`\nON `professionals` (`document_number`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3297381887")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
