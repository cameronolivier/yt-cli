status: done

# 0001 — Implement Semantic Auto-Versioning (Plan)

## Objective

Automate versioning and changelog generation from Conventional Commits. On merges to `main`, compute next version, tag, update `CHANGELOG.md` and `package.json`, and create a GitHub Release. No npm publish for now.

## Approach

Use `semantic-release` with plugins: commit analyzer, release notes generator, changelog, npm (no publish), git, and github.

## Changes

1. Dependencies (dev)
   - `semantic-release`
   - `@semantic-release/{commit-analyzer,release-notes-generator,changelog,git,npm,github}`

2. Scripts (package.json)
   - `"release": "semantic-release"`
   - `"release:dry": "semantic-release --dry-run"`
   - `"release:dry:local": "LOCAL_DRY_RUN=1 semantic-release --dry-run --no-ci -e ./release.config.cjs"`

3. Config (`release.config.cjs`)
   - Branches: `main`
   - Plugins:
     - `@semantic-release/commit-analyzer` (Angular preset)
     - `@semantic-release/release-notes-generator`
     - `@semantic-release/changelog` (write `CHANGELOG.md`)
     - `[@semantic-release/npm, { npmPublish: false }]`
     - `[@semantic-release/git, { assets: ["package.json", "CHANGELOG.md"], message: "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}" }]`
     - `@semantic-release/github` (skipped when `LOCAL_DRY_RUN=1`)

4. CI (GitHub Actions)
   - `.github/workflows/release.yml` runs on push to `main`, installs deps, builds, and runs `pnpm release` with `GITHUB_TOKEN`.

## Commit Conventions

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, optional scopes (e.g., `fix(download): ...`).
- Breaking changes via `!` or `BREAKING CHANGE:` footer.

## Verification

Run either of:

```bash
pnpm release:dry         # CI-like preview
pnpm release:dry:local   # local preview without GitHub/network
```

## Acceptance Criteria

- `pnpm release:dry` computes a version from current history.
- On push to `main`, CI tags release, updates `CHANGELOG.md` and `package.json`, and creates a GitHub Release.
- No npm publish occurs.

## Risks & Notes

- Non-conventional commits produce no release; enforce via PR checks if needed.
- Ensure `fetch-depth: 0` so history is available.
- We do not commit `dist/`; binaries are built in CI only.

## Status

- Implemented. Use `pnpm release:dry` for CI-like preview, or `pnpm release:dry:local` to run fully locally without GitHub/network calls.

