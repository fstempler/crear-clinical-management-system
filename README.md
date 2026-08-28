# CREAR Clinical Management System

Prototipo funcional de la plataforma de atención centralizada de CREAR.

## Objetivo

Gestionar pacientes, profesionales, historias clínicas, evoluciones y archivos clínicos desde una aplicación centralizada con permisos diferenciados.

## Stack

### Frontend

- React
- Vite
- React Router
- Sass Modules
- PocketBase JavaScript SDK

### Backend

- PocketBase
- SQLite
- PocketBase Auth
- API Rules
- JavaScript Hooks
- Protected Files

### Infraestructura prevista

- Hostinger VPS
- Ubuntu 24.04 LTS
- Caddy
- Backups externos

## Estructura

```text
frontend/              Aplicación React
backend/pb_hooks/      Lógica y validaciones del backend
backend/pb_migrations/ Migraciones de PocketBase
docs/                  Documentación técnica