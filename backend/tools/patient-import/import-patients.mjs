import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse } from 'csv-parse/sync'
import PocketBase from 'pocketbase'

const TOOL_DIR = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_REPORT_DIR = path.join(TOOL_DIR, 'reports')
const REQUIRED_COLUMNS = [
  'first_name', 'last_name', 'document_type', 'document_number', 'birth_date',
  'gender', 'emergency_contact_name', 'emergency_contact_relationship',
  'emergency_contact_phone',
]
const OPTIONAL_COLUMNS = [
  'address', 'city', 'phone', 'email', 'health_insurance', 'affiliate_number',
  'status', 'administrative_notes',
]
const ALLOWED_COLUMNS = new Set([...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS])

const documentTypes = new Map([
  ['dni', 'dni'], ['documento', 'dni'], ['passport', 'passport'],
  ['pasaporte', 'passport'], ['other', 'other'], ['otro', 'other'],
])
const genders = new Map([
  ['female', 'female'], ['femenino', 'female'], ['male', 'male'],
  ['masculino', 'male'], ['non_binary', 'non_binary'],
  ['no binario', 'non_binary'], ['other', 'other'], ['otro', 'other'],
  ['not_specified', 'not_specified'], ['no especificado', 'not_specified'],
])
const statuses = new Map([
  ['active', 'active'], ['activo', 'active'], ['inactive', 'inactive'],
  ['inactivo', 'inactive'], ['discharged', 'discharged'],
  ['dado de alta', 'discharged'], ['alta', 'discharged'],
])

function printHelp() {
  console.log(`
Importador de pacientes de CREAR

Uso:
  node import-patients.mjs --validate-only --file <archivo.csv>
  node --env-file=.env import-patients.mjs --dry-run --file <archivo.csv>
  node --env-file=.env import-patients.mjs --apply --file <archivo.csv> --confirm IMPORTAR

Modos:
  --validate-only  Valida el CSV localmente. No se conecta a PocketBase.
  --dry-run        Valida y consulta duplicados en PocketBase. No escribe datos.
  --apply          Importa los registros válidos. Requiere --confirm IMPORTAR.

Opciones:
  --file <ruta>        CSV que se procesará.
  --confirm IMPORTAR   Confirmación obligatoria para --apply.
  --report-dir <ruta>  Carpeta de reportes (por defecto: ./reports).
  --help               Muestra esta ayuda.
`)
}

function setMode(currentMode, nextMode) {
  if (currentMode && currentMode !== nextMode) throw new Error('Elegí un solo modo de ejecución.')
  return nextMode
}

function parseArguments(argv) {
  const args = { mode: null, file: null, confirm: null, reportDir: DEFAULT_REPORT_DIR }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--help') args.help = true
    else if (argument === '--validate-only') args.mode = setMode(args.mode, 'validate-only')
    else if (argument === '--dry-run') args.mode = setMode(args.mode, 'dry-run')
    else if (argument === '--apply') args.mode = setMode(args.mode, 'apply')
    else if (argument === '--file') args.file = argv[++index]
    else if (argument === '--confirm') args.confirm = argv[++index]
    else if (argument === '--report-dir') args.reportDir = path.resolve(argv[++index])
    else throw new Error(`Opción desconocida: ${argument}`)
  }
  if (args.help) return args
  if (!args.mode) throw new Error('Indicá --validate-only, --dry-run o --apply.')
  if (!args.file) throw new Error('Falta --file <ruta-del-csv>.')
  if (args.mode === 'apply' && args.confirm !== 'IMPORTAR') {
    throw new Error('Para escribir datos, agregá --confirm IMPORTAR.')
  }
  args.file = path.resolve(args.file)
  return args
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function normalizeEnum(value, values, fieldName, required = true) {
  const normalized = normalizeText(value).toLocaleLowerCase('es-AR')
  if (!normalized && !required) return ''
  const result = values.get(normalized)
  if (!result) throw new Error(`${fieldName} tiene un valor inválido: "${value}".`)
  return result
}

function normalizeDate(value, fieldName) {
  const source = normalizeText(value)
  let year
  let month
  let day
  let match = source.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) [, year, month, day] = match
  if (!match) {
    match = source.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (match) [, day, month, year] = match
  }
  if (!match) throw new Error(`${fieldName} debe usar YYYY-MM-DD o DD/MM/YYYY.`)
  const isoDay = `${year}-${month}-${day}`
  const parsed = new Date(`${isoDay}T00:00:00.000Z`)
  if (
    Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() !== Number(year) ||
    parsed.getUTCMonth() + 1 !== Number(month) || parsed.getUTCDate() !== Number(day)
  ) throw new Error(`${fieldName} contiene una fecha inexistente: "${value}".`)
  if (parsed > new Date()) throw new Error(`${fieldName} no puede estar en el futuro.`)
  return `${isoDay} 00:00:00.000Z`
}

function normalizeEmail(value) {
  const email = normalizeText(value).toLowerCase()
  if (!email) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`email tiene un formato inválido: "${value}".`)
  }
  return email
}

function normalizeRow(row) {
  const requiredText = (field) => {
    const value = normalizeText(row[field])
    if (!value) throw new Error(`${field} es obligatorio.`)
    return value
  }
  return {
    first_name: requiredText('first_name'),
    last_name: requiredText('last_name'),
    document_type: normalizeEnum(row.document_type, documentTypes, 'document_type'),
    document_number: requiredText('document_number').toUpperCase(),
    birth_date: normalizeDate(row.birth_date, 'birth_date'),
    gender: normalizeEnum(row.gender, genders, 'gender'),
    address: normalizeText(row.address),
    city: normalizeText(row.city),
    phone: normalizeText(row.phone),
    email: normalizeEmail(row.email),
    health_insurance: normalizeText(row.health_insurance),
    affiliate_number: normalizeText(row.affiliate_number),
    status: normalizeEnum(row.status || 'active', statuses, 'status'),
    emergency_contact_name: requiredText('emergency_contact_name'),
    emergency_contact_relationship: requiredText('emergency_contact_relationship'),
    emergency_contact_phone: requiredText('emergency_contact_phone'),
    administrative_notes: normalizeText(row.administrative_notes),
  }
}

async function readCsv(file) {
  const source = await fs.readFile(file, 'utf8')
  const records = parse(source, { bom: true, columns: true, skip_empty_lines: true, trim: true })
  const columns = records.length > 0 ? Object.keys(records[0]) : []
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column))
  const unknown = columns.filter((column) => !ALLOWED_COLUMNS.has(column))
  if (missing.length) throw new Error(`Faltan columnas obligatorias: ${missing.join(', ')}.`)
  if (unknown.length) throw new Error(`Hay columnas desconocidas: ${unknown.join(', ')}.`)
  if (!records.length) throw new Error('El CSV no contiene filas de datos.')
  return records
}

function validateRows(records) {
  const seenDocuments = new Set()
  return records.map((row, index) => {
    const csvRow = index + 2
    try {
      const data = normalizeRow(row)
      if (seenDocuments.has(data.document_number)) throw new Error('El documento está repetido dentro del CSV.')
      seenDocuments.add(data.document_number)
      return { row: csvRow, documentNumber: data.document_number, data, status: 'valid' }
    } catch (error) {
      return { row: csvRow, documentNumber: normalizeText(row.document_number) || null, status: 'invalid', error: error.message }
    }
  })
}

async function authenticate() {
  const url = normalizeText(process.env.PB_URL) || 'http://127.0.0.1:8090'
  const email = normalizeText(process.env.PB_SUPERUSER_EMAIL)
  const password = normalizeText(process.env.PB_SUPERUSER_PASSWORD)
  if (!email || !password) throw new Error('Configurá PB_SUPERUSER_EMAIL y PB_SUPERUSER_PASSWORD en .env.')
  const pb = new PocketBase(url)
  pb.autoCancellation(false)
  await pb.collection('_superusers').authWithPassword(email, password)
  return pb
}

async function resolveDocumentTypeField(pb) {
  const collection = await pb.collections.getOne('patients')
  const fields = collection.fields ?? collection.schema ?? []
  const names = new Set(fields.map((field) => field.name))
  if (names.has('document_type')) return 'document_type'
  if (names.has('select')) {
    console.warn('AVISO: patients usa "select" como nombre del tipo de documento.')
    console.warn('Se mapeará document_type del CSV hacia ese campo existente.')
    return 'select'
  }
  throw new Error('patients no tiene document_type ni el campo heredado select.')
}

async function findExistingDocuments(pb) {
  const records = await pb.collection('patients').getFullList({ fields: 'document_number' })
  return new Set(records.map((record) => normalizeText(record.document_number).toUpperCase()))
}

async function processPocketBase(pb, results, mode, documentTypeField) {
  const existingDocuments = await findExistingDocuments(pb)
  for (const result of results) {
    if (result.status !== 'valid') continue
    if (existingDocuments.has(result.documentNumber)) {
      result.status = 'duplicate'
      result.error = 'Ya existe un paciente con este documento en PocketBase.'
      delete result.data
      continue
    }
    if (mode === 'dry-run') {
      result.status = 'ready'
      continue
    }
    const payload = { ...result.data, [documentTypeField]: result.data.document_type }
    delete payload.document_type
    try {
      const created = await pb.collection('patients').create(payload)
      result.status = 'imported'
      result.recordId = created.id
      existingDocuments.add(result.documentNumber)
      delete result.data
    } catch (error) {
      result.status = 'error'
      result.error = error?.response?.message || error.message || 'Error desconocido de PocketBase.'
      if (error?.response?.data) result.details = error.response.data
      delete result.data
    }
  }
}

function createSummary(results) {
  const summary = { total: results.length, valid: 0, ready: 0, imported: 0, duplicate: 0, invalid: 0, error: 0 }
  for (const result of results) if (Object.hasOwn(summary, result.status)) summary[result.status] += 1
  return summary
}

async function writeReport(reportDir, args, results) {
  await fs.mkdir(reportDir, { recursive: true })
  const stamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
  const reportPath = path.join(reportDir, `patient-import-${stamp}.json`)
  const reportResults = results.map(({ data: _data, ...result }) => result)
  const report = { generatedAt: new Date().toISOString(), mode: args.mode, sourceFile: path.basename(args.file), summary: createSummary(results), results: reportResults }
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  return reportPath
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  if (args.help) return printHelp()
  console.log(`Archivo: ${args.file}`)
  console.log(`Modo: ${args.mode}`)
  const records = await readCsv(args.file)
  const results = validateRows(records)
  if (args.mode !== 'validate-only') {
    const pb = await authenticate()
    const documentTypeField = await resolveDocumentTypeField(pb)
    await processPocketBase(pb, results, args.mode, documentTypeField)
    pb.authStore.clear()
  }
  const reportPath = await writeReport(args.reportDir, args, results)
  const summary = createSummary(results)
  console.table(summary)
  for (const result of results.filter((item) => ['invalid', 'duplicate', 'error'].includes(item.status))) {
    console.error(`Fila ${result.row} (${result.documentNumber || 'sin documento'}): ${result.error}`)
  }
  console.log(`Reporte: ${reportPath}`)
  if (summary.invalid > 0 || summary.error > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(`ERROR: ${error.message}`)
  process.exitCode = 1
})
