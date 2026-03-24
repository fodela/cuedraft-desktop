import { BrowserWindow, screen } from 'electron'
import { join } from 'path'

const iconPath = process.platform === 'win32'
  ? join(__dirname, '../../assets/logo.ico')
  : join(__dirname, '../../assets/logo.png')

let pickerWindow: BrowserWindow | null = null
let settingsWindow: BrowserWindow | null = null

export function createPickerWindow(): BrowserWindow {
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    return pickerWindow
  }

  pickerWindow = new BrowserWindow({
    width: 540,
    height: 700,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  pickerWindow.on('blur', () => {
    hidePicker()
  })

  pickerWindow.on('closed', () => {
    pickerWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    pickerWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/picker/`)
  } else {
    pickerWindow.loadFile(join(__dirname, '../renderer/picker/index.html'))
  }

  return pickerWindow
}

export function showPicker(): void {
  const win = pickerWindow ?? createPickerWindow()

  const cursorPoint = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(cursorPoint)
  const { x, y, width, height } = display.workArea

  const winBounds = win.getBounds()
  const posX = Math.round(x + (width - winBounds.width) / 2)
  const posY = Math.round(y + height - winBounds.height - 64)

  win.setPosition(posX, posY)
  win.show()
  win.focus()
  win.webContents.send('picker:show', {})
}

export function hidePicker(): void {
  if (pickerWindow && !pickerWindow.isDestroyed()) {
    pickerWindow.webContents.send('picker:hide')
    pickerWindow.hide()
  }
}

export function togglePicker(): void {
  if (pickerWindow && pickerWindow.isVisible()) {
    hidePicker()
  } else {
    showPicker()
  }
}

export function createSettingsWindow(): BrowserWindow {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return settingsWindow
  }

  settingsWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    icon: iconPath,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  settingsWindow.on('close', (e) => {
    e.preventDefault()
    settingsWindow?.hide()
  })

  settingsWindow.on('closed', () => {
    settingsWindow = null
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    settingsWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}/settings/`)
  } else {
    settingsWindow.loadFile(join(__dirname, '../renderer/settings/index.html'))
  }

  settingsWindow.once('ready-to-show', () => {
    settingsWindow?.show()
  })

  return settingsWindow
}

export function getPickerWindow(): BrowserWindow | null {
  return pickerWindow
}

export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow
}
