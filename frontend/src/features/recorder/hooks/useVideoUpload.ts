import { useState } from 'react';
import type { VideoProcessing } from '../../../api';
import { uploadWithProgress } from '../../../api';
import type { Clip } from '../types';

export type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number }
  | { status: 'error'; error: unknown } // the clip stays in memory, so "Tekrar dene" needs no re-recording
  | { status: 'done'; video: VideoProcessing };

/** Upload with progress; the backend saves it under the machine and starts processing (KAN-74). */
export function useVideoUpload() {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  async function upload(machineId: number, title: string, clip: Clip) {
    const form = new FormData();
    form.append('title', title);
    form.append('file', clip.blob, clip.fileName);
    setState({ status: 'uploading', progress: 0 });
    try {
      const video = await uploadWithProgress<VideoProcessing>(`/machines/${machineId}/videos`, form, (progress) =>
        setState({ status: 'uploading', progress }),
      );
      setState({ status: 'done', video });
    } catch (error: unknown) {
      setState({ status: 'error', error });
    }
  }
  return { state, upload, reset: () => setState({ status: 'idle' }) };
}
