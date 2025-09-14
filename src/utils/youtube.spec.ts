import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'events';

// Mock child_process spawn for controlled outputs
vi.mock('child_process', () => {
  return {
    spawn: vi.fn(),
  };
});

// Defer imports until after mocks
import { getVideoInfo, downloadTranscripts } from './youtube';
import { spawn as mockSpawn } from 'child_process';

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

describe('youtube utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses getVideoInfo output from yt-dlp', async () => {
    const proc = new MockProc();
    (mockSpawn as any).mockReturnValue(proc);

    const infoJson = JSON.stringify({
      id: 'abc123',
      title: 'Sample Video',
      duration: 125,
      uploader: 'Uploader Name',
      upload_date: '20240101',
    });

    const promise = getVideoInfo('https://youtu.be/abc123');

    // Simulate yt-dlp streaming JSON and exiting successfully
    proc.stdout.emit('data', Buffer.from(infoJson));
    proc.emitClose(0);

    const info = await promise;
    expect(info).toEqual({
      id: 'abc123',
      title: 'Sample Video',
      duration: 125,
      uploader: 'Uploader Name',
      uploadDate: '20240101',
    });
  });

  it('collects transcript filenames from yt-dlp output (no conversion)', async () => {
    const proc = new MockProc();
    (mockSpawn as any).mockReturnValue(proc);

    const promise = downloadTranscripts('https://youtu.be/xyz', '.tmp-test', false);

    // Emit lines that youtube.ts matches for VTT and TXT
    proc.stdout.emit(
      'data',
      Buffer.from('[info] Writing video subtitles to: .tmp-test/Video [id].en.vtt\n')
    );
    proc.stdout.emit(
      'data',
      Buffer.from('[info] Writing video subtitles to: .tmp-test/Video [id].en-auto.vtt\n')
    );
    proc.stdout.emit(
      'data',
      Buffer.from('[info] Writing video subtitles to: .tmp-test/Video [id].en.txt\n')
    );
    proc.emitClose(0);

    const files = await promise;
    expect(files).toContain('.tmp-test/Video [id].en.vtt');
    expect(files).toContain('.tmp-test/Video [id].en-auto.vtt');
    expect(files).toContain('.tmp-test/Video [id].en.txt');
  });
});
