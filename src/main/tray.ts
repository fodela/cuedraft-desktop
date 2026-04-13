import { Tray, Menu, app, nativeImage } from 'electron'
import { join } from 'path'
import { togglePicker, createSettingsWindow } from './windows'

let tray: Tray | null = null

export function createTray(): Tray {
  if (tray) return tray

  const iconPath = join(__dirname, '../../assets/logo.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 })

  tray = new Tray(icon)
  tray.setToolTip('CueDraft (Alpha)')

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

export function destroyTray(): void {
  tray?.destroy()
  tray = null
}

export function syncTrayVisibility(showInTray: boolean): void {
  if (showInTray) {
    createTray()
  } else {
    destroyTray()
  }
}

export function hasTray(): boolean {
  return tray !== null
}
