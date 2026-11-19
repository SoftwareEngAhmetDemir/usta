import { useState } from 'react';
import type { AskResult, QuestionSent } from '../../../api';
import { askMachine, askUsta } from '../api';

export interface Exchange {
  question: string;
  result: AskResult | null; // null while searching
  error: unknown;
  sent: QuestionSent | null;
  sending: boolean;
}

/** The ask conversation on one machine: questions, answers, and "Ustaya sor". */
export function useAsk(machineId: string) {
  const [items, setItems] = useState<Exchange[]>([]);
  const patch = (i: number, p: Partial<Exchange>) => setItems((all) => all.map((x, j) => (j === i ? { ...x, ...p } : x)));

  async function ask(question: string) {
    const i = items.length;
    setItems((all) => [...all, { question, result: null, error: null, sent: null, sending: false }]);
    try {
      patch(i, { result: await askMachine(machineId, question) });
    } catch (error: unknown) {
      patch(i, { error });
    }
  }

  async function sendToUsta(i: number, question: string) {
    patch(i, { sending: true, error: null });
    try {
      patch(i, { sent: await askUsta(machineId, question), sending: false });
    } catch (error: unknown) {
      patch(i, { error, sending: false });
    }
  }

  const busy = items.some((x) => x.result === null && x.error === null);
  return { items, ask, sendToUsta, busy };
}
