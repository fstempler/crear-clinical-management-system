/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_patient_professional_unique` ON `patient_professionals` (\n  `professional`,\n  `patient`\n)",
      "CREATE UNIQUE INDEX `idx_active_patient_professional`\nON `patient_professionals` (`patient`, `professional`)\nWHERE `active` = TRUE"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4284009459")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_patient_professional_unique` ON `patient_professionals` (\n  `professional`,\n  `patient`\n)"
    ]
  }, collection)

  return app.save(collection)
})
