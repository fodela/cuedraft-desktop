export function AboutScreen() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-100 mb-6">About</h2>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
            C
          </div>
          <div>
            <h3 className="text-sm font-semibold text-zinc-100">CueDraft</h3>
            <p className="text-xs text-zinc-500">Version 0.1.0</p>
          </div>
        </div>

        <p className="text-sm text-zinc-400">
          System-wide text template picker. Press your hotkey from anywhere,
          pick a template, and it types itself.
        </p>

        <div className="text-xs text-zinc-600 space-y-1">
          <p>Privacy-first: all data stored locally</p>
          <p>No network calls, no telemetry</p>
        </div>
      </div>
    </div>
  )
}
