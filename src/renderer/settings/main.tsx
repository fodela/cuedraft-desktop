import { createRoot } from 'react-dom/client'
import { SettingsApp } from './SettingsApp'
import './index.css'
import { applyAllSettings } from '../theme'

// Apply dark theme immediately to prevent flash, then update from settings
document.documentElement.setAttribute('data-theme', 'dark')
window.cuedraft.settings.get().then((s) => applyAllSettings(s))

createRoot(document.getElementById('root')!).render(<SettingsApp />)
