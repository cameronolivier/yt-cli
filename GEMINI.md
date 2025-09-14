# GEMINI.md

## Project Overview

This project is a TypeScript-based command-line interface (CLI) tool named `yt-cli` for downloading YouTube videos and their transcripts. It leverages `yt-dlp` for downloading and `ffmpeg` for video compression. The tool is designed to be user-friendly, with a clear command structure and progress indicators.

**Key Technologies:**

- **Language:** TypeScript
- **CLI Framework:** commander.js
- **Dependencies:**
  - `chalk`: For terminal string styling.
  - `ora`: For elegant terminal spinners.
  - `yt-dlp`: For downloading YouTube content (external dependency).
  - `ffmpeg`: For video compression (external dependency).
- **Build Tool:** `tsc` (TypeScript Compiler)
- **Package Manager:** pnpm

**Architecture:**

The project is structured into three main parts:

1.  **`src/index.ts`**: The main entry point of the CLI. It uses `commander.js` to define the command-line interface, parse arguments, and call the appropriate command handlers.
2.  **`src/commands/download.ts`**: This file contains the core logic for the `download` command. It orchestrates the process of getting video information, downloading the video, downloading transcripts, and compressing the video.
3.  **`src/utils/`**: This directory contains utility modules that abstract the interactions with external tools:
    - **`youtube.ts`**: A wrapper around the `yt-dlp` command-line tool to fetch video information and download videos and transcripts.
    - **`ffmpeg.ts`**: A wrapper around the `ffmpeg` and `ffprobe` command-line tools to compress videos and get video information.

## Building and Running

### Prerequisites

- Node.js (v16 or higher)
- `yt-dlp`
- `ffmpeg`

### Installation

```bash
pnpm install
```

### Build

```bash
pnpm build
```

### Run

#### Development Mode

```bash
pnpm dev "https://youtube.com/watch?v=VIDEO_ID"
```

#### Production Mode

```bash
node dist/index.js "https://youtube.com/watch?v=VIDEO_ID"
```

### Testing

There are no tests configured in the project.

```bash
pnpm test
```

## Development Conventions

- **Coding Style:** The code follows standard TypeScript and Node.js conventions. It uses `async/await` for asynchronous operations and ES modules for module management.
- **Error Handling:** Errors are handled using `try...catch` blocks, and informative messages are logged to the console using `chalk`.
- **External Processes:** The tool interacts with `yt-dlp` and `ffmpeg` by spawning child processes. The output of these processes is parsed to provide feedback to the user.
- **File Organization:** The code is organized by feature, with a clear separation of concerns between the command-line interface, command logic, and utility functions.
