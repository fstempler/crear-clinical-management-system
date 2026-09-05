# Importador de pacientes

Herramienta administrativa para cargar pacientes desde CSV en la colección `patients` de PocketBase. Se ejecuta desde terminal y no forma parte del frontend.

## Seguridad

- Usar primero datos ficticios y `--dry-run`.
- No subir `.env`, `pb_data`, contraseñas ni planillas reales a Git.
- Los reportes se guardan en `reports/`, carpeta ignorada por Git.
- `--apply` exige `--confirm IMPORTAR`.
- El script usa la API y validaciones de PocketBase; no escribe directamente en SQLite.

## Instalación

Desde la raíz del repositorio:

```bash
cd backend/tools/patient-import
npm install
cp .env.example .env
```

Editar `.env` con el superusuario técnico local:

```env
PB_URL=http://127.0.0.1:8090
PB_SUPERUSER_EMAIL=tu-superusuario
PB_SUPERUSER_PASSWORD=tu-contraseña
```

Dejar PocketBase ejecutándose en otra terminal:

```bash
cd backend
./pocketbase serve
```

## Formato del CSV

Guardar desde Excel como **CSV UTF-8 delimitado por comas**.

Columnas obligatorias:

```text
first_name
last_name
document_type
document_number
birth_date
gender
emergency_contact_name
emergency_contact_relationship
emergency_contact_phone
```

Columnas opcionales:

```text
address
city
phone
email
health_insurance
affiliate_number
status
administrative_notes
```

Fechas admitidas: `YYYY-MM-DD` y `DD/MM/YYYY`.

Valores principales:

- `document_type`: `dni`, `passport`, `other` (también acepta `documento`, `pasaporte`, `otro`).
- `gender`: `female`, `male`, `non_binary`, `other`, `not_specified` y equivalentes básicos en español.
- `status`: `active`, `inactive`, `discharged` y equivalentes en español. Vacío se convierte en `active`.

## Prueba recomendada

### 1. Validación local

No necesita PocketBase ni credenciales:

```bash
npm run validate
```

### 2. Simulación contra PocketBase

Comprueba el esquema y duplicados, pero no crea registros:

```bash
npm run dry-run
```

### 3. Importación ficticia

```bash
npm run import -- --confirm IMPORTAR
```

El ejemplo `examples/patients-test.csv` contiene únicamente registros ficticios.

## Otra planilla

```bash
node import-patients.mjs --validate-only --file /ruta/archivo.csv
node --env-file=.env import-patients.mjs --dry-run --file /ruta/archivo.csv
node --env-file=.env import-patients.mjs --apply --confirm IMPORTAR --file /ruta/archivo.csv
```

## Duplicados y reportes

- La clave de control es `document_number`.
- Se rechazan documentos repetidos dentro del CSV.
- Se omiten documentos existentes en PocketBase.
- Cada ejecución genera un JSON en `reports/` con fila, documento, resultado y error, sin copiar la fila completa.

## Particularidad del esquema actual

La migración actual creó el tipo de documento con el nombre `select` en lugar de `document_type`. El importador inspecciona la colección y usa automáticamente cualquiera de los dos nombres, mostrando un aviso cuando encuentra `select`.
