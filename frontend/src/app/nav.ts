import type { Role } from '../api';

export interface NavItem {
  to: string;
  icon: string;
  label: string;
}

/** Bottom navigation per role (KAN-80 demo). The backend still checks every request. */
export const NAV: Record<Role, NavItem[]> = {
  worker: [
    { to: '/scan', icon: '⌁', label: 'Tara' },
    { to: '/my-questions', icon: '?', label: 'Sorularım' },
    { to: '/alerts', icon: '🔔', label: 'Bildirim' },
  ],
  usta: [
    { to: '/usta', icon: '?', label: 'Sorular' },
    { to: '/record', icon: '●', label: 'Video çek' },
    { to: '/scan', icon: '⌁', label: 'Tara' },
    { to: '/alerts', icon: '🔔', label: 'Bildirim' },
  ],
  technician: [
    { to: '/maintenance', icon: '🔧', label: 'Bakımlar' },
    { to: '/scan', icon: '⌁', label: 'Tara' },
    { to: '/alerts', icon: '🔔', label: 'Bildirim' },
  ],
  patron: [
    { to: '/panel', icon: '▦', label: 'Yönetim' },
    { to: '/record', icon: '●', label: 'Video çek' },
    { to: '/alerts', icon: '🔔', label: 'Bildirim' },
  ],
};
