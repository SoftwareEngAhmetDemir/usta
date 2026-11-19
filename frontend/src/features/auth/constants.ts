import type { Role } from '../../api';

/** Landing screen per role after login (KAN-80 demo: worker scans, usta sees questions, ...). */
export const HOME_BY_ROLE: Record<Role, string> = {
  worker: '/scan',
  usta: '/usta',
  technician: '/maintenance',
  patron: '/panel',
};

export const ROLE_LABEL: Record<Role, string> = {
  worker: 'İşçi',
  usta: 'Usta',
  technician: 'Teknisyen',
  patron: 'Patron',
};
