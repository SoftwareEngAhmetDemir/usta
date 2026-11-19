import { API_BASE, postJson, uploadWithProgress } from '../../api';
import type { DocumentSummary, DocumentType, ExternalVideo, ExternalVideoIn } from '../../api';

export interface DocumentUploadIn {
  machineId: number;
  type: DocumentType;
  title: string;
  file: File;
}

/** Text extraction for summaries/search starts on the backend after upload (KAN-33, KAN-43). */
export function uploadDocument(body: DocumentUploadIn, onProgress: (f: number) => void): Promise<DocumentSummary> {
  const form = new FormData();
  form.append('type', body.type);
  form.append('title', body.title);
  form.append('file', body.file);
  return uploadWithProgress<DocumentSummary>(`/machines/${body.machineId}/documents`, form, onProgress);
}

export const addExternalVideo = (machineId: number, body: ExternalVideoIn): Promise<ExternalVideo> =>
  postJson<ExternalVideo>(`/machines/${machineId}/external-videos`, body);

export const qrImageUrl = (machineId: number): string => `${API_BASE}/machines/${machineId}/qr.svg`;
export const stickerPdfUrl = `${API_BASE}/admin/qr-stickers.pdf`;
