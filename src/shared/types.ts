export interface Template {
  id: number
  title: string
  content: string
  category: string | null
  use_count: number
  last_used: number | null
}

export interface Settings {
  hotkey: string
  injectionMethod: 'auto' | 'clipboard'
  launchAtStartup: boolean
  showInTray: boolean
  privacyMode: boolean
  vimMode: boolean
  theme: 'light' | 'dark' | 'auto'
  accentColor: 'black' | 'purple' | 'blue' | 'pink' | 'violet' | 'indigo' | 'orange' | 'teal' | 'bronze' | 'mint'
  windowOpacity: number
  borderRadius: 'sharp' | 'subtle' | 'round'
  font: 'inter' | 'geist' | 'jetbrains-mono' | 'system-ui'
}

export const IPC = {
  TEMPLATES_GET_ALL: 'templates:getAll',
  TEMPLATES_SEARCH: 'templates:search',
  TEMPLATES_GET_CATEGORIES: 'templates:getCategories',
  TEMPLATES_GET_BY_CATEGORY: 'templates:getByCategory',
  TEMPLATES_GET_BY_ID: 'templates:getById',
  TEMPLATES_CREATE: 'templates:create',
  TEMPLATES_UPDATE: 'templates:update',
  TEMPLATES_DELETE: 'templates:delete',
  TEMPLATES_INJECT: 'templates:inject',
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_RESET: 'settings:reset',
  PICKER_SHOW: 'picker:show',
  PICKER_HIDE: 'picker:hide',
} as const
