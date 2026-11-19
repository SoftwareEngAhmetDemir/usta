import { postJson } from '../../api';
import type { AskResult, QuestionSent } from '../../api';

/** Answer only from this machine's videos, documents and earlier usta answers (KAN-60). */
export const askMachine = (machineId: string, question: string): Promise<AskResult> =>
  postJson<AskResult>(`/machines/${machineId}/ask`, { question });

/** "Ustaya sor": save the question and alert the machine's ustas (KAN-62). */
export const askUsta = (machineId: string, question: string): Promise<QuestionSent> =>
  postJson<QuestionSent>(`/machines/${machineId}/questions`, { question });
