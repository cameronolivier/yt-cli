#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { downloadVideo } from './commands/download';
import packageJson from '../package.json';

const program = new Command();

program
  .name('yt')
  .description('CLI tool for downloading YouTube videos and transcripts with compression')
  .version(packageJson.version);

program
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('-q, --quality <quality>', 'Video quality (best, worst, or specific format)', 'best')
  .option('-t, --transcript [enabled]', 'Control transcript download. Flag reverses default (video=on, audio=off).')
  .option('-a, --audio-only', 'Download audio only')
  .option('--convert-subs', 'Convert subtitles to plain text format', true)
  .option('--no-compression', 'Skip video compression')
  .option('--keep-original', 'Keep original downloaded file after compression')
  .action(async (url: string, options) => {
    const youtubeUrlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    if (!youtubeUrlRegex.test(url)) {
      console.error(chalk.red('Error: Invalid YouTube URL provided.'));
      process.exit(1);
    }

    // Transcript logic
    let transcriptValue: boolean;
    const transcriptOption = options.transcript;
    const isAudioOnly = options.audioOnly;
    const defaultTranscript = !isAudioOnly; // true for video, false for audio

    if (transcriptOption === undefined) {
        // Flag not present, use default
        transcriptValue = defaultTranscript;
    } else if (transcriptOption === true) {
        // Flag present without value, e.g., --transcript
        transcriptValue = !defaultTranscript; // Reverse default
    } else {
        // Flag present with value, e.g., --transcript=false
        const lowerCaseOption = String(transcriptOption).toLowerCase();
        if (lowerCaseOption === 'true') {
            transcriptValue = true;
        } else if (lowerCaseOption === 'false') {
            transcriptValue = false;
        } else {
            console.error(chalk.red(`Error: Invalid value for --transcript: "${transcriptOption}". Must be "true" or "false".`));
            process.exit(1);
        }
    }

    const finalOptions = { ...options, transcript: transcriptValue };

    try {
      await downloadVideo(url, finalOptions);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

program.addHelpText('after', `

Transcript Flag Details:
  The --transcript flag controls transcript downloads.

  Default Behavior:
    - For video downloads, transcripts are ON by default.
    - For audio-only downloads, transcripts are OFF by default.

  Overriding the Default:
    - Use the --transcript flag by itself to REVERSE the default behavior.
      e.g., for a video, 'yt <url> --transcript' will turn transcripts OFF.
      e.g., for audio, 'yt <url> -a --transcript' will turn transcripts ON.
    - Explicitly set the value with --transcript=true or --transcript=false.
`);

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});


program.parse(process.argv);
