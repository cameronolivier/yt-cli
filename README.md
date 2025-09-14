# yt-cli

A TypeScript CLI tool for downloading YouTube videos and transcripts with smart compression.

## Features

- 🎥 Download YouTube videos in various qualities
- 📝 Download transcripts (manual preferred over auto-generated)
- 🗜️ Lossless video compression using FFmpeg
- 📁 Organized file management
- 🎨 Beautiful CLI interface with progress indicators
- ⚡ Built with TypeScript for reliability

## Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - for downloading YouTube content
- [FFmpeg](https://ffmpeg.org/) - for video compression

### Installing Prerequisites

**macOS (with Homebrew):**
```bash
brew install yt-dlp ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install yt-dlp ffmpeg
```

**Windows:**
- Install yt-dlp: https://github.com/yt-dlp/yt-dlp#installation
- Install FFmpeg: https://ffmpeg.org/download.html

## Installation

### Global Installation
```bash
pnpm install -g .
```

### Local Development
```bash
pnpm install
pnpm build
```

## Usage

### Basic Download
```bash
yt "https://youtube.com/watch?v=VIDEO_ID"
```

### Advanced Options
```bash
# Download to specific directory
yt "https://youtube.com/watch?v=VIDEO_ID" -o ./my-videos

# Download with specific quality
yt "https://youtube.com/watch?v=VIDEO_ID" -q "720p"

# Skip transcripts
yt "https://youtube.com/watch?v=VIDEO_ID" --no-transcript

# Skip compression
yt "https://youtube.com/watch?v=VIDEO_ID" --no-compression

# Keep original file after compression
yt "https://youtube.com/watch?v=VIDEO_ID" --keep-original
```

### Command Reference

```bash
yt <url> [options]
```

**Arguments:**
- `url` - YouTube video URL

**Options:**
- `-o, --output <dir>` - Output directory (default: "./downloads")
- `-q, --quality <quality>` - Video quality: "best", "worst", or specific format (default: "best")
- `--no-transcript` - Skip downloading transcripts
- `--no-compression` - Skip video compression
- `--keep-original` - Keep original downloaded file after compression
- `-h, --help` - Display help for command

## How It Works

1. **Video Information**: Fetches video metadata using yt-dlp
2. **Download**: Downloads the video in the specified quality
3. **Transcripts**: Downloads available transcripts (manual preferred over auto-generated)
4. **Compression**: Applies lossless compression using FFmpeg with:
   - H.264 codec
   - CRF 18 (visually lossless)
   - Optimized settings for quality and file size
5. **Organization**: Organizes transcripts by language and type

## Compression Details

The tool uses FFmpeg with the following settings for optimal compression:

- **Video Codec**: libx264
- **CRF**: 18 (visually lossless quality)
- **Preset**: slow (better compression efficiency)
- **Audio Codec**: AAC at 128k bitrate
- **Optimization**: Fast-start for web streaming

This typically reduces file size by 20-50% while maintaining excellent visual quality.

## Transcript Handling

The tool intelligently handles transcripts:

- Downloads both manual and auto-generated transcripts when available
- Prefers manual transcripts over auto-generated ones
- Organizes transcripts by language
- Saves in WebVTT (.vtt) format
- Shows a summary of available transcript languages

## Development

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm dev "https://youtube.com/watch?v=VIDEO_ID"

# Build the project
pnpm build

# Run built version
node dist/index.js "https://youtube.com/watch?v=VIDEO_ID"
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

ISC

## Troubleshooting

### Common Issues

**"yt-dlp not found"**
- Make sure yt-dlp is installed and available in your PATH
- Try `which yt-dlp` to verify installation

**"ffmpeg not found"**
- Make sure FFmpeg is installed and available in your PATH
- Try `which ffmpeg` to verify installation

**Download fails**
- Check if the YouTube URL is valid and accessible
- Some videos may be region-restricted or require authentication
- Try updating yt-dlp: `pip install --upgrade yt-dlp`

**Compression fails**
- Verify FFmpeg installation
- Check available disk space
- Some video formats may not be compatible

### Debug Mode

For debugging, you can run the CLI with additional logging:

```bash
DEBUG=* yt "https://youtube.com/watch?v=VIDEO_ID"
```
