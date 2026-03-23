# CueDraft Desktop — Design Document

**Version:** 0.1 — Draft
**Date:** 2026-03-22
**Platforms:** Windows 10+, Linux (X11 & Wayland)
**Status:** Pre-implementation design

---

## 1. Overview & Goals

CueDraft Desktop is a system-wide text template picker triggered by a global hotkey. It lets users
insert frequently-used text snippets into any focused text field in any application — mirroring the
Android IME version's core promise, adapted for desktop operating systems.

**One-sentence pitch:** Press `Ctrl+Shift+Space` from anywhere, pick a template, and it types itself.

**Core principles:**
- Non-intrusive: lives in the system tray; no window unless hotkey is pressed
- Privacy-first: all data stored locally; no network calls, no telemetry
- Fast: picker appears in <100ms; FTS5 search results in <50ms
- Composable: works alongside any existing app or keyboard setup

**Non-goals (v1):**
- macOS support (planned for v2)
- Cloud sync or template sharing
- Replacing clipboard managers
- Markdown rendering inside templates

---

## 2. Android → Desktop Concept Mapping

| Android (cuedraft) | Desktop (cuedraft-desktop) |
|---|---|
| IME candidates view (above keyboard) | Frameless overlay `BrowserWindow` triggered by hotkey |
| `InputConnection.commitText()` | `robotjs.typeString()` / clipboard paste |
| `Room` + `FTS4` | `better-sqlite3` + `FTS5` |
| `Hilt` DI singletons | Electron main-process module singletons |
| `Jetpack Compose` UI | React 19 + TailwindCSS 4 |
| `CueDraftIMEService` | Electron main process (`src/main/index.ts`) |
| `CandidatesViewWrapper` (lifecycle bridge) | Electron `BrowserWindow` manages renderer lifecycle |
| Companion app (`MainActivity`) | Settings window (second `BrowserWindow`) |
| `AndroidManifest.xml` IME declaration | System tray + autostart `.desktop` / registry entry |

---

## 3. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Package manager / scripts | **Bun** | 1.x | Replaces npm/yarn; faster installs & `bun run` scripts |
| Desktop shell | **Electron** | 32.x | Latest stable; embeds Node 20 LTS internally |
| Language | **TypeScript** | 5.x | Strict mode throughout |
| Bundler | **electron-vite** | Latest | Vite 6 core; HMR for renderer; Bun-compatible scripts |
| UI framework | **React** | 19.x | Concurrent features, `use()`, Actions API, transitions |
| Styling | **TailwindCSS** | 4.x | CSS-first config (`@import "tailwindcss"`); no JS config file |
| Database | **better-sqlite3** | 11.x | Synchronous SQLite; runs only in main process |
| Full-text search | **SQLite FTS5** | built-in | Upgrade from Android's FTS4; better tokenizer |
| Text injection | **robotjs** | 0.6.x | Prebuilt native binaries; wraps `SendInput` / `XTestFakeKeyEvent` |
| Global hotkey | **Electron `globalShortcut`** | built-in | Main-process API; wraps `RegisterHotKey` / `XGrabKey` |
| System tray | **Electron `Tray`** | built-in | Context menu; always-running presence |
| Packaging | **electron-builder** | Latest | NSIS installer (Windows), `.deb` + `.AppImage` (Linux) |
| Testing (unit) | **Vitest 3** | Latest | Run via `bun run test` |
| Testing (e2e) | **Playwright** | Latest | Electron driver for overlay + settings window |

> **Bun + Electron runtime note:** Bun is the *tooling* layer — package manager and script runner.
> Electron's embedded Node.js is the *runtime* layer for the main process. Do not use `bun:*`
> built-in imports inside `src/main/` or `src/preload/`; they are unavailable at runtime.

---

## 4. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Electron Process                     │
│                                                          │
│  ┌──────────────────────┐  typed IPC  ┌───────────────┐ │
│  │     Main Process     │ ◄─────────► │   Renderer    │ │
│  │     (Node.js)        │             │   (React 19)  │ │
│  │                      │             │               │ │
│  │  • globalShortcut    │             │  ┌──────────┐ │ │
│  │  • BrowserWindow mgr │             │  │  Picker  │ │ │
│  │  • text injection    │             │  │ overlay  │ │ │
│  │  • better-sqlite3    │             │  └──────────┘ │ │
│  │  • Tray + Menu       │             │  ┌──────────┐ │ │
│  │  • ipcMain handlers  │             │  │ Settings │ │ │
│  └──────────────────────┘             │  │  window  │ │ │
│           │                           │  └──────────┘ │ │
│  ┌────────┴───────┐                   └───────────────┘ │
│  │    Preload     │  contextBridge (no nodeIntegration)  │
│  │  (typed API)   │                                      │
│  └────────────────┘                                      │
└──────────────────────────────────────────────────────────┘
              │ platform native APIs
              ▼
┌─────────────────────────────────────────┐
│  Windows:  SendInput() via robotjs      │
│  Linux X11: XTestFakeKeyEvent via       │
│             robotjs / xdotool           │
│  Linux Wayland: wl-copy + Ctrl+V paste  │
└─────────────────────────────────────────┘
```

**Responsibility split:**

| Process | Owns |
|---|---|
| Main | Hotkey registration, window lifecycle, DB access, text injection, tray |
| Preload | Typed `contextBridge` surface — the only bridge between main and renderer |
| Renderer | All UI: picker overlay, settings screens, state management |

---

## 5. Global Hotkey & Picker Trigger

### 5.1 Default hotkey

`Ctrl+Shift+Space` — configurable in Settings; stored in user settings JSON.

### 5.2 Registration

```
// src/main/hotkey.ts
app.whenReady()
  → globalShortcut.register(accelerator, onHotkey)
  → onHotkey: pickerWindow.show(); pickerWindow.focus()

app.on('will-quit')
  → globalShortcut.unregisterAll()
```

### 5.3 Platform behaviour

| Platform | Underlying API | Notes |
|---|---|---|
| Windows 10+ | `RegisterHotKey()` | Works across all apps including elevated windows |
| Linux X11 | `XGrabKey()` | Works on GNOME, KDE, XFCE, i3, etc. |
| Linux Wayland | unreliable via `globalShortcut` | See §5.4 |

### 5.4 Wayland hotkey strategy

Wayland's security model prevents arbitrary global key grabs. Electron's `globalShortcut` uses
XWayland under the hood when `ELECTRON_OZONE_PLATFORM_HINT=x11` is set.

**v1 approach — XWayland compatibility mode (recommended):**
- Force XWayland via environment variable set in the `.desktop` launcher:
  ```ini
  Exec=env ELECTRON_OZONE_PLATFORM_HINT=x11 /opt/cuedraft/cuedraft
  ```
- Document this explicitly in the Linux install guide.
- Works on all compositors that ship XWayland (GNOME, KDE Plasma, Hyprland, Sway with XWayland).

**v2 future — DBus GlobalShortcuts portal:**
- `org.freedesktop.impl.portal.GlobalShortcuts` is supported on GNOME 45+ and KDE Plasma 6+.
- Would enable native Wayland hotkeys without XWayland dependency.

### 5.5 Picker show/hide flow

```
1. Hotkey fires
2. Main: record previously-focused app (platform API)
3. Main: send IPC `picker:show` to picker BrowserWindow
4. Picker window: un-hide, position, focus search input
5. User picks template (or presses Escape)
6. Renderer: sends IPC `templates:inject` with resolved content
7. Main: hide picker window → focus returns to prior app
8. Main: inject text (§6)
```

---

## 6. Text Injection

All injection happens in the **main process** (`src/main/injection.ts`), after the picker window
has hidden and OS focus has returned to the target application.

### 6.1 Windows

| Strategy | API | When used |
|---|---|---|
| Primary | `robotjs.typeString(text)` → `SendInput()` | Default; works for user-level processes |
| Fallback | `clipboard.writeText(text)` + `robotjs.keyTap('v', 'control')` | Elevated target windows (UAC) |

Unicode text is passed character-by-character via `SendInput` VK codes. Long templates (>100 chars)
may be slower; clipboard paste is faster and used automatically above a configurable threshold.

### 6.2 Linux X11

| Strategy | API | When used |
|---|---|---|
| Primary | `robotjs.typeString(text)` → `XTestFakeKeyEvent` | Default |
| Fallback | `xdotool type --clearmodifiers -- "<text>"` | If robotjs native module fails to load |

**System prerequisite:** `libxtst` must be installed (`libxtst6` on Debian/Ubuntu, `libxtst` on Arch).
The `.deb` package lists this as a dependency. The `AppImage` bundles it.

### 6.3 Linux Wayland

Wayland has no protocol for a third-party process to inject keystrokes into another app's window.

| Strategy | How | Limitation |
|---|---|---|
| XWayland compat (v1) | Run app in XWayland mode; inject via X11 into XWayland windows | Native Wayland apps (GTK4/Qt6) may not receive X11 events |
| Clipboard paste (fallback) | `wl-copy "<text>"` + simulate `Ctrl+V` | Clobbers clipboard; most apps accept it |
| `zwp_input_method_v2` (v2) | Implement Wayland IME protocol in a helper process | Complex; requires compositor support |

**v1 decision:** XWayland mode + clipboard paste fallback. Detected at runtime:

```
if WAYLAND_DISPLAY is set AND ELECTRON_OZONE_PLATFORM_HINT != 'x11':
  → wl-copy + Ctrl+V
else:
  → robotjs.typeString()  (X11 or XWayland)
```

### 6.4 Runtime injection decision tree

```typescript
async function injectText(text: string): Promise<void> {
  if (process.platform === 'win32') {
    try { robot.typeString(text) }
    catch { pasteViaClipboard(text, 'ctrl+v') }

  } else if (process.platform === 'linux') {
    const isNativeWayland =
      !!process.env.WAYLAND_DISPLAY &&
      process.env.ELECTRON_OZONE_PLATFORM_HINT !== 'x11'

    if (isNativeWayland) {
      await pasteViaWlCopy(text)
    } else {
      try { robot.typeString(text) }
      catch { await execa('xdotool', ['type', '--clearmodifiers', '--', text]) }
    }
  }
}
```

---

## 7. Overlay Window (Picker)

### 7.1 BrowserWindow configuration

```typescript
new BrowserWindow({
  width: 480,
  height: 420,         // max; content scrolls inside
  frame: false,
  transparent: true,
  alwaysOnTop: true,
  skipTaskbar: true,
  resizable: false,
  focusable: true,     // must focus for keyboard search input
  show: false,         // hidden until hotkey
  webPreferences: {
    preload: PRELOAD_PATH,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
  },
})
```

### 7.2 Positioning

On hotkey press, position the window:
1. Query `screen.getCursorScreenPoint()` → find the display the cursor is on
2. Anchor: horizontally centered on that display, 64px above the bottom of the workArea
3. Clamp to screen bounds so it never appears off-screen

### 7.3 UI layout

```
┌────────────────────────────────────────────┐
│  ✦  Search templates...              [Esc] │  ← SearchBar (auto-focused)
├────────────────────────────────────────────┤
│  [All]  [Work]  [Personal]                 │  ← CategoryFilter
├────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Meeting Notes   │  │ Project Update │  │  ← TemplateChip (2-col grid)
│  │  Work  ·  3 uses │  │ Work  ·  1 use │  │
│  └──────────────────┘  └────────────────┘  │
│  ┌──────────────────┐  ┌────────────────┐  │
│  │  Thank You Note  │  │   Follow-up    │  │
│  │  Personal · 0    │  │ Personal · 2   │  │
│  └──────────────────┘  └────────────────┘  │
│                              ↕ scroll      │
└────────────────────────────────────────────┘
```

**Keyboard navigation:**
- `↓ / ↑` — move focus between chips
- `Enter` — select focused chip
- `Escape` — close picker without injecting
- Any character — routes to search input

### 7.4 Animation

| Event | Animation |
|---|---|
| Show | `translateY(12px) → 0` + `opacity 0 → 1`, 120ms ease-out |
| Hide | `opacity 1 → 0`, 80ms ease-in; then `window.hide()` |

### 7.5 Variable substitution

If the selected template body contains one or more `{{variable_name}}` tokens, before injecting:

1. Parse all distinct variable names from the content (regex: `/\{\{(\w+)\}\}/g`)
2. Show a modal dialog inside the picker overlay listing each variable with a labeled input
3. On confirm: replace all occurrences of each `{{name}}` with the entered value
4. On cancel: do not inject; return to template list

---

## 8. Data Layer

### 8.1 Database location

Resolved via `app.getPath('userData')`:

| OS | Path |
|---|---|
| Windows | `%APPDATA%\cuedraft\cuedraft.db` |
| Linux | `~/.config/cuedraft/cuedraft.db` |

### 8.2 Schema

```sql
-- Core table
CREATE TABLE IF NOT EXISTS templates (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  title     TEXT    NOT NULL,
  content   TEXT    NOT NULL,
  category  TEXT,                          -- NULL = uncategorized
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used INTEGER                        -- Unix ms; NULL = never used
);

-- FTS5 virtual table for full-text search
-- content= keeps FTS in sync with the source table rows
CREATE VIRTUAL TABLE IF NOT EXISTS templates_fts USING fts5(
  title,
  content,
  content='templates',
  content_rowid='id',
  tokenize='unicode61'
);

-- Sync triggers
CREATE TRIGGER IF NOT EXISTS templates_ai
  AFTER INSERT ON templates BEGIN
    INSERT INTO templates_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
  END;

CREATE TRIGGER IF NOT EXISTS templates_ad
  AFTER DELETE ON templates BEGIN
    INSERT INTO templates_fts(templates_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
  END;

CREATE TRIGGER IF NOT EXISTS templates_au
  AFTER UPDATE ON templates BEGIN
    INSERT INTO templates_fts(templates_fts, rowid, title, content)
    VALUES ('delete', old.id, old.title, old.content);
    INSERT INTO templates_fts(rowid, title, content)
    VALUES (new.id, new.title, new.content);
  END;
```

> **FTS4 → FTS5 upgrade:** The Android version uses FTS4. Desktop uses FTS5 for better prefix
> matching, the `unicode61` tokenizer (handles accented characters), and the `content=` feature
> that avoids duplicating row data.

### 8.3 Queries (`src/main/db/repository.ts`)

Maps 1-to-1 with Android's `TemplateDao.kt` + `TemplateRepository.kt`:

| Method | SQL | Android counterpart |
|---|---|---|
| `getAll()` | `SELECT * FROM templates ORDER BY last_used DESC NULLS LAST, use_count DESC` | `getAll(): Flow<List<Template>>` |
| `search(q)` | `SELECT t.* FROM templates t JOIN templates_fts f ON t.id = f.rowid WHERE f MATCH ? ORDER BY rank` | `search(q): Flow<List<Template>>` |
| `getCategories()` | `SELECT DISTINCT category FROM templates WHERE category IS NOT NULL` | `getDistinctCategories()` |
| `getByCategory(c)` | `SELECT * FROM templates WHERE category = ? ORDER BY last_used DESC` | `getByCategory()` |
| `insert(t)` | `INSERT INTO templates ...` | `insert(template)` |
| `update(t)` | `UPDATE templates SET ... WHERE id = ?` | `update(template)` |
| `delete(id)` | `DELETE FROM templates WHERE id = ?` | `delete(template)` |
| `recordUsage(id)` | `UPDATE templates SET use_count = use_count + 1, last_used = ? WHERE id = ?` | `recordUsage(id)` |

### 8.4 Seed data

Inserted on first launch (detected by empty `templates` table):

| Title | Category | Content |
|---|---|---|
| Meeting Notes | Work | `Date: {{Date}}\nAttendees:\n\nAgenda:\n\nAction items:` |
| Project Update | Work | `Project: \nStatus: On track\nCompleted this week:\nNext steps:` |
| Thank You Note | Personal | `Thank you so much for your help with this. I really appreciate it.` |
| Weekly Report | Work | `Week of {{Date}}\n\nAccomplishments:\nBlockers:\nNext week:` |
| Follow-up | Personal | `Just following up on my previous message. Please let me know if you need anything.` |

---

## 9. IPC Channel Contract

All communication uses `ipcMain.handle` / `ipcRenderer.invoke` (request-response) or
`ipcMain.send` / `ipcRenderer.on` (one-way push). The preload script exposes a typed
`window.cuedraft` object via `contextBridge`.

```typescript
// src/shared/types.ts
export interface Template {
  id: number
  title: string
  content: string
  category: string | null
  use_count: number
  last_used: number | null
}

export interface Settings {
  hotkey: string           // e.g. 'Ctrl+Shift+Space'
  injectionMethod: 'auto' | 'clipboard'
  launchAtStartup: boolean
  theme: 'system' | 'light' | 'dark'
}
```

| Channel | Direction | Request payload | Response | Description |
|---|---|---|---|---|
| `templates:getAll` | renderer → main | — | `Template[]` | All templates, sorted |
| `templates:search` | renderer → main | `{ q: string }` | `Template[]` | FTS5 prefix search |
| `templates:getCategories` | renderer → main | — | `string[]` | Distinct category list |
| `templates:getByCategory` | renderer → main | `{ category: string }` | `Template[]` | Filter by category |
| `templates:create` | renderer → main | `Omit<Template, 'id'>` | `Template` | Insert new template |
| `templates:update` | renderer → main | `Template` | `Template` | Update existing |
| `templates:delete` | renderer → main | `{ id: number }` | `void` | Delete by id |
| `templates:inject` | renderer → main | `{ content: string }` | `void` | Hide picker + inject |
| `settings:get` | renderer → main | — | `Settings` | Load settings |
| `settings:set` | renderer → main | `Partial<Settings>` | `Settings` | Merge + save settings |
| `picker:show` | main → renderer | `{ query?: string }` | — | Show picker (push) |
| `picker:hide` | main → renderer | — | — | Hide picker (push) |

---

## 10. Settings Window

A second `BrowserWindow` (non-frameless, standard OS chrome) opened from the tray menu.

### 10.1 Screens

**Home — Template List**
```
┌──────────────────────────────────────────┐
│  CueDraft  [+ New Template]              │
├──────────────────────────────────────────┤
│  Meeting Notes          Work  · 3 uses   │
│  Project Update         Work  · 1 use    │
│  Thank You Note     Personal  · 0 uses   │
│  ─────────────────────────────────────── │
│  [Edit]  [Delete]  (per row actions)     │
└──────────────────────────────────────────┘
```

**Edit Template**
```
  Title:    [________________________]
  Content:  [                        ]
            [  multiline textarea    ]
            [________________________]
  Category: [____________] (optional)
            [Save]  [Cancel]
```

**Settings**
```
  Hotkey:           [Ctrl+Shift+Space]  (click to rebind)
  Injection method: ( ) Auto  ( ) Clipboard only
  Launch at startup: [✓]
  Theme:            [System ▾]
```

### 10.2 Hotkey rebinding

The hotkey input captures `keydown` events and formats them as an Electron accelerator string
(e.g. `Ctrl+Shift+Space`). On save, the main process unregisters the old hotkey and registers
the new one. Stored in `settings.json` in `app.getPath('userData')`.

---

## 11. System Tray

The app runs as a background process with no taskbar/Dock entry. The tray is the primary entry point.

**Tray icon:** Custom `✦` glyph rendered to a 16×16 PNG (Windows: `ico` format with multiple sizes).

**Context menu:**

```
CueDraft
────────────────────
Open Picker          ← same as hotkey
Manage Templates     ← opens Settings window to Home screen
Settings             ← opens Settings window to Settings screen
────────────────────
Quit
```

**Double-click** on tray icon → same as "Open Picker".

**`app.on('window-all-closed')`:** Do NOT quit; keep running in tray. Quit only via tray menu.

---

## 12. Project Structure

```
cuedraft-desktop/
├── src/
│   ├── main/
│   │   ├── index.ts              # App entry: windows, tray, lifecycle
│   │   ├── hotkey.ts             # globalShortcut registration & Wayland note
│   │   ├── injection.ts          # Platform-branched text injection
│   │   ├── windows.ts            # BrowserWindow factory functions
│   │   ├── db/
│   │   │   ├── database.ts       # DB init, schema creation, seed data
│   │   │   └── repository.ts     # All SQL query methods
│   │   └── ipc/
│   │       ├── templates.ts      # ipcMain handlers for template channels
│   │       └── settings.ts       # ipcMain handlers for settings channels
│   ├── preload/
│   │   └── index.ts              # contextBridge → window.cuedraft API
│   ├── renderer/
│   │   ├── picker/
│   │   │   ├── index.html
│   │   │   ├── main.tsx          # React root (React 19 createRoot)
│   │   │   ├── PickerApp.tsx     # Root component; orchestrates picker state
│   │   │   ├── SearchBar.tsx     # Debounced (150ms) search input, auto-focus
│   │   │   ├── CategoryFilter.tsx # Horizontal chip scroll for categories
│   │   │   ├── TemplateChip.tsx  # Individual template card
│   │   │   └── VariableDialog.tsx # Modal for {{variable}} substitution
│   │   └── settings/
│   │       ├── index.html
│   │       ├── main.tsx          # React root
│   │       ├── SettingsApp.tsx   # Router shell
│   │       ├── HomeScreen.tsx    # Template list
│   │       ├── EditTemplateScreen.tsx
│   │       └── SettingsScreen.tsx
│   └── shared/
│       └── types.ts              # Template, Settings, IPC payload types
├── assets/
│   ├── tray-icon.png             # 32×32 for Linux
│   ├── tray-icon@2x.png          # 64×64 HiDPI
│   └── tray-icon.ico             # Multi-size ICO for Windows
├── electron-builder.yml          # Packaging: nsis, deb, rpm, AppImage
├── electron.vite.config.ts       # electron-vite bundler config
├── tsconfig.json                 # TypeScript project references
├── tsconfig.main.json            # main + preload compiler options
├── tsconfig.renderer.json        # renderer compiler options
├── bunfig.toml                   # Bun config (test runner, registry)
└── package.json                  # scripts: dev, build, test, preview
```

### 12.1 Key scripts (`package.json`)

```json
{
  "scripts": {
    "dev":     "electron-vite dev",
    "build":   "electron-vite build && electron-builder",
    "preview": "electron-vite preview",
    "test":    "vitest run",
    "test:e2e": "playwright test"
  }
}
```

All run via `bun run <script>`.

---

## 13. Platform-Specific Packaging

### 13.1 Windows

| Item | Detail |
|---|---|
| Installer | NSIS (`.exe`) via electron-builder `nsis` target |
| Install location | `%LOCALAPPDATA%\Programs\CueDraft\` |
| Startup | `HKCU\Software\Microsoft\Windows\CurrentVersion\Run\CueDraft` |
| Tray icon format | `.ico` with 16, 32, 48, 256px sizes |
| Permissions | No elevation required; SendInput works at user level |
| Antivirus note | Some AV software flags `SendInput`; document whitelist step |

### 13.2 Linux

| Item | Detail |
|---|---|
| Packages | `.deb` (Debian/Ubuntu), `.rpm` (Fedora/RHEL), `.AppImage` (universal) |
| Install location | `/opt/cuedraft/` (deb/rpm) or self-contained (AppImage) |
| Desktop entry | `/usr/share/applications/cuedraft.desktop` |
| Autostart | `~/.config/autostart/cuedraft.desktop` (written by app on first launch if enabled) |
| X11 dependency | `libxtst6` listed as deb dependency; bundled in AppImage |
| Wayland env flag | `ELECTRON_OZONE_PLATFORM_HINT=x11` set in `Exec=` line of `.desktop` |

**Sample `.desktop` entry:**
```ini
[Desktop Entry]
Name=CueDraft
Comment=System-wide text template picker
Exec=env ELECTRON_OZONE_PLATFORM_HINT=x11 /opt/cuedraft/cuedraft %U
Icon=cuedraft
Type=Application
Categories=Utility;
StartupNotify=false
```

---

## 14. Security

| Area | Approach |
|---|---|
| Renderer isolation | `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` |
| IPC surface | All DB and injection logic in main process only; renderer has no Node.js access |
| CSP | `Content-Security-Policy: default-src 'self'; script-src 'self'` |
| Template content | Sanitized before injection: strip null bytes, limit to 10,000 chars |
| Settings file | Written to `userData` dir; no sensitive data (no passwords, tokens) |
| No network | Zero outbound network calls; no auto-update (v1) |

---

## 15. Known Limitations & Future Work

| Limitation | v1 Mitigation | Future path |
|---|---|---|
| Wayland global hotkeys | XWayland compat + `ELECTRON_OZONE_PLATFORM_HINT=x11` | DBus `GlobalShortcuts` portal |
| Wayland text injection into native Wayland apps | Clipboard paste fallback (`wl-copy`) | `zwp_input_method_v2` helper process |
| Windows UAC-elevated windows block SendInput | Clipboard paste fallback | Document limitation |
| macOS | Out of scope | CGEventPost + AXUIElement, requires accessibility permission |
| robotjs prebuilts for Node 22+ | Pin to Electron 32 (Node 20) | Migrate to `@jitsi/robotjs` or `nut-js` |
| Auto-update | None | `electron-updater` with a release server |
| Template import/export | None | JSON export/import in Settings |

---

## 16. Milestones

| # | Milestone | Deliverables |
|---|---|---|
| M0 | Scaffold | electron-vite + Bun + React 19 + TailwindCSS 4 boilerplate; tray icon; two windows wired up |
| M1 | Data layer | `better-sqlite3` init, FTS5 schema, seed data, `TemplateRepository`, all IPC handlers |
| M2 | Picker UI | Overlay window; SearchBar with debounce; CategoryFilter; TemplateChip grid; animations |
| M3 | Injection | `robotjs` integration; platform detection; clipboard fallback; Wayland detection |
| M4 | Variable substitution | `{{variable}}` parser; VariableDialog; resolved injection |
| M5 | Settings window | HomeScreen CRUD; EditTemplateScreen; SettingsScreen; hotkey rebinding; startup toggle |
| M6 | Packaging | electron-builder config; NSIS + deb + AppImage; `.desktop` entry with Wayland flag; install docs |

---

## 17. Verification Checklist

When implementation is complete, verify end-to-end:

- [ ] `bun install` completes without errors
- [ ] `bun run dev` launches app with tray icon visible
- [ ] Hotkey `Ctrl+Shift+Space` shows picker overlay within 100ms
- [ ] Typing in SearchBar debounces 150ms and returns FTS5 results
- [ ] CategoryFilter filters template list correctly
- [ ] Clicking a TemplateChip injects text into the previously-focused field
- [ ] Template with `{{date}}` shows VariableDialog; confirmed value is injected
- [ ] Escape dismisses picker without injecting
- [ ] Tray menu → "Manage Templates" opens Settings window to HomeScreen
- [ ] Creating, editing, deleting templates persists to SQLite
- [ ] Hotkey rebinding in Settings takes effect immediately
- [ ] `bun run build` produces `.exe` (Windows) and `.deb` + `.AppImage` (Linux)
- [ ] On Wayland: launching with `ELECTRON_OZONE_PLATFORM_HINT=x11` — hotkey and injection work
- [ ] On Wayland (native, no XWayland): clipboard paste fallback inserts text correctly

---

## Appendix: Android Counterpart Reference

| Desktop file | Android counterpart (cuedraft/) |
|---|---|
| `src/main/db/repository.ts` | `app/…/data/TemplateRepository.kt` + `TemplateDao.kt` |
| `src/main/db/database.ts` | `app/…/data/TemplateDatabase.kt` |
| `src/main/injection.ts` | `app/…/ime/TemplateInjector.kt` |
| `src/main/hotkey.ts` | `AndroidManifest.xml` IME service + `CueDraftIMEService.kt` |
| `src/renderer/picker/PickerApp.tsx` | `app/…/ui/picker/TemplatePicker.kt` |
| `src/renderer/picker/SearchBar.tsx` | `app/…/ui/picker/SearchBar.kt` |
| `src/renderer/picker/CategoryFilter.tsx` | `app/…/ui/picker/CategoryFilter.kt` |
| `src/renderer/picker/TemplateChip.tsx` | `app/…/ui/picker/TemplateChip.kt` |
| `src/renderer/picker/VariableDialog.tsx` | `app/…/ui/picker/VariableSubstitutionDialog.kt` |
| `src/renderer/settings/HomeScreen.tsx` | `app/…/ui/main/HomeScreen.kt` |
| `src/renderer/settings/EditTemplateScreen.tsx` | `app/…/ui/main/EditTemplateScreen.kt` |
| `src/shared/types.ts` (Template) | `app/…/data/Template.kt` |
| `PickerViewModel` (in PickerApp state) | `app/…/viewmodel/PickerViewModel.kt` |
