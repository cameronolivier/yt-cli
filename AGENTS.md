# Repository Guidelines

## Project Structure & Module Organization

- `src/index.ts` — CLI entry using `commander`; built to `dist/index.js` and exposed as the `yt` binary.
- `src/commands/` — user-facing command handlers (e.g., `download.ts`).
- `src/utils/` — process helpers (e.g., `youtube.ts` for `yt-dlp`, `ffmpeg.ts` for compression).
- `dist/` — compiled JavaScript output (do not edit).
- `docs/` — task notes and plans.

## Build, Test, and Development Commands

- `pnpm install` — install dependencies.
- `pnpm dev "<url>"` — run TypeScript directly via `ts-node` for local testing.
- `pnpm build` — compile TypeScript with `tsc` to `dist/`.
- `pnpm start "<url>"` — run the built CLI (`node dist/index.js`).
- `pnpm -g install .` — install globally to use `yt` command.
  Note: Runtime tools `yt-dlp` and `ffmpeg` must be installed and available on `PATH`.

## Coding Style & Naming Conventions

- Language: TypeScript. Indent 2 spaces; use semicolons; prefer single quotes.
- Naming: `camelCase` for variables/functions, `PascalCase` for types/interfaces, file names lower-case (`multi-word` allowed with hyphens only if needed).
- Structure: place user commands in `src/commands/`; shared logic in `src/utils/`; keep utils side‑effect free.
- CLI UX: use `chalk` for color, `ora` for spinners, and keep `--help` text consistent with README.
- Prefer async/await and Node’s `path`/`fs/promises` for cross‑platform behavior.

## Testing Guidelines

- No test suite yet. If adding tests, prefer Vitest or Jest.
- Name tests `*.spec.ts` colocated with sources (e.g., `src/utils/youtube.spec.ts`).
- Mock external tools (`yt-dlp`, `ffmpeg`) and file I/O; avoid network/process calls in unit tests.
- Aim for high coverage of `src/utils/`; add smoke tests for CLI argument parsing.

## Commit & Pull Request Guidelines

- Use Conventional Commits: `feat:`, `fix:`, `chore:`, with optional scope (e.g., `fix(download): ...`).
- PRs include: clear description, linked issues, reproduction or command examples, and before/after output when applicable.
- Require: builds pass (`pnpm build`), README and `--help` updated when flags/behavior change.

## Security & Configuration Tips

- Never execute untrusted shell input; pass arguments to `spawn` as arrays.
- Validate URLs early; handle process errors and empty outputs gracefully.
- Do not write outside the chosen output directory; respect user paths.
