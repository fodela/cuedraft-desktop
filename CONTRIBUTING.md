# Contributing to CueDraft Desktop

Thanks for contributing. This project is open to bug fixes, features, tests, and documentation improvements.

## Ground Rules

- Keep changes focused and scoped.
- Prefer small PRs over large mixed changes.
- Add or update tests for behavior changes.
- Follow existing code style and architecture patterns.

## Development Setup

### 1. Fork and clone

```bash
git clone https://github.com/<your-username>/cuedraft-desktop.git
cd cuedraft-desktop
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development app

```bash
npm run dev
```

### 4. Run tests

```bash
npm test
```

## Branching

Use descriptive branch names, for example:

- `fix/hotkey-registration-linux`
- `feat/template-import-export`
- `docs/readme-install-steps`

## Commit Messages

Use clear commit messages that describe intent and impact.

Examples:

- `fix: handle clipboard fallback on Wayland`
- `feat: add bulk delete for notes`
- `docs: add open source contribution guidelines`

## Pull Request Checklist

Before opening a PR, verify:

- [ ] Code builds successfully (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] New behavior is covered by tests when practical
- [ ] Docs updated if behavior or setup changed
- [ ] PR description explains what changed and why

## Reporting Bugs

Open an issue with:

- What you expected
- What happened
- Steps to reproduce
- OS and desktop environment (especially on Linux)
- Logs or screenshots if useful

## Feature Requests

Open an issue describing:

- Problem statement
- Proposed behavior
- Alternatives considered
- Any UX or platform constraints

## Code of Conduct

By participating, you agree to follow [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
