import { useState } from 'react';
import type { AskFeedback } from '../../../api';
import { useAction } from '../../../api';
import { sendFeedback } from '../api';

/** Sends a rating once; `rated` is set when the backend saved it. */
export function useFeedback(askId: number) {
  const [rated, setRated] = useState<AskFeedback | null>(null);
  const action = useAction(async (feedback: AskFeedback) => {
    await sendFeedback(askId, feedback);
    return feedback;
  });
  const rate = async (feedback: AskFeedback) => {
    const saved = await action.run(feedback);
    if (saved) setRated(saved);
  };
  return { rated, pending: action.pending, error: action.error, rate };
}
