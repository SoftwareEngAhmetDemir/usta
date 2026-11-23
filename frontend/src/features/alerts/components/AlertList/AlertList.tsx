import { Bell } from 'lucide-react';
import type { Alert } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { ListItem } from '../../../../components/ListItem';
import { Thumb } from '../../../../components/Thumb';
import { Card } from '../../../../components/ui/card';
import { formatDateTime } from '../../../../lib/format';
import { useT } from '../../../../i18n';

export function AlertList({ items, onOpen }: { items: Alert[]; onOpen: (alert: Alert) => void }) {
  const t = useT();
  if (items.length === 0) return <EmptyState message={t('Bildirim yok.')} />;
  return (
    <Card className="gap-0">
      {items.map((a) => (
        <ListItem key={a.id} asChild>
          <button type="button" onClick={() => onOpen(a)}>
            <Thumb kind={a.read ? 'doc' : 'alert'}><Bell /></Thumb>
            <span className="min-w-0 flex-1">
              <span data-unread={!a.read || undefined} className="block text-sm data-unread:font-semibold">{t(a.text, { quiet: true })}</span>
              {!a.read && <span className="sr-only"> {t('(okunmamış)')}</span>}
              <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
            </span>
            {!a.read && <span className="size-2.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
          </button>
        </ListItem>
      ))}
    </Card>
  );
}
