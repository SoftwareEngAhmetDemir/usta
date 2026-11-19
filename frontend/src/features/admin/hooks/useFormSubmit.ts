import { useState } from 'react';

export type SubmitState = { status: 'idle' } | { status: 'sending'; progress: number } | { status: 'done' } | { status: 'error'; error: unknown };

/** Pending/progress/done/error for one admin form submit. */
export function useFormSubmit<B>(send: (body: B, onProgress: (f: number) => void) => Promise<unknown>) {
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  async function submit(body: B): Promise<boolean> {
    setState({ status: 'sending', progress: 0 });
    try {
      await send(body, (progress) => setState({ status: 'sending', progress }));
      setState({ status: 'done' });
      return true;
    } catch (error: unknown) {
      setState({ status: 'error', error });
      return false;
    }
  }
  return { state, submit };
}
