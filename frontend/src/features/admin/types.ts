import type { ExternalSource } from '../../api';

export interface ExternalVideoSubmit {
  machineId: number;
  title: string;
  url: string;
  source: ExternalSource;
}
