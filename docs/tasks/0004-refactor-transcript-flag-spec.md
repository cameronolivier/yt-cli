# Task 0004: Refactor Transcript Flag Logic

## Description

This task is to refactor the handling of video transcripts to be more intuitive and flexible.

### Requirements:

1.  **New Flag:**
    *   The existing `--no-transcript` flag will be removed and replaced with a new `--transcript` flag.
    *   This new flag will have a short alias of `-t`.

2.  **Default Behavior:**
    *   When downloading a **video**, transcripts should be included by default (`transcript: true`).
    *   When downloading **audio only** (`-a`), transcripts should be excluded by default (`transcript: false`).

3.  **Flag Logic:**
    *   The mere presence of the `--transcript` (or `-t`) flag will **reverse** the default behavior.
        *   For video, `... --transcript` will result in `transcript: false`.
        *   For audio, `... -a --transcript` will result in `transcript: true`.
    *   The flag will also accept an explicit boolean value to override any default.
        *   `... --transcript=true` or `... -t true` will always result in `transcript: true`.
        *   `... --transcript=false` or `... -t false` will always result in `transcript: false`.

4.  **Help Text:**
    *   The command's help output must be updated to clearly explain this new flag, its defaults, and how to use it.
