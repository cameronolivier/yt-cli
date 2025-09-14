import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process spawn
vi.mock('child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

import { spawn as mockSpawn } from 'child_process';
import * as fsModule from 'fs';
import { generateCompressedFilename, getVideoInfo } from './ffmpeg';

class MockProc {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  private closeHandler: ((code: number) => void) | null = null;
  on(event: 'close', cb: (code: number) => void) {
    if (event === 'close') this.closeHandler = cb;
    return this as any;
  }
  emitClose(code: number) {
    this.closeHandler?.(code);
  }
}

describe('ffmpeg utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('generates a compressed .mp4 filename', () => {
    expect(generateCompressedFilename('/tmp/example.webm')).toBe('/tmp/example_compressed.mp4');
    expect(generateCompressedFilename('/tmp/video.mp4')).toBe('/tmp/video_compressed.mp4');
  });

  it('parses ffprobe output and returns metadata with file size', async () => {
    // Mock fs.promises.stat used by getVideoInfo
    vi.spyOn(fsModule.promises as any, 'stat').mockResolvedValue({ size: 123456 });

    // Mock ffprobe child process
    const proc = new MockProc();
    (mockSpawn as any).mockReturnValue(proc);

    const ffprobeJson = JSON.stringify({
      streams: [{ codec_type: 'audio' }, { codec_type: 'video', width: 1920, height: 1080 }],
      format: { duration: '42.5' },
    });

    const promise = getVideoInfo('/tmp/video.mp4');
    setTimeout(() => {
      proc.stdout.emit('data', Buffer.from(ffprobeJson));
      proc.emitClose(0);
    }, 0);

    const info = await promise;
    expect(info).toEqual({ duration: 42.5, width: 1920, height: 1080, size: 123456 });
  });
});
