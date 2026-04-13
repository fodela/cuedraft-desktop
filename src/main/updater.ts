import { autoUpdater } from 'electron-updater'
import { dialog, app } from 'electron'
import log from 'electron-log'

export function setupAutoUpdater(): void {
  // Only run in the packaged app — not during `electron-vite dev`
  if (!app.isPackaged) return

  // macOS auto-update requires code-signing; skip until signing is configured
  if (process.platform === 'darwin') return

  autoUpdater.logger = log
  ;(autoUpdater.logger as typeof log).transports.file.level = 'info'

  autoUpdater.checkForUpdatesAndNotify()

  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox({
        type: 'info',
        title: 'Update Ready',
        message: 'A new version of CueDraft has been downloaded.',
        detail: 'Restart the application to apply the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) autoUpdater.quitAndInstall()
      })
  })

  autoUpdater.on('error', (err) => {
    log.error('[updater] auto-update error:', err)
  })
}
