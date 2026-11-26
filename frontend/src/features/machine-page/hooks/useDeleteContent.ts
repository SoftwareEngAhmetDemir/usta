import { useState } from 'react';
import { ApiError, useAction } from '../../../api';
import { deleteContent } from '../api';

export interface DeleteTarget {
  kind: 'videos' | 'documents';
  id: number;
  title: string;
}

async function deleteOrGone(kind: DeleteTarget['kind'], id: number): Promise<true> {
  try {
    return await deleteContent(kind, id);
  } catch (e: unknown) {
    if (e instanceof ApiError && e.status === 404) return true; // already deleted elsewhere: just refresh the list
    throw e;
  }
}

/** Which video/document the patron is about to delete, and the delete itself; `onDeleted` reloads the page.
 * The target stays set after closing, so the dialog keeps its text while it fades out. */
export function useDeleteContent(onDeleted: () => void) {
  const [target, setTarget] = useState<DeleteTarget | null>(null);
  const [open, setOpen] = useState(false);
  const action = useAction(deleteOrGone);
  const ask = (next: DeleteTarget) => { action.reset(); setTarget(next); setOpen(true); };
  const confirm = async () => {
    if (target && (await action.run(target.kind, target.id))) {
      setOpen(false);
      onDeleted();
    }
  };
  return { target, open, ask, cancel: () => setOpen(false), confirm, pending: action.pending, error: action.error };
}
