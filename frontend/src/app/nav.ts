import { Bell, ClipboardList, LayoutDashboard, MessageCircleQuestion, ScanLine, Video, Wrench, type LucideIcon } from 'lucide-react';
import type { Role } from '../api';

export interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

const SCAN: NavItem = { to: '/scan', icon: ScanLine, label: 'Tara' };
const ALERTS: NavItem = { to: '/alerts', icon: Bell, label: 'Bildirim' };
const RECORD: NavItem = { to: '/record', icon: Video, label: 'Video çek' };
const QUESTIONS: NavItem = { to: '/usta', icon: MessageCircleQuestion, label: 'Sorular' };

/** Bottom navigation per role (KAN-80 demo). The backend still checks every request. */
export const NAV: Record<Role, NavItem[]> = {
  worker: [SCAN, { to: '/my-questions', icon: ClipboardList, label: 'Sorularım' }, ALERTS],
  usta: [QUESTIONS, RECORD, SCAN, ALERTS],
  technician: [{ to: '/maintenance', icon: Wrench, label: 'Bakımlar' }, SCAN, ALERTS],
  patron: [{ to: '/panel', icon: LayoutDashboard, label: 'Yönetim' }, QUESTIONS, RECORD, ALERTS], // the patron answers any question
};
