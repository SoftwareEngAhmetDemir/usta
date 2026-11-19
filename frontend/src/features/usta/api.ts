import { uploadWithProgress } from '../../api';

export type ReplyKind = 'text' | 'video' | 'file';
export interface ReplyIn {
  text: string;
  video: File | null;
  file: File | null;
}

/** Text is translated for the worker; a video goes through the normal video pipeline (KAN-63). */
export function sendAnswer(questionId: number, reply: ReplyIn, onProgress: (f: number) => void): Promise<unknown> {
  const form = new FormData();
  if (reply.text.trim()) form.append('text', reply.text.trim());
  if (reply.video) form.append('video', reply.video);
  if (reply.file) form.append('file', reply.file);
  return uploadWithProgress(`/questions/${questionId}/answer`, form, onProgress);
}
