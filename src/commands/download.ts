import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import ora from 'ora';
import {
  getVideoInfo,
  downloadVideo as downloadVideoFile,
  downloadTranscripts,
} from '../utils/youtube.js';
import { compressVideo, getVideoInfo as getLocalVideoInfo } from '../utils/ffmpeg.js';

interface CommandOptions {
  output: string;
  quality: string;
  transcript: boolean;
  audioOnly: boolean;
  noVideo: boolean;
  convertSubs: boolean;
  compression: boolean;
  keepOriginal: boolean;
}

export async function downloadVideo(url: string, options: CommandOptions): Promise<void> {
  const spinner = ora('Getting video information...').start();

  try {
    // Get video information
    const videoInfo = await getVideoInfo(url);
    spinner.succeed(
      `Found video: ${chalk.cyan(videoInfo.title)} by ${chalk.yellow(videoInfo.uploader)}`,
    );

    console.log(
      chalk.gray(
        `Duration: ${Math.floor(videoInfo.duration / 60)}:${(videoInfo.duration % 60).toString().padStart(2, '0')}`,
      ),
    );
    console.log(chalk.gray(`Upload date: ${videoInfo.uploadDate}`));

    const outputDir = path.resolve(options.output);
    await fs.mkdir(outputDir, { recursive: true });

    let videoFilePath: string | undefined;
    let transcriptFiles: string[] = [];

    // Download video or audio (skip if --no-video is used)
    if (!options.noVideo) {
      spinner.start(options.audioOnly ? 'Downloading audio...' : 'Downloading video...');
      try {
        await downloadVideoFile(url, {
          outputDir,
          quality: options.quality,
          downloadTranscript: false, // We handle transcripts separately
          audioOnly: options.audioOnly,
        });

        // Find the actual downloaded file
        videoFilePath = await findDownloadedVideoFile(
          outputDir,
          videoInfo.title,
          videoInfo.id,
          options.audioOnly,
        );
        if (videoFilePath) {
          spinner.succeed(
            options.audioOnly
              ? 'Audio downloaded'
              : `Video downloaded: ${chalk.green(path.basename(videoFilePath))}`,
          );
        } else {
          spinner.warn('Download completed but file path could not be determined');
        }
      } catch (error) {
        spinner.fail(options.audioOnly ? 'Audio download failed' : 'Video download failed');
        throw error;
      }
    }

    // Download transcripts if requested
    if (options.transcript) {
      spinner.start('Downloading transcripts...');
      try {
        transcriptFiles = await downloadTranscripts(url, outputDir, options.convertSubs);

        if (transcriptFiles.length > 0) {
          spinner.succeed(`Downloaded ${transcriptFiles.length} transcript(s)`);

          // Organize transcripts
          const organizedTranscripts = await organizeTranscripts(transcriptFiles);
          console.log(chalk.blue('Available transcripts:'));
          Object.entries(organizedTranscripts).forEach(([lang, files]) => {
            const manual = files.manual ? ' (manual)' : '';
            const auto = files.auto ? ' (auto)' : '';
            console.log(`  ${chalk.cyan(lang)}${manual}${auto}`);
          });
        } else {
          spinner.warn('No transcripts available for this video');
        }
      } catch (error) {
        spinner.warn(
          `Transcript download failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }

    // Compress video if requested and we have a video file
    if (!options.noVideo && !options.audioOnly && options.compression && videoFilePath) {
      spinner.start('Compressing video...');
      try {
        const originalInfo = await getLocalVideoInfo(videoFilePath);
        const compressedPath = await compressVideo({
          inputFile: videoFilePath,
          keepOriginal: options.keepOriginal,
        });

        const compressedInfo = await getLocalVideoInfo(compressedPath);
        const sizeSaved = originalInfo.size - compressedInfo.size;
        const percentSaved = ((sizeSaved / originalInfo.size) * 100).toFixed(1);

        spinner.succeed(`Video compressed: ${chalk.green(path.basename(compressedPath))}`);
        console.log(chalk.gray(`Size reduction: ${formatFileSize(sizeSaved)} (${percentSaved}%)`));

        videoFilePath = compressedPath;
      } catch (error) {
        spinner.fail('Video compression failed');
        console.error(
          chalk.red('Compression error:'),
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    // Final summary
    console.log(chalk.green('\n✓ Download completed successfully!'));
    console.log(chalk.blue('Files saved to:'), chalk.cyan(outputDir));

    if (videoFilePath) {
      const finalInfo = await getLocalVideoInfo(videoFilePath);
      console.log(
        chalk.gray(`Video: ${path.basename(videoFilePath)} (${formatFileSize(finalInfo.size)})`),
      );
    }

    if (transcriptFiles.length > 0) {
      console.log(chalk.gray(`Transcripts: ${transcriptFiles.length} files`));
    }
  } catch (error) {
    spinner.fail('Download failed');
    throw error;
  }
}

async function findDownloadedVideoFile(
  outputDir: string,
  title: string,
  videoId: string,
  audioOnly: boolean = false,
): Promise<string | undefined> {
  try {
    const files = await fs.readdir(outputDir);

    // Look for files containing the video ID
    const videoFiles = files.filter(
      (file) =>
        file.includes(videoId) &&
        (audioOnly
          ? file.endsWith('.m4a') || file.endsWith('.webm') || file.endsWith('.mp3')
          : file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.mkv')),
    );

    if (videoFiles.length > 0) {
      return path.join(outputDir, videoFiles[0]);
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

interface TranscriptFiles {
  manual?: string;
  auto?: string;
}

async function organizeTranscripts(
  transcriptFiles: string[],
): Promise<Record<string, TranscriptFiles>> {
  const organized: Record<string, TranscriptFiles> = {};

  for (const filePath of transcriptFiles) {
    const filename = path.basename(filePath);

    // Parse language and type from filename
    // Examples: "Video Title [VideoID].en.vtt", "Video Title [VideoID].en-auto.vtt", "Video Title [VideoID].en.txt"
    const langMatch = filename.match(/\.([a-z]{2}(?:-[a-z]{2})?(?:-auto)?)\.(vtt|txt)$/);
    if (langMatch) {
      const langCode = langMatch[1];
      const isAuto = langCode.includes('-auto');
      const cleanLang = langCode.replace('-auto', '');

      if (!organized[cleanLang]) {
        organized[cleanLang] = {};
      }

      if (isAuto) {
        organized[cleanLang].auto = filePath;
      } else {
        organized[cleanLang].manual = filePath;
      }
    }
  }

  return organized;
}

function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}
