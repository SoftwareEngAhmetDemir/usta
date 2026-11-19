import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { maintenanceForm } from '../../../../test/fixtures';
import { MaintenanceForm } from './MaintenanceForm';

describe('MaintenanceForm', () => {
  it('requires what was done and who opened the machine', async () => {
    const onSave = vi.fn();
    render(<MaintenanceForm openers={maintenanceForm.openers} saving={false} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Bakımı kaydet' }));
    expect(screen.getByText('Yapılan işi yazın.')).toBeInTheDocument();
    expect(screen.getByText('Makineyi kimin açtığını seçin.')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('sends description, opener and the optional attachment', async () => {
    const onSave = vi.fn();
    render(<MaintenanceForm openers={maintenanceForm.openers} saving={false} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText('Yapılan iş'), 'Fren testi yapıldı');
    await userEvent.selectOptions(screen.getByLabelText('Makineyi açan'), 'Ali Usta');
    const photo = new File(['p'], 'fren.jpg', { type: 'image/jpeg' });
    await userEvent.upload(screen.getByLabelText('Fotoğraf / video (isteğe bağlı)'), photo);
    await userEvent.click(screen.getByRole('button', { name: 'Bakımı kaydet' }));
    expect(onSave).toHaveBeenCalledWith({ description: 'Fren testi yapıldı', opened_by_id: 9, attachment: photo });
  });
});
