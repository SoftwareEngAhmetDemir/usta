import { useState } from 'react';
import { sendAnswer, type ReplyIn } from '../api';

export type ReplyState = { status: 'idle' } | { status: 'sending'; progress: number } | { status: 'sent' } | { status: 'error'; error: unknown };

export function useReply(questionId: number) {
  const [state, setState] = useState<ReplyState>({ status: 'idle' });
  async function send(reply: ReplyIn) {
    setState({ status: 'sending', progress: 0 });
    try {
      await sendAnswer(questionId, reply, (progress) => setState({ status: 'sending', progress }));
      setState({ status: 'sent' });
    } catch (error: unknown) {
      setState({ status: 'error', error }); // the form keeps its input, so "Gönder" retries
    }
  }
  return { state, send };
}
