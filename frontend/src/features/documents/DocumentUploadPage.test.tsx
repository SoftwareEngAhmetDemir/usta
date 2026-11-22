import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { machinePage, me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { DocumentUploadPage } from './DocumentUploadPage';

class OkXhr {
  static url = '';
  static form: FormData | null = null;
  upload = { onprogress: null };
  status = 200;
  responseText = '{}';
  withCredentials = false;
  onload: (() => void) | null = null;
  open(_m: string, url: string) { OkXhr.url = url; }
  send(form: FormData) { OkXhr.form = form; setTimeout(() => this.onload?.(), 0); }
}

describe('DocumentUploadPage (KAN-33)', () => {
  it('lets the machine\'s usta upload a document to that machine, then goes back to it', async () => {
    vi.stubGlobal('XMLHttpRequest', OkXhr);
    const page = { ...machinePage, actions: { ...machinePage.actions, upload_document: true } };
    mockApi({ 'GET /auth/me': me('usta'), 'GET /machines/1': page });
    renderAuthed(<DocumentUploadPage />, '/m/1/documents/new', '/m/:machineId/documents/new');
    expect(await screen.findByRole('option', { name: 'PK-105 · Plazma Kesim Makinesi' })).toBeInTheDocument();
    expect(screen.getByLabelText('Makine')).toHaveValue('1');
    await userEvent.type(screen.getByLabelText('Başlık'), 'Bakım talimatı');
    const pdf = new File(['%PDF'], 'b.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('Dosya (PDF veya resim)'), pdf);
    await userEvent.click(screen.getByRole('button', { name: 'Yükle' }));
    expect(await screen.findByText('other page /m/1')).toBeInTheDocument();
    expect(OkXhr.url).toBe('/api/machines/1/documents');
    expect(OkXhr.form?.get('title')).toBe('Bakım talimatı');
  });

  it('explains when the user may not upload to this machine', async () => {
    mockApi({ 'GET /auth/me': me('worker'), 'GET /machines/1': machinePage });
    renderAuthed(<DocumentUploadPage />, '/m/1/documents/new', '/m/:machineId/documents/new');
    expect(await screen.findByRole('alert')).toHaveTextContent('Bu makineye belge yükleme yetkiniz yok.');
    expect(screen.queryByRole('button', { name: 'Yükle' })).not.toBeInTheDocument();
  });
});
