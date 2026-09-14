# Detalle de evolución clínica

## Implementación

- Ruta protegida: `/evolutions/:evolutionId`, disponible para `admin` y `professional`.
- La evolución se consulta con expansión de `patient` y `author`.
- El perfil del autor se obtiene desde `professionals` mediante `staff_user = evolution.author`.
- Los registros anterior y siguiente se calculan con la cronología completa del mismo paciente.
- `content` se representa de forma segura como texto, párrafos y listas, sin `dangerouslySetInnerHTML`.
- La autoría se compara con `evolution.author === user.id`. `canEdit` queda preparado para una futura pantalla de edición y exige autor profesional y menos de 72 horas desde la creación.
- Administración, otro profesional y autor fuera del plazo ven el aviso de solo lectura.

## Limitación de archivos

`patient_files` no tiene actualmente una relación con `evolutions`. Esta pantalla muestra siempre “Sin archivos adjuntos” y no permite subir ni eliminar archivos. El bloque queda aislado para recibir archivos asociados cuando el backend incorpore esa relación.

## Navegación

- El perfil del paciente y “Volver a la historia clínica” apuntan al paciente real.
- “Nueva evolución” usa `/evolutions/new?patientId=:patientId`.
- `NewEvolutionPage` conserva compatibilidad con el parámetro anterior `patient`.
- Los enlaces de evoluciones recientes y cercanas usan el ID real de PocketBase.
