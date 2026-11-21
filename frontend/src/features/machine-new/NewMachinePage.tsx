import { useNavigate } from 'react-router';
import type { MachineIn } from '../../api';
import { useAction } from '../../api';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageTitle } from '../../components/PageTitle';
import { createMachine } from './api';
import { MachineForm } from './components/MachineForm';

/** Usta or patron adds a machine, then lands on its page; an usta becomes its usta (KAN-27). */
export function NewMachinePage() {
  const navigate = useNavigate();
  const create = useAction(createMachine);

  async function submit(body: MachineIn) {
    const m = await create.run(body);
    if (m) navigate(`/m/${m.id}`);
  }

  return (
    <>
      <PageTitle title="Makine ekle" />
      <MachineForm pending={create.pending} onSubmit={(b) => void submit(b)} />
      <ErrorMessage error={create.error} />
    </>
  );
}
