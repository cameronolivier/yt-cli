status: no started

# 0001 — Implement Semantic Auto-Versioning (Plan)

## Objective

Automate versioning and changelog generation from Conventional Commits. On merges to `main`, compute next version, tag, update `CHANGELOG.md` and `package.json`, and create a GitHub Release. No npm publish for now.

## Approach

Use `semantic-release` with plugins: commit analyzer, release notes generator, changelog, npm (no publish), git, and github.

## Changes

1. Dependencies (dev)
   - `semantic-release @semantic-release/{commit-analyzer,release-notes-generator,changelog,git,npm,github}`

2. Scripts (package.json)
   - `"release": "semantic-release"`
   - `"release:dry": "semantic-release --dry-run"`

3. Config (.releaserc or release.config.js)
   - Branches: `main`
   - Plugins:
     - `@semantic-release/commit-analyzer` (default Angular preset)
     - `@semantic-release/release-notes-generator`
     - `@semantic-release/changelog` (write `CHANGELOG.md`)
     - `["@semantic-release/npm", { "npmPublish": false }]`
     - `["@semantic-release/git", { "assets": ["package.json", "CHANGELOG.md"], "message": "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}" }]`
     - `@semantic-release/github` (create GitHub Release)

Example `.releaserc`:

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/npm", { "npmPublish": false }],
    [
      "@semantic-release/git",
      {
        "assets": ["package.json", "CHANGELOG.md"],
        "message": "chore(release): ${nextRelease.version}\n\n${nextRelease.notes}"
      }
    ],
    "@semantic-release/github"
  ]
}
```

4. CI (GitHub Actions)
   Create `.github/workflows/release.yml`:

```yaml
name: Release
on:
  push:
    branches: [main]
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Commit Conventions

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, optional scopes (e.g., `fix(download): ...`).
- Breaking changes via `!` or `BREAKING CHANGE:` footer.

## Acceptance Criteria

- `pnpm release:dry` computes a version from current history.
- On push to `main`, CI tags release, updates `CHANGELOG.md` and `package.json`, and creates a GitHub Release.
- No npm publish occurs.

## Risks & Notes

- Non-conventional commits produce no release; enforce via PR checks if needed.
- Ensure `fetch-depth: 0` so history is available.
- We do not commit `dist/`; binaries are built in CI only.
