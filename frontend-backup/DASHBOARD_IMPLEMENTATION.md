# Dashboard CREAR — implementación

## Arquitectura

- `AppLayout` contiene sidebar, header, menú mobile, navegación inferior y `Outlet`.
- `RoleRoute` evita que un administrativo navegue a evoluciones y que un profesional navegue a profesionales.
- `useProfessionalProfile` obtiene la identidad real desde `professionals.staff_user`.
- `useDashboardData` mantiene pacientes, métricas y evoluciones como consultas independientes.
- `dashboardService` concentra las consultas a PocketBase.
- Los componentes del dashboard presentan loading, error, vacío y datos cargados.
- No se modificaron autenticación, migraciones, colecciones ni reglas de PocketBase.

## Archivos creados

- `src/components/auth/RoleRoute.jsx`
- `src/components/common/Icon.jsx`
- `src/components/dashboard/EvolutionList.jsx`
- `src/components/dashboard/EvolutionList.module.scss`
- `src/components/dashboard/Metrics.jsx`
- `src/components/dashboard/Metrics.module.scss`
- `src/components/dashboard/PatientList.jsx`
- `src/components/dashboard/PatientList.module.scss`
- `src/components/dashboard/SectionState.jsx`
- `src/components/dashboard/SectionState.module.scss`
- `src/components/layouts/AppLayout.jsx`
- `src/components/layouts/AppLayout.module.scss`
- `src/components/layouts/DashboardHeader.jsx`
- `src/components/layouts/DashboardHeader.module.scss`
- `src/components/layouts/navigation.js`
- `src/hooks/useDashboardData.js`
- `src/hooks/useProfessionalProfile.js`
- `src/pages/placeholder/PlaceholderPage.jsx`
- `src/pages/placeholder/PlaceholderPage.module.scss`
- `src/services/dashboardService.js`
- `src/utils/date.js`
- `src/utils/presentation.js`

## Archivos modificados

- `src/App.jsx`
- `src/components/layouts/DashboardSidebar.jsx`
- `src/components/layouts/DashboardSidebar.module.scss`
- `src/components/layouts/MobileBottomNav.jsx`
- `src/components/layouts/MobileBottomNav.module.scss`
- `src/pages/dashboard/DashboardPage.jsx`
- `src/pages/dashboard/DashboardPage.module.scss`

## Copia e instalación

El ZIP contiene el frontend completo. Reemplazar la carpeta local `frontend` por la carpeta entregada o copiar únicamente los archivos enumerados. No copiar una carpeta `node_modules` anterior entre sistemas operativos.

Desde `frontend` ejecutar:

```bash
npm install
npm run lint
npm run build
```

## Prueba manual

- Iniciar sesión con un usuario `admin`: debe ver Portal Administrativo, pacientes y profesionales; no debe ver Nueva evolución ni evoluciones propias.
- Iniciar sesión con un usuario `professional`: debe ver Portal Médico, su perfil real, pacientes asignados, Nueva evolución y sus últimas evoluciones.
- Confirmar que el buscador navega a `/patients?search=...` y no navega vacío.
- Probar un profesional sin pacientes y otro sin evoluciones.
- Detener PocketBase y comprobar los mensajes de error y botones Reintentar.
- Recargar una ruta privada y comprobar la persistencia de sesión.
- Probar logout.
- Probar desktop, tablet entre 901 y 1100 px, y mobile.
- En mobile, abrir el menú; cerrarlo con overlay, Escape, botón de cierre y navegación.

## Decisión pendiente

No se muestra “información pendiente” porque ninguna colección o campo actual define esa regla. Se podrá incorporar cuando exista una condición de negocio verificable.
