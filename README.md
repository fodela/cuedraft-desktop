# CueDraft Desktop

CueDraft Desktop is a system-wide text template picker for Windows and Linux.
Press a global hotkey, search a template, and inject it into the currently focused app.

## Why CueDraft

- Global hotkey (`Ctrl+Shift+Space` by default)
- Fast local template search with SQLite FTS5
- Local-only storage (no cloud sync, no telemetry)
- Tray app workflow with a dedicated settings window
- Typed in TypeScript, built with Electron + React

## Project Status

`0.1.x` is pre-1.0 and under active development.
Expect rapid iteration and occasional breaking changes.

## Tech Stack

- Electron 32
- React 19
- TypeScript 5
- better-sqlite3 + SQLite FTS5
- Vitest + Playwright

## Supported Platforms

- Windows 10+
- Linux (X11 and Wayland with clipboard fallback)
- macOS packaging is available, but runtime support is not yet officially documented as stable

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Linux only: `libxtst` (for native typing support)

### Install and Run

```bash
npm install
npm run dev
```

### Run Tests

```bash
npm test
```

### Build Production Bundles

```bash
npm run dist
```

Platform-specific builds:

```bash
npm run dist:win
npm run dist:linux
npm run dist:mac
```

## Development Scripts

- `npm run dev`: start the Electron app in development mode
- `npm run build`: build main/preload/renderer bundles
- `npm run preview`: preview build output
- `npm test`: run unit tests with Vitest
- `npm run test:watch`: run Vitest in watch mode
- `npm run test:coverage`: run Vitest with coverage
- `npm run test:e2e`: run Playwright end-to-end tests

## Creating a GitHub Release

Releases are automated via GitHub Actions (`.github/workflows/release.yml`).

1. Update version in `package.json` (for example `0.1.0` -> `0.1.1`).
2. Commit and push to `main`.
3. Create and push a version tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

4. Wait for the `Release` workflow to finish.

The workflow builds installers for Windows, Linux, and macOS, then publishes them to the GitHub Release for that tag.

## Data and Privacy

CueDraft is privacy-first by design:

- Templates and notes are stored locally in SQLite
- No telemetry or analytics calls
- No network dependency for core functionality

Database location:

- `${app.getPath('userData')}/cuedraft.db`

## Repository Structure

- `src/main`: Electron main process (hotkey, tray, injection, DB, IPC)
- `src/preload`: secure renderer bridge via `contextBridge`
- `src/renderer`: picker and settings UIs
- `src/shared`: cross-process shared types/utilities
- `.github/workflows`: CI/release workflows

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

- Bug reports and feature requests: [GitHub Issues](https://github.com/fodela/cuedraft-desktop/issues)
- Security reports: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)

## License

Distributed under the MIT License. See [LICENSE](./LICENSE).
