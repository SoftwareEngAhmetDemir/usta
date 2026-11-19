import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { me, processing } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { RecorderPage } from './RecorderPage';

class Xhr {
  static results: { status: number; body: string }[] = [];
  static forms: FormData[] = [];
  static url = '';
  upload: { onprogress: ((e: { lengthComputable: boolean; loaded: number; total: number }) => void) | null } = { onprogress: null };
  status = 0;
  responseText = '';
  withCredentials = false;
  onload: (() => void) | null = null;
  open(_m: string, url: string) { Xhr.url = url; }
  send(form: FormData) {
    Xhr.forms.push(form);
    const r = Xhr.results.shift() ?? { status: 500, body: '' };
    setTimeout(() => {
      this.upload.onprogress?.({ lengthComputable: true, loaded: 1, total: 2 });
      this.status = r.status;
      this.responseText = r.body;
      this.onload?.();
    }, 0);
  }
}

describe('RecorderPage (KAN-35, KAN-36, KAN-74)', () => {
  beforeEach(() => {
    Xhr.forms = [];
    vi.stubGlobal('XMLHttpRequest', Xhr);
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:clip', revokeObjectURL: vi.fn() }));
    mockApi({ 'GET /auth/me': me('usta'), 'GET /me/machines': [{ id: 1, code: 'PK-105', name: 'Plazma' }], 'GET /videos/9/processing': processing });
  });

  it('picks a phone video, retries a failed upload without re-recording, then shows processing', async () => {
    Xhr.results = [{ status: 500, body: '' }, { status: 201, body: JSON.stringify(processing) }];
    renderAuthed(<RecorderPage />, '/record?machine=1');
    expect(await screen.findByRole('option', { name: 'PK-105 · Plazma' })).toBeInTheDocument();
    expect(screen.getByLabelText('Makine')).toHaveValue('1');
    await userEvent.upload(screen.getByLabelText(/telefondan video seç/), new File(['v'], 'servis.mp4', { type: 'video/mp4' }));
    expect(screen.getByLabelText('Kaydın önizlemesi')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Başlık'), 'Servis anlatımı');
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText(/Kayıt telefonda duruyor/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText('Sıkıştırılıyor (H.264)')).toBeInTheDocument();
    expect(Xhr.url).toBe('/api/machines/1/videos');
    expect(Xhr.forms[1]?.get('title')).toBe('Servis anlatımı');
    expect((Xhr.forms[1]!.get('file') as File).name).toBe('servis.mp4');
  });
});
