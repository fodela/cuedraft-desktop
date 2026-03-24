import { createRoot } from 'react-dom/client'
import { PickerApp } from './PickerApp'
import './index.css'
import { applyAllSettings } from '../theme'

document.documentElement.setAttribute('data-theme', 'dark')
window.cuedraft.settings.get().then((s) => applyAllSettings(s))

createRoot(document.getElementById('root')!).render(<PickerApp />)
