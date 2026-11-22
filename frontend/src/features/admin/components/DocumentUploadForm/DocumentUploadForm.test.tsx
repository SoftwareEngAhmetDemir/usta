import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminMachines } from '../../../../test/fixtures';
import { DocumentUploadForm } from './DocumentUploadForm';

describe('DocumentUploadForm', () => {
  it('validates, then sends machine, type, title and file', async () => {
    const onSubmit = vi.fn();
    render(<DocumentUploadForm machines={adminMachines.machines} defaultMachineId={2} state={{ status: 'idle' }} onSubmit={onSubmit} />);
    await userEvent.click(screen.getByRole('button', { name: 'Yükle' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Makine, başlık ve dosya gerekli.');
    await userEvent.selectOptions(screen.getByLabelText('Tür'), 'Katalog');
    await userEvent.type(screen.getByLabelText('Başlık'), 'Yedek parça kataloğu');
    const pdf = new File(['%PDF'], 'k.pdf', { type: 'application/pdf' });
    await userEvent.upload(screen.getByLabelText('Dosya (PDF, Word, Excel, CSV, metin veya fotoğraf)'), pdf);
    await userEvent.click(screen.getByRole('button', { name: 'Yükle' }));
    expect(onSubmit).toHaveBeenCalledWith({ machineId: 2, type: 'catalog', title: 'Yedek parça kataloğu', file: pdf });
  });
  it('confirms the upload', () => {
    render(<DocumentUploadForm machines={[]} defaultMachineId={null} state={{ status: 'done' }} onSubmit={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Yüklendi');
  });
});
