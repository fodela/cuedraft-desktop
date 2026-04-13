# CueDraft Desktop

> **⚠ Public Alpha** — CueDraft is under active development. APIs, data formats, and features may change between releases. Expect rough edges. [Report bugs on GitHub.](https://github.com/fodela/cuedraft-desktop/issues)

CueDraft Desktop is a system-wide text template picker for Windows and Linux.
Press a global hotkey, search a template, and inject it into the currently focused app.

## Why CueDraft

- Global hotkey (`Ctrl+Shift+Space` by default)
- Fast local template search with SQLite FTS5
- Local-only storage (no cloud sync, no telemetry)
- Tray app workflow with a dedicated settings window
- Typed in TypeScript, built with Electron + React

## Project Status

CueDraft is in **public alpha** (`v0.1.x`). This means:

- Features are incomplete or may change without notice
- Breaking changes can happen between patch releases
- The app has not been security-audited
- Data formats may change (export your templates before upgrading)

Please [open an issue](https://github.com/fodela/cuedraft-desktop/issues) if you hit a bug.

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

## Creating a Release

### Overview

The release process is fully automated. `package.json` is the single source of truth for the version number — it is baked into the app UI at build time, so no source files need to be edited manually.

Running one command locally triggers a chain that ends with signed installers published to GitHub Releases and existing installs notified of the update:

```
npm run release:patch
       │
       ├─ 1. Runs the test suite (aborts if any test fails)
       ├─ 2. Bumps version in package.json
       ├─ 3. Generates / prepends a CHANGELOG.md entry
       ├─ 4. Commits: "chore: release vX.Y.Z"
       ├─ 5. Tags: vX.Y.Z
       └─ 6. Pushes commit + tag → triggers CI
                  │
                  ├─ Builds on Windows, Linux, macOS in parallel
                  ├─ Runs tests on each platform
                  ├─ Packages installers (.exe, .deb, .AppImage, .dmg, .zip)
                  ├─ Uploads latest.yml metadata (powers in-app auto-update)
                  └─ Creates GitHub Release with all artifacts attached
```

---

### Prerequisites

Before cutting a release:

- **Clean working tree.** All changes must be committed. `git status` should show nothing modified or staged.
- **On the `main` branch.** Releases always come from `main`.
- **Conventional commits.** Commit messages since the last tag determine what goes in the CHANGELOG and whether the version bump is appropriate (see below).
- **Push access to `main`.** The release script pushes directly; branch protection rules must allow this or you must use a PAT.

---

### Choosing the right version bump

CueDraft follows [Semantic Versioning](https://semver.org/).

| Command | When to use | Example |
|---|---|---|
| `npm run release:patch` | Bug fixes, small improvements, no new features | `0.1.0 → 0.1.1` |
| `npm run release:minor` | New features that are backward-compatible | `0.1.0 → 0.2.0` |
| `npm run release:major` | Breaking changes to data formats, IPC, or settings | `0.1.0 → 1.0.0` |

During the alpha phase (`0.x.y`), `patch` is used for most releases. `minor` is used when a meaningful feature lands. `major` is reserved for a stable 1.0 launch.

---

### Commit message convention

The CHANGELOG is generated automatically from commit messages. Use the [Angular conventional commit](https://www.conventionalcommits.org/) format:

```
<type>(<optional scope>): <description>

feat: add variable substitution dialog
fix: hotkey not re-registering after sleep
docs: update installation prerequisites
refactor: extract injection logic into platform module
test: add FTS5 prefix search coverage
chore: update electron to 32.3.1
```

| Type | Appears in CHANGELOG as |
|---|---|
| `feat` | Features |
| `fix` | Bug Fixes |
| `perf` | Performance Improvements |
| `refactor`, `test`, `chore`, `docs`, `style` | Hidden from CHANGELOG (internal) |
| `BREAKING CHANGE` in footer | Breaking Changes (triggers major bump recommendation) |

Commits that don't follow this format are included under a generic section. They still work — they just produce less useful changelogs.

---

### Running the release

```bash
# Confirm you are on main with a clean tree
git status

# Cut a patch release (most common)
npm run release:patch
```

`release-it` will interactively confirm the new version before making any changes. Type `y` to proceed.

If tests fail, the process aborts before touching `package.json` or git. Fix the failing tests, then re-run.

---

### What CI does

After the tag is pushed, `.github/workflows/release.yml` runs three parallel jobs — one each for Windows, Linux, and macOS:

1. **Checkout** the tagged commit
2. **Install dependencies** (`npm install`)
3. **Rebuild native modules** (`better-sqlite3` against the Electron headers)
4. **Run tests** — the release is aborted on any platform if tests fail
5. **Build and package** (`electron-vite build` + `electron-builder --publish always`)
6. **Upload artifacts** to the workflow run

After all three build jobs succeed, a fourth job:

7. **Downloads** all artifacts
8. **Creates a GitHub Release** at the tag with auto-generated release notes
9. Attaches all installers **and** the `latest.yml` / `latest-linux.yml` / `latest-mac.yml` metadata files

The metadata files are what `electron-updater` reads in running installs to detect that a new version is available.

---

### Artifacts produced

| Platform | File | Notes |
|---|---|---|
| Windows | `CueDraft-windows.exe` | NSIS installer, per-user install |
| Linux | `CueDraft-linux.deb` | Debian / Ubuntu system package |
| Linux | `CueDraft-linux.AppImage` | Portable, runs on any distro |
| macOS | `CueDraft-mac.dmg` | Drag-to-Applications disk image |
| macOS | `CueDraft-mac.zip` | Used by the auto-updater on macOS |
| All | `latest.yml`, `latest-linux.yml`, `latest-mac.yml` | Auto-update metadata |

---

### In-app auto-update

On Windows and Linux, running installs of CueDraft silently check GitHub Releases for a newer version on each launch. When a new release is detected, the update downloads in the background and the user is prompted with a **Restart Now / Later** dialog.

> macOS auto-update requires a code-signed build. It is currently disabled pending Apple Developer account setup. macOS users must download and install manually from the GitHub Releases page.

---

### Verifying a release

After CI finishes (~10–15 minutes):

1. Open the [GitHub Releases page](https://github.com/fodela/cuedraft-desktop/releases) and confirm the new tag is present with all artifacts attached.
2. Download and install the build for your platform. Check that the About screen shows the correct version number.
3. Confirm `CHANGELOG.md` was updated and the commit `chore: release vX.Y.Z` is in `main`.

---

### Troubleshooting

**Tests fail locally before the release starts**
Fix the failing tests and re-run `npm run release:patch`. Nothing was committed or tagged.

**CI build fails on one platform**
The other platform builds still complete. Go to the failed job in GitHub Actions, read the logs, fix the root cause, and re-run. Re-running CI does not create a duplicate release — `softprops/action-gh-release` updates the existing draft.

**Tag was pushed but CI was not triggered**
Check that the tag matches the `v*` pattern. Push it again: `git push origin vX.Y.Z`.

**Need to delete a bad release**
Delete the GitHub Release and the tag through the GitHub UI, then delete the tag locally:
```bash
git tag -d vX.Y.Z
git push origin :refs/tags/vX.Y.Z
```
Fix the issue, commit, and re-run the release script.

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
