# Listado de pacientes

La ruta `/patients` consulta PocketBase con paginación real de 10 elementos.

- Administración consulta directamente `patients`, ordenado por `last_name,first_name`.
- Profesionales consultan asignaciones activas en `patient_professionals`, expanden `patient` y ordenan por `patient.last_name,patient.first_name`.
- Búsqueda, estado y página se conservan en los parámetros `search`, `status` y `page`.
- `/patients/new` está dentro de `RoleRoute` y solo admite el rol `admin`.
- `/patients/:patientId` conserva el placeholder existente hasta implementar el detalle.

La búsqueda se construye con `pb.filter()` y parámetros enlazados. Las respuestas obsoletas se ignoran mediante un identificador de solicitud y el estado visible se invalida inmediatamente cuando cambia el usuario o la consulta.

## Verificación

```bash
npm install
npm run lint
npm run build
```

PocketBase admite filtros sobre relaciones expandidas. El orden profesional utiliza campos de la relación (`patient.last_name,patient.first_name`), sin cargar todas las asignaciones en memoria. Si una versión anterior del backend no admite ese orden relacional, PocketBase devolverá un error visible y reintentable; no se aplica una paginación manual engañosa.
