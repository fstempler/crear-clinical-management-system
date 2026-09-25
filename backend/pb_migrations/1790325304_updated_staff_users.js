/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Hola,</p>\n<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/restablecer-contrasena?token={TOKEN}\" target=\"_blank\" rel=\"noopener\">Restablecer contraseña</a>\n</p>\n<p><i>Si no solicitaste este cambio, podés ignorar este correo.</i></p>\n<p>\n  Gracias,<br/>\n  Equipo de {APP_NAME}\n</p>",
      "subject": "Restablecé tu contraseña de {APP_NAME}"
    }
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_338227426")

  // update collection data
  unmarshal({
    "resetPasswordTemplate": {
      "body": "<p>Hello,</p>\n<p>Click on the button below to reset your password.</p>\n<p>\n  <a class=\"btn\" href=\"{APP_URL}/restablecer-contrasena?token={TOKEN}\" target=\"_blank\" rel=\"noopener\">Restablecer contraseña</a>\n</p>\n<p><i>If you didn't ask to reset your password, please ignore this email.</i></p>\n<p>\n  Thanks,<br/>\n  {APP_NAME} team\n</p>",
      "subject": "Reset your {APP_NAME} password"
    }
  }, collection)

  return app.save(collection)
})
