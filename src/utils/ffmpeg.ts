import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

export interface CompressionOptions {
  inputFile: string;
  outputFile?: string;
  keepOriginal?: boolean;
}

export async function compressVideo(options: CompressionOptions): Promise<string> {
  const { inputFile, keepOriginal = false } = options;

  // Generate output filename if not provided
  const outputFile = options.outputFile || generateCompressedFilename(inputFile);

  // Check if input file exists
  try {
    await fs.access(inputFile);
  } catch (error) {
    throw new Error(`Input file not found: ${inputFile}`);
  }

  console.log(chalk.blue(`Compressing video: ${path.basename(inputFile)}`));
  console.log(chalk.gray(`Output: ${path.basename(outputFile)}`));

  return new Promise((resolve, reject) => {
    // FFmpeg arguments for lossless compression while maintaining quality
    const args = [
      '-i',
      inputFile,
      '-c:v',
      'libx264', // Use H.264 codec
      '-crf',
      '18', // Constant Rate Factor (18 is visually lossless)
      '-preset',
      'slow', // Slower preset for better compression
      '-c:a',
      'aac', // Use AAC for audio
      '-b:a',
      '128k', // Audio bitrate
      '-movflags',
      '+faststart', // Optimize for web streaming
      '-y', // Overwrite output file if exists
      outputFile,
    ];

    const ffmpeg = spawn('ffmpeg', args);

    let stderr = '';

    ffmpeg.stdout.on('data', (_data) => {
      // FFmpeg outputs progress to stderr, not stdout
    });

    ffmpeg.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;

      // Parse progress information
      if (text.includes('frame=') || text.includes('time=')) {
        // Extract time information for progress
        const timeMatch = text.match(/time=(\d{2}):(\d{2}):(\d{2})\.\d{2}/);
        if (timeMatch) {
          const [, hours, minutes, seconds] = timeMatch;
          const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
          process.stdout.write(`\r${chalk.cyan('Compressing...')} ${totalSeconds}s processed`);
        }
      }
    });

    ffmpeg.on('close', async (code) => {
      process.stdout.write('\n'); // New line after progress output

      if (code !== 0) {
        reject(new Error(`FFmpeg failed with code ${code}: ${stderr}`));
        return;
      }

      try {
        // Check if output file was created and has content
        const stats = await fs.stat(outputFile);
        if (stats.size === 0) {
          throw new Error('Output file is empty');
        }

        console.log(chalk.green(`✓ Compression complete: ${path.basename(outputFile)}`));

        // Remove original file if not keeping it
        if (!keepOriginal) {
          await fs.unlink(inputFile);
          console.log(chalk.gray(`Removed original file: ${path.basename(inputFile)}`));
        }

        resolve(outputFile);
      } catch (error) {
        reject(new Error(`Failed to verify compressed file: ${error}`));
      }
    });

    ffmpeg.on('error', (error) => {
      reject(new Error(`FFmpeg process error: ${error.message}`));
    });
  });
}

export function generateCompressedFilename(inputFile: string): string {
  const parsed = path.parse(inputFile);
  const ext = parsed.ext.toLowerCase() === '.mp4' ? '.mp4' : '.mp4';
  return path.join(parsed.dir, `${parsed.name}_compressed${ext}`);
}

export async function getVideoInfo(filePath: string): Promise<{
  duration: number;
  width: number;
  height: number;
  size: number;
}> {
  const stats = await fs.stat(filePath);

  return new Promise((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      '-show_streams',
      filePath,
    ]);

    let output = '';
    let error = '';

    ffprobe.stdout.on('data', (data) => {
      output += data.toString();
    });

    ffprobe.stderr.on('data', (data) => {
      error += data.toString();
    });

    ffprobe.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFprobe failed: ${error}`));
        return;
      }

      try {
        const info = JSON.parse(output);
        const streams = info.streams as Array<{
          codec_type?: string;
          width?: number;
          height?: number;
        }>;
        const videoStream = streams.find((stream) => stream.codec_type === 'video');

        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: parseFloat(info.format.duration) || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          size: stats.size,
        });
      } catch (e) {
        reject(new Error('Failed to parse video info'));
      }
    });
  });
}
