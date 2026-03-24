import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'
import { togglePicker, createSettingsWindow } from './windows'

let tray: Tray | null = null

export function createTray(): Tray {
  const iconPath = join(__dirname, '../../assets/logo.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 })

  tray = new Tray(icon)
  tray.setToolTip('CueDraft')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Picker',
      click: () => togglePicker(),
    },
    {
      label: 'Manage Templates',
      click: () => createSettingsWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.exit(0)
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  tray.on('double-click', () => {
    togglePicker()
  })

  return tray
}
