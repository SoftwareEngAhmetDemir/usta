import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { adminMachines } from '../../../../test/fixtures';
import { ExternalVideoForm } from './ExternalVideoForm';

it('ExternalVideoForm requires an http(s) link and sends the video', async () => {
  const onSubmit = vi.fn();
  render(<ExternalVideoForm machines={adminMachines.machines} defaultMachineId={1} state={{ status: 'idle' }} onSubmit={onSubmit} />);
  await userEvent.type(screen.getByLabelText('Başlık'), 'Üretici: sarf malzeme');
  await userEvent.type(screen.getByLabelText('Bağlantı (YouTube vb.)'), 'youtube.com/x');
  await userEvent.click(screen.getByRole('button', { name: 'Ekle' }));
  expect(screen.getByRole('alert')).toHaveTextContent('http(s)');
  await userEvent.clear(screen.getByLabelText('Bağlantı (YouTube vb.)'));
  await userEvent.type(screen.getByLabelText('Bağlantı (YouTube vb.)'), 'https://youtu.be/x');
  await userEvent.selectOptions(screen.getByLabelText('Kaynak'), 'Servis firması');
  await userEvent.click(screen.getByRole('button', { name: 'Ekle' }));
  expect(onSubmit).toHaveBeenCalledWith({ machineId: 1, title: 'Üretici: sarf malzeme', url: 'https://youtu.be/x', source: 'service_company' });
});
