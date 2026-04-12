import type { ListQuery, Note, Settings, Template } from '../shared/types'
import { SETTINGS_DEFAULTS } from '../shared/default-settings'

const TITLE_MAX_LENGTH = 200
const CATEGORY_MAX_LENGTH = 100
const CONTENT_MAX_LENGTH = 50_000
const SEARCH_MAX_LENGTH = 200
const HOTKEY_MAX_LENGTH = 100
const LIST_LIMIT_DEFAULT = 50
const LIST_LIMIT_MAX = 200
const WINDOW_OPACITY_MIN = 60
const WINDOW_OPACITY_MAX = 100

const INJECTION_METHODS = new Set<Settings['injectionMethod']>(['auto', 'clipboard'])
const THEMES = new Set<Settings['theme']>(['light', 'dark', 'auto'])
const ACCENT_COLORS = new Set<Settings['accentColor']>([
  'black',
  'purple',
  'blue',
  'pink',
  'violet',
  'indigo',
  'orange',
  'teal',
  'bronze',
  'mint',
])
const BORDER_RADII = new Set<Settings['borderRadius']>(['sharp', 'subtle', 'round'])
const FONTS = new Set<Settings['font']>(['inter', 'geist', 'jetbrains-mono', 'system-ui'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value
}

function sanitizeString(
  value: unknown,
  label: string,
  maxLength: number,
  options: {
    trim?: boolean
    allowNull?: boolean
    allowEmpty?: boolean
    rejectWhitespaceOnly?: boolean
  } = {}
): string | null {
  const {
    trim = true,
    allowNull = false,
    allowEmpty = false,
    rejectWhitespaceOnly = false,
  } = options

  if (value === null && allowNull) return null
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a string`)
  }

  const normalized = trim ? value.trim() : value
  if (!allowEmpty && normalized.length === 0) {
    throw new Error(`${label} cannot be empty`)
  }
  if (rejectWhitespaceOnly && value.trim().length === 0) {
    throw new Error(`${label} cannot be blank`)
  }
  if (normalized.length > maxLength) {
    throw new Error(`${label} exceeds the maximum length of ${maxLength}`)
  }

  return normalized
}

function sanitizePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new Error(`${label} must be a positive integer`)
  }
  return Number(value)
}

function sanitizeOptionalTimestamp(value: unknown, label: string): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || Number(value) < 0) {
    throw new Error(`${label} must be a valid timestamp`)
  }
  return Number(value)
}

function sanitizeNonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    throw new Error(`${label} must be a non-negative integer`)
  }
  return Number(value)
}

function sanitizeBoundedInteger(
  value: unknown,
  label: string,
  minimum: number,
  maximum: number
): number {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`)
  }

  const numberValue = Number(value)
  if (numberValue < minimum || numberValue > maximum) {
    throw new Error(`${label} must be between ${minimum} and ${maximum}`)
  }

  return numberValue
}

function sanitizeBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`${label} must be a boolean`)
  }
  return value
}

function sanitizeEnum<T extends string>(
  value: unknown,
  label: string,
  allowed: ReadonlySet<T>
): T {
  if (typeof value !== 'string' || !allowed.has(value as T)) {
    throw new Error(`${label} is invalid`)
  }
  return value as T
}

function sanitizeCategory(value: unknown): string | null {
  const category = sanitizeString(value, 'category', CATEGORY_MAX_LENGTH, {
    allowNull: true,
    allowEmpty: true,
  })
  return category === '' ? null : category
}

function sanitizeTemplateBase(record: Record<string, unknown>) {
  return {
    title: sanitizeString(record.title, 'title', TITLE_MAX_LENGTH)!,
    content: sanitizeString(record.content, 'content', CONTENT_MAX_LENGTH, {
      trim: false,
      rejectWhitespaceOnly: true,
    })!,
    category: sanitizeCategory(record.category),
  }
}

type SettingsKey = keyof Settings

function parseSettingValue<K extends SettingsKey>(key: K, value: unknown): Settings[K] {
  switch (key) {
    case 'hotkey':
      return sanitizeString(value, key, HOTKEY_MAX_LENGTH)! as Settings[K]
    case 'injectionMethod':
      return sanitizeEnum(value, key, INJECTION_METHODS) as Settings[K]
    case 'launchAtStartup':
    case 'showInTray':
    case 'privacyMode':
    case 'vimMode':
      return sanitizeBoolean(value, key) as Settings[K]
    case 'theme':
      return sanitizeEnum(value, key, THEMES) as Settings[K]
    case 'accentColor':
      return sanitizeEnum(value, key, ACCENT_COLORS) as Settings[K]
    case 'windowOpacity': {
      if (!Number.isFinite(value)) {
        throw new Error(`${key} must be a number`)
      }
      const numberValue = Number(value)
      if (numberValue < WINDOW_OPACITY_MIN || numberValue > WINDOW_OPACITY_MAX) {
        throw new Error(
          `${key} must be between ${WINDOW_OPACITY_MIN} and ${WINDOW_OPACITY_MAX}`
        )
      }
      return numberValue as Settings[K]
    }
    case 'borderRadius':
      return sanitizeEnum(value, key, BORDER_RADII) as Settings[K]
    case 'font':
      return sanitizeEnum(value, key, FONTS) as Settings[K]
  }
}

export function validateIdPayload(payload: unknown): number {
  const record = expectRecord(payload, 'Payload')
  return sanitizePositiveInteger(record.id, 'id')
}

export function validateIdListPayload(payload: unknown): number[] {
  const record = expectRecord(payload, 'Payload')
  const { ids } = record

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error('ids must be a non-empty array')
  }

  return [...new Set(ids.map((id, index) => sanitizePositiveInteger(id, `ids[${index}]`)))]
}

export function validateSearchPayload(payload: unknown): string {
  const record = expectRecord(payload, 'Payload')
  return sanitizeString(record.q, 'q', SEARCH_MAX_LENGTH, {
    allowEmpty: true,
  })!
}

export function validateListQuery(payload: unknown): Required<ListQuery> {
  if (payload === undefined) {
    return {
      search: '',
      category: null,
      limit: LIST_LIMIT_DEFAULT,
      offset: 0,
    }
  }

  const record = expectRecord(payload, 'List query')

  return {
    search: sanitizeString(record.search ?? '', 'search', SEARCH_MAX_LENGTH, {
      allowEmpty: true,
    })!,
    category:
      record.category === undefined
        ? null
        : sanitizeCategory(record.category),
    limit:
      record.limit === undefined
        ? LIST_LIMIT_DEFAULT
        : sanitizeBoundedInteger(record.limit, 'limit', 1, LIST_LIMIT_MAX),
    offset:
      record.offset === undefined
        ? 0
        : sanitizeNonNegativeInteger(record.offset, 'offset'),
  }
}

export function validateCategoryPayload(payload: unknown): string {
  const record = expectRecord(payload, 'Payload')
  return sanitizeString(record.category, 'category', CATEGORY_MAX_LENGTH)!
}

export function validateTemplateCreateData(payload: unknown): Omit<Template, 'id'> {
  const record = expectRecord(payload, 'Template payload')
  const base = sanitizeTemplateBase(record)

  return {
    ...base,
    use_count: sanitizeNonNegativeInteger(record.use_count ?? 0, 'use_count'),
    last_used: sanitizeOptionalTimestamp(record.last_used, 'last_used'),
  }
}

export function validateTemplateUpdateData(payload: unknown): Template {
  const record = expectRecord(payload, 'Template payload')
  return {
    id: sanitizePositiveInteger(record.id, 'id'),
    ...sanitizeTemplateBase(record),
    use_count: sanitizeNonNegativeInteger(record.use_count ?? 0, 'use_count'),
    last_used: sanitizeOptionalTimestamp(record.last_used, 'last_used'),
  }
}

export function validateInjectionPayload(
  payload: unknown
): { content: string; id?: number } {
  const record = expectRecord(payload, 'Injection payload')
  const content = sanitizeString(record.content, 'content', CONTENT_MAX_LENGTH, {
    trim: false,
    rejectWhitespaceOnly: true,
  })!

  return {
    content,
    id: record.id === undefined ? undefined : sanitizePositiveInteger(record.id, 'id'),
  }
}

export function validateNoteCreateData(payload: unknown): Omit<Note, 'id'> {
  const record = expectRecord(payload, 'Note payload')

  return {
    title: sanitizeString(record.title, 'title', TITLE_MAX_LENGTH)!,
    content: sanitizeString(record.content, 'content', CONTENT_MAX_LENGTH, {
      trim: false,
      rejectWhitespaceOnly: true,
    })!,
    category: sanitizeCategory(record.category),
    created_at:
      record.created_at === undefined
        ? Date.now()
        : sanitizeOptionalTimestamp(record.created_at, 'created_at') ?? Date.now(),
  }
}

export function validateNoteUpdateData(payload: unknown): Note {
  const record = expectRecord(payload, 'Note payload')

  return {
    id: sanitizePositiveInteger(record.id, 'id'),
    title: sanitizeString(record.title, 'title', TITLE_MAX_LENGTH)!,
    content: sanitizeString(record.content, 'content', CONTENT_MAX_LENGTH, {
      trim: false,
      rejectWhitespaceOnly: true,
    })!,
    category: sanitizeCategory(record.category),
    created_at:
      sanitizeOptionalTimestamp(record.created_at, 'created_at') ?? Date.now(),
  }
}

export function validateSettingsPatch(payload: unknown): Partial<Settings> {
  const record = expectRecord(payload, 'Settings payload')
  const result: Partial<Settings> = {}

  for (const [key, value] of Object.entries(record)) {
    if (!(key in SETTINGS_DEFAULTS)) {
      throw new Error(`Unknown setting: ${key}`)
    }
    const settingKey = key as SettingsKey
    result[settingKey] = parseSettingValue(settingKey, value)
  }

  return result
}

export function sanitizeStoredSettings(payload: unknown): Partial<Settings> {
  if (!isRecord(payload)) return {}

  const result: Partial<Settings> = {}
  for (const key of Object.keys(SETTINGS_DEFAULTS) as SettingsKey[]) {
    if (!(key in payload)) continue

    try {
      result[key] = parseSettingValue(key, payload[key])
    } catch {
      // Ignore invalid stored values and fall back to defaults.
    }
  }

  return result
}
