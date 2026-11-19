import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MachineSelect } from './MachineSelect';

it('MachineSelect reports the chosen machine id', async () => {
  const onChange = vi.fn();
  render(<MachineSelect machines={[{ id: 1, code: 'PK-105', name: 'Plazma' }, { id: 4, code: 'AB-01', name: 'Abkant' }]} value={null} onChange={onChange} />);
  await userEvent.selectOptions(screen.getByLabelText('Makine'), 'AB-01 · Abkant');
  expect(onChange).toHaveBeenCalledWith(4);
});
