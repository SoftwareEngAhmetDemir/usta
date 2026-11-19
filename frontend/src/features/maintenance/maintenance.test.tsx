import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { maintenanceForm, maintenanceRecord, me } from '../../test/fixtures';
import { mockApi, renderAuthed } from '../../test/utils';
import { MaintenanceFormPage, TechHomePage } from '.';

class Xhr {
  static form: FormData | null = null;
  static url = '';
  upload = { onprogress: null };
  status = 201;
  responseText = JSON.stringify({ ...maintenanceRecord, id: 77 });
  withCredentials = false;
  onload: (() => void) | null = null;
  open(_m: string, url: string) { Xhr.url = url; }
  send(form: FormData) { Xhr.form = form; setTimeout(() => this.onload?.(), 0); }
}

describe('maintenance (KAN-39)', () => {
  it('saves the job and returns to the machine page', async () => {
    vi.stubGlobal('XMLHttpRequest', Xhr);
    mockApi({ 'GET /auth/me': me('technician'), 'GET /machines/2/maintenance-form': maintenanceForm });
    renderAuthed(<MaintenanceFormPage />, '/m/2/maintenance', '/m/:machineId/maintenance');
    expect(await screen.findByText('Forklift 3')).toBeInTheDocument();
    expect(screen.getByText('Emre K.')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Yapılan iş'), 'Hidrolik yağ tamamlandı');
    await userEvent.selectOptions(screen.getByLabelText('Makineyi açan'), 'Ali Usta');
    await userEvent.click(screen.getByRole('button', { name: 'Bakımı kaydet' }));
    expect(await screen.findByText('other page /m/2')).toBeInTheDocument();
    expect(Xhr.url).toBe('/api/machines/2/maintenance');
    expect(Xhr.form?.get('opened_by_id')).toBe('9');
    expect(Xhr.form?.has('done_by_id')).toBe(false);
  });

  it('tech home lists his recent records', async () => {
    mockApi({ 'GET /auth/me': me('technician'), 'GET /me/maintenance': [maintenanceRecord] });
    renderAuthed(<TechHomePage />);
    expect(await screen.findByText(/Torç kablosu kontrol edildi/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /QR'ını tara/ })).toHaveAttribute('href', '/scan');
  });
});
