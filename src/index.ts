#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { downloadVideo } from './commands/download';
import { version } from '../package.json';

const program = new Command();

program
  .name('yt')
  .description('CLI tool for downloading YouTube videos and transcripts with compression')
  .version(version);

program
  .argument('<url>', 'YouTube video URL')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('-q, --quality <quality>', 'Video quality (best, worst, or specific format)', 'best')
  .option('--no-transcript', 'Skip downloading transcripts')
  .option('--audio-only', 'Download audio only')
  .option('--convert-subs', 'Convert subtitles to plain text format', true)
  .option('--no-compression', 'Skip video compression')
  .option('--keep-original', 'Keep original downloaded file after compression')
  .action(async (url: string, options) => {
    try {
      await downloadVideo(url, options);
    } catch (error) {
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red('Invalid command: %s\nSee --help for a list of available commands.'), program.args.join(' '));
  process.exit(1);
});

program.parse(process.argv);
