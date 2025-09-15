# 0006 — Migrate Project to ESM‑Only

Owner: Junior Engineer
Reviewer: Staff Engineer
Status: Planned
Priority: High

## Goal

Convert the CLI to be ESM‑only across build, runtime, and tooling. Ensure clean local dev (`pnpm dev`), successful build (`pnpm build`), and equivalent runtime behavior for the `yt` binary. Keep package consumability for users unchanged (they still run `yt`).

## Non‑Goals

- Refactoring feature logic unrelated to module system.
- Shipping to npm (separate ticket controls publish automation).
- Changing CLI flags or help text.

## Acceptance Criteria

- Repository compiles to `dist/` with ESM output using TypeScript `NodeNext`.
- `node dist/index.js --help` works without module errors.
- `pnpm dev --help` works under ESM tooling.
- Tests pass (`vitest`).
- `pnpm -g install .` yields a working `yt` command.
- README updated for scoped install example and confirms ESM runtime requirement (Node ≥ 18).

## Risks & Mitigations

- ESM‑only dependencies are fine, but CommonJS expectations in code can break.
  - Mitigation: Switch tsconfig to `module: NodeNext`, adjust JSON import, and verify all imports are ESM‑compatible.
- JSON import in ESM can fail without assertions.
  - Mitigation: Use JSON import assertions in `src/index.ts`.
- Tooling in CJS config files (`*.cjs`) inside an ESM package.
  - Mitigation: Keep configs as `.cjs`; Node treats them as CommonJS even with `type: module`.

---

## Implementation Plan

1. Package metadata

- Update `package.json`:
  - Set `"type": "module"`.
  - Keep `bin.yt` -> `dist/index.js` (shebang preserved by tsc).
  - Add `"engines": { "node": ">=18" }`.
  - Add `"files": ["dist", "README.md", "LICENSE"]`.
  - Add `"types": "dist/index.d.ts"`.
  - For npm scope: rename to `@olvrcc/yt-cli` and add `publishConfig.access = "public"` (scoped public).
  - Add `"prepublishOnly": "pnpm build"`.

2. TypeScript config

- In `tsconfig.json`:
  - Set `module` to `"NodeNext"`.
  - Set `moduleResolution` to `"NodeNext"`.
  - Keep `target: "ES2020"` (or bump to `ES2022` if needed).
  - Keep `declaration`, `declarationMap`, `sourceMap` as currently.
  - Ensure `resolveJsonModule: true` stays enabled.

3. Dev/build scripts

- Update `package.json` scripts:
  - `dev`: use `ts-node --esm src/index.ts` (ts-node ESM mode) or switch to `tsx` if preferred; stick with `ts-node --esm` for now.
  - Keep `build`: `tsc`.

4. Code adjustments

- `src/index.ts`:
  - Replace `import packageJson from '../package.json';` with JSON import assertion:
    - `import packageJson from '../package.json' assert { type: 'json' };`
  - No other changes expected; all other imports are standard ESM.

5. Verify tooling compatibility

- Vitest: run `pnpm test` (Vitest supports ESM; the config file is TypeScript and should work with NodeNext transpilation).
- ESLint/Prettier/commitlint/Husky: configs are `.cjs` and remain valid with `type: module`.
- Semantic‑release: `release.config.cjs` remains valid; no change for this task.

6. Manual validation

- `pnpm install`
- `pnpm dev --help` (ensure commander help prints without ESM errors).
- `pnpm build`
- `node dist/index.js --help`
- Optionally, smoke run against a safe URL in dev to validate flow; do not require `yt-dlp`/`ffmpeg` for help output.

7. Global install smoke test

- `pnpm -g install .`
- `yt --help` (confirm execution from PATH).

8. Docs updates

- README: update Install section to show scoped package `npm i -g @olvrcc/yt-cli` and note Node >= 18.
- Mention that the package is ESM‑only for embedding (FYI), though it’s a CLI.

## Step‑By‑Step Tasks

1. Update `package.json` fields per plan (type, engines, files, types, name, publishConfig, prepublishOnly, dev script `--esm`).
2. Update `tsconfig.json` to `module: NodeNext` and `moduleResolution: NodeNext`.
3. Fix JSON import in `src/index.ts` using import assertions.
4. Build the project and run the built CLI with `--help`.
5. Run tests with `pnpm test` and fix any import path issues.
6. Perform global install smoke test and run `yt --help`.
7. Update README with scoped install command and Node version requirement.
8. Open PR with a clear description and before/after evidence (help output, build logs).

## Definition of Done

- All acceptance criteria met, CI green, docs updated.
- Reviewer signs off after validating local build and CLI help output under Node 18+.

## Notes for Reviewer

- Pay special attention to `dist/index.js` header (shebang retained) and that it is an ESM module (no `require`).
- Confirm `package.json` has correct `type`, `bin`, `types`, `files`, and scoped name.
