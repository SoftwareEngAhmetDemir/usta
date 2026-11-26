import type { Role } from '../../../../api';
import { Chip } from '../../../../components/Chip';
import { useT } from '../../../../i18n';
import { ROLE_LABEL } from '../../../auth';

/** The tabs of the Users page: the three kinds of people the factory has (user's decision 2026-11-26). */
export const TAB_ROLES = ['worker', 'usta', 'patron'] as const satisfies readonly Role[];
export type TabRole = (typeof TAB_ROLES)[number];

interface Props {
  value: TabRole;
  onChange: (role: TabRole) => void;
}

/** Users page filter: İşçi, Usta or Patron. The backend does the filtering. */
export function RoleTabs({ value, onChange }: Props) {
  const t = useT();
  return (
    <fieldset className="m-0 flex flex-wrap gap-2 border-0 p-0">
      <legend className="sr-only">{t('Rol')}</legend>
      {TAB_ROLES.map((role) => (
        <Chip key={role} aria-pressed={value === role} onClick={() => onChange(role)}>{t(ROLE_LABEL[role])}</Chip>
      ))}
    </fieldset>
  );
}
