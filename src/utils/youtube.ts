import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';

// Helper function to convert VTT to plain text
async function convertVttToText(vttFilePath: string): Promise<string> {
  const vttContent = await fs.readFile(vttFilePath, 'utf-8');
  const txtFilePath = vttFilePath.replace(/\.vtt$/, '.txt');
  
  // Parse VTT content and extract text
  const lines = vttContent.split('\n');
  const textLines: string[] = [];
  let afterTimestamp = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip VTT headers and metadata
    if (line === 'WEBVTT' || line.startsWith('NOTE ') || line.startsWith('Kind:') || line.startsWith('Language:')) {
      continue;
    }
    
    // Check if this line contains a timestamp
    if (line.includes('-->')) {
      afterTimestamp = true;
      continue;
    }
    
    // If we just passed a timestamp, the next non-empty lines are subtitle text
    if (afterTimestamp && line) {
      // Remove VTT timing tags like <00:00:01.000> and formatting tags like <c>, <i>, etc.
      let cleanText = line
        .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, '') // Remove timing tags
        .replace(/<[^>]*>/g, '') // Remove all other tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      if (cleanText) {
        textLines.push(cleanText);
      }
    }
    
    // Empty line indicates end of subtitle block
    if (line === '') {
      afterTimestamp = false;
    }
  }
  
  // Write the cleaned text to a .txt file
  const textContent = textLines.join(' ').trim(); // Join with spaces instead of newlines for continuous text
  await fs.writeFile(txtFilePath, textContent, 'utf-8');
  
  return txtFilePath;
}

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  uploadDate: string;
}

export interface DownloadOptions {
  outputDir: string;
  quality: string;
  downloadTranscript: boolean;
  audioOnly?: boolean;
}

export async function getVideoInfo(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const ytDlp = spawn('yt-dlp', [
      '--ignore-config',
      '--dump-json',
      '--no-download',
      '--no-write-sub',
      '--no-write-auto-sub',
      url
    ]);

    let output = '';
    let error = '';

    ytDlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      error += data.toString();
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Failed to get video info: ${error}`));
        return;
      }

      try {
        const info = JSON.parse(output);
        resolve({
          id: info.id,
          title: info.title,
          duration: info.duration,
          uploader: info.uploader,
          uploadDate: info.upload_date
        });
      } catch (e) {
        reject(new Error('Failed to parse video info'));
      }
    });
  });
}

export async function downloadVideo(url: string, options: DownloadOptions): Promise<string> {
  // Ensure output directory exists
  await fs.mkdir(options.outputDir, { recursive: true });

  const outputTemplate = path.join(options.outputDir, '%(title)s [%(id)s].%(ext)s');
  
  return new Promise((resolve, reject) => {
    const args = [
      '--ignore-config',
      '--format', options.audioOnly ? 'bestaudio/best' : (options.quality === 'best' ? 'best[ext=mp4]/best' : options.quality),
      '--output', outputTemplate,
      '--embed-metadata',
      '--write-info-json',
      url
    ];

    if (options.audioOnly) {
      args.push('--extract-audio');
      args.push('--audio-format', 'mp3');
    }

    console.log(chalk.blue(options.audioOnly ? 'Downloading audio...' : 'Downloading video...'));
    
    const ytDlp = spawn('yt-dlp', args);

    let output = '';
    let error = '';
    let downloadedFile = '';

    ytDlp.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());
      
      // Try to extract the downloaded filename
      const match = text.match(/\[download\] (.+?) has already been downloaded/);
      if (match) {
        downloadedFile = match[1];
      }
    });

    ytDlp.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      console.error(chalk.yellow(text.trim()));
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Download failed: ${error}`));
        return;
      }

      // If we couldn't extract the filename from output, try to find it
      if (!downloadedFile) {
        // This is a fallback - in practice, yt-dlp should provide the filename
        console.warn(chalk.yellow('Could not determine downloaded filename from output'));
      }

      resolve(downloadedFile || 'Downloaded successfully');
    });
  });
}

export async function downloadTranscripts(url: string, outputDir: string, convertToText: boolean = true): Promise<string[]> {
  await fs.mkdir(outputDir, { recursive: true });

  const outputTemplate = path.join(outputDir, '%(title)s [%(id)s]');
  
  return new Promise((resolve, reject) => {
    const args = [
      '--ignore-config',
      '--write-sub',
      '--write-auto-sub',
      '--sub-format', 'vtt',
      '--skip-download',
      '--output', outputTemplate,
      url
    ];

    console.log(chalk.blue('Downloading transcripts...'));
    
    const ytDlp = spawn('yt-dlp', args);

    let output = '';
    let error = '';
    const downloadedFiles: string[] = [];

    ytDlp.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text.trim());

      // Extract transcript filenames (both vtt and txt)
      const vttMatches = text.match(/\[info\] Writing video subtitles to: (.+\.vtt)/g);
      const txtMatches = text.match(/\[info\] Writing video subtitles to: (.+\.txt)/g);
      
      if (vttMatches) {
        vttMatches.forEach((match: string) => {
          const filename = match.replace('[info] Writing video subtitles to: ', '');
          downloadedFiles.push(filename);
        });
      }
      
      if (txtMatches) {
        txtMatches.forEach((match: string) => {
          const filename = match.replace('[info] Writing video subtitles to: ', '');
          downloadedFiles.push(filename);
        });
      }
    });

    ytDlp.stderr.on('data', (data) => {
      const text = data.toString();
      error += text;
      console.error(chalk.yellow(text.trim()));
    });

    ytDlp.on('close', async (code) => {
      if (code !== 0) {
        reject(new Error(`Transcript download failed: ${error}`));
        return;
      }

      // Convert VTT files to text if requested
      if (convertToText) {
        const convertedFiles: string[] = [];
        for (const vttFile of downloadedFiles) {
          if (vttFile.endsWith('.vtt')) {
            try {
              const txtFile = await convertVttToText(vttFile);
              convertedFiles.push(txtFile);
            } catch (convertError) {
              console.error(chalk.yellow(`Failed to convert ${path.basename(vttFile)} to text: ${convertError instanceof Error ? convertError.message : 'Unknown error'}`));
              // Keep the VTT file in the list if conversion fails
              convertedFiles.push(vttFile);
            }
          } else {
            convertedFiles.push(vttFile);
          }
        }
        resolve([...downloadedFiles, ...convertedFiles.filter(f => f.endsWith('.txt'))]);
      } else {
        resolve(downloadedFiles);
      }
    });
  });
}