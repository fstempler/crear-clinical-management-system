# Perfil del paciente

## Archivos creados

- `src/pages/patients/PatientProfilePage.jsx`
- `src/pages/patients/PatientProfilePage.module.scss`
- `src/hooks/usePatientProfile.js`

## Archivos modificados

- `src/App.jsx`
- `src/components/common/Icon.jsx`
- `src/services/patientsService.js`

## Integración

El ZIP ya contiene los cambios integrados. Reemplazá tu carpeta `frontend` por esta copia o copiá los seis archivos indicados arriba conservando sus rutas. No requiere nuevas dependencias ni cambios en PocketBase.

Creá un `.env` local si todavía no existe:

```env
VITE_POCKETBASE_URL=http://127.0.0.1:8090
```

## Prueba

1. Iniciá PocketBase.
2. Desde `frontend`, ejecutá `npm install` si todavía no instalaste dependencias.
3. Ejecutá `npm run dev`.
4. Ingresá con un usuario `admin` y abrí un paciente desde el listado.
5. Confirmá que aparecen “Ver historia clínica” y “Editar datos”, y que no aparece “Nueva evolución”.
6. Ingresá con un usuario `professional`, abrí un paciente asignado y confirmá que aparece “Nueva evolución” y no las notas administrativas.
7. Probá `/patients/ID_INEXISTENTE` para verificar el estado “Paciente no encontrado”.
8. Probá pacientes sin asignaciones, evoluciones o archivos para verificar los estados vacíos.

## Consultas y limitaciones

- Los datos principales provienen de `patients`.
- El equipo se obtiene de asignaciones activas en `patient_professionals`, expandiendo `professional`.
- Las tres evoluciones más recientes se consultan en `evolutions`, que es el nombre utilizado por el frontend recibido.
- Los cuatro archivos más recientes se consultan en `patient_files`; las URLs se generan con el SDK de PocketBase.
- Las consultas relacionadas se resuelven de forma independiente: si las reglas de PocketBase impiden consultar una relación, el perfil principal sigue siendo utilizable y esa sección muestra su estado vacío.
- “Editar datos” permanece deshabilitado porque el frontend recibido no incluye una ruta segura de edición.
- “Ver historia clínica” desplaza a las evoluciones reales del resumen; el detalle completo todavía depende de las rutas que se implementen en etapas posteriores.
- No se añadieron campos, migraciones, reglas, datos clínicos ficticios ni credenciales.

## Verificación realizada

- `npm run lint`: correcto, sin errores.
- `npm run build`: correcto; Vite generó el bundle de producción.
- Navegación “Ver paciente”: ya apuntaba a `/patients/{id}` y se conservó.
