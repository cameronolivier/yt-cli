# Plan for Adding Command Alias for --audio-only

## 1. Goal

Add a command alias `-a` for the `--audio-only` option in the `yt-cli` tool.

## 2. Strategy

The current implementation has the `--audio-only` option defined in `src/index.ts`. I will modify this file to add the `-a` alias.

### 2.1. Modify `src/index.ts`

I will update the line that defines the `--audio-only` option to include the `-a` alias.

**Current code:**

```typescript
  .option('--audio-only', 'Download audio only')
```

**New code:**

```typescript
  .option('-a, --audio-only', 'Download audio only')
```

## 3. Verification

After making the change, I will verify it by running the help command and checking if the alias is displayed:

```bash
node dist/index.js --help
```

The output should show `-a, --audio-only` in the options list.
