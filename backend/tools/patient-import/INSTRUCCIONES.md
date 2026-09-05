# Instrucciones para importar pacientes

Esta herramienta importa pacientes desde un archivo CSV hacia la colección `patients` de PocketBase. Se ejecuta únicamente desde terminal.

> Importante: antes de utilizar información real, realizar siempre una validación y un `dry-run`. No subir planillas, credenciales, reportes ni `pb_data` a GitHub.

## 1. Ubicarse en el importador

Desde la raíz de `crear-clinical-management-system`:

```bash
cd backend/tools/patient-import
```

## 2. Instalar dependencias

Solo es necesario la primera vez o después de clonar el repositorio:

```bash
npm install
```

## 3. Configurar PocketBase

Crear el archivo local de configuración:

```bash
cp .env.example .env
```

Abrir `.env` y completar las credenciales del **superusuario técnico de PocketBase**:

```env
PB_URL=http://127.0.0.1:8090
PB_SUPERUSER_EMAIL=email-del-superusuario
PB_SUPERUSER_PASSWORD="contraseña-del-superusuario"
```

No utilizar el usuario administrativo de la aplicación (`staff_users`). Las credenciales deben ser las mismas que permiten ingresar al dashboard técnico de PocketBase.

## 4. Iniciar PocketBase

En otra terminal, desde la raíz del proyecto:

```bash
cd backend
./pocketbase serve
```

PocketBase debe quedar ejecutándose mientras se valida o importa contra la base de datos.

Dashboard técnico:

```text
http://127.0.0.1:8090/_/
```

## 5. Validar el CSV de prueba

Esta operación revisa el archivo localmente. No necesita PocketBase y no crea registros:

```bash
npm run validate
```

Resultado esperado con el ejemplo incluido:

```text
total: 3
valid: 3
invalid: 0
error: 0
```

## 6. Simular la importación

La simulación se conecta a PocketBase y busca documentos duplicados, pero no crea registros:

```bash
npm run dry-run
```

Antes de la primera importación, el resultado esperado es:

```text
ready: 3
imported: 0
duplicate: 0
invalid: 0
error: 0
```

## 7. Importar los pacientes ficticios

Solo ejecutar después de revisar el resultado del `dry-run`:

```bash
npm run import -- --confirm IMPORTAR
```

Resultado esperado:

```text
imported: 3
duplicate: 0
invalid: 0
error: 0
```

La palabra `IMPORTAR` es una confirmación obligatoria para evitar ejecuciones accidentales.

## 8. Verificar los registros

Abrir el dashboard de PocketBase:

```text
http://127.0.0.1:8090/_/
```

Ingresar en:

```text
Collections → patients
```

## 9. Comprobar duplicados

Después de importar, ejecutar nuevamente:

```bash
npm run dry-run
```

Para el CSV de prueba debería indicar:

```text
ready: 0
duplicate: 3
```

El importador usa `document_number` para detectar duplicados.

## Importar otra planilla

### Preparar el archivo

Desde Excel, guardar la hoja como:

```text
CSV UTF-8 delimitado por comas (.csv)
```

### Validación local

```bash
node import-patients.mjs \
  --validate-only \
  --file /ruta/al/archivo.csv
```

### Simulación conectada

```bash
node --env-file=.env import-patients.mjs \
  --dry-run \
  --file /ruta/al/archivo.csv
```

### Importación real

```bash
node --env-file=.env import-patients.mjs \
  --apply \
  --confirm IMPORTAR \
  --file /ruta/al/archivo.csv
```

Si la ruta contiene espacios, encerrarla entre comillas:

```bash
node --env-file=.env import-patients.mjs \
  --dry-run \
  --file "/Users/usuario/Documents/Planillas/Pacientes CREAR.csv"
```

## Columnas obligatorias

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

## Columnas opcionales

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

## Formatos permitidos

Fechas:

```text
YYYY-MM-DD
DD/MM/YYYY
```

Tipo de documento:

```text
dni
passport
other
```

Género:

```text
female
male
non_binary
other
not_specified
```

Estado:

```text
active
inactive
discharged
```

Si `status` está vacío, el importador utiliza `active`.

## Reportes

Cada ejecución crea un reporte JSON dentro de:

```text
backend/tools/patient-import/reports/
```

La carpeta está ignorada por Git. El reporte muestra:

- Total de filas.
- Filas preparadas.
- Registros importados.
- Duplicados.
- Filas inválidas.
- Errores devueltos por PocketBase.

## Errores frecuentes

### `Cannot find package 'csv-parse'`

Faltan las dependencias:

```bash
npm install
```

### `Failed to authenticate`

Revisar que:

- PocketBase esté funcionando.
- `.env` exista.
- Se estén utilizando las credenciales del superusuario técnico.
- La contraseña con símbolos esté encerrada entre comillas.

### Todos los registros aparecen como duplicados

Los documentos ya existen en PocketBase. Esto es normal después de una importación exitosa.

### Aviso sobre `select`

La colección actual utiliza temporalmente `select` como nombre interno del tipo de documento. El importador detecta esa situación y mapea automáticamente la columna CSV `document_type`.

## Secuencia segura resumida

```bash
cd backend/tools/patient-import
npm install
npm run validate
npm run dry-run
npm run import -- --confirm IMPORTAR
npm run dry-run
```

