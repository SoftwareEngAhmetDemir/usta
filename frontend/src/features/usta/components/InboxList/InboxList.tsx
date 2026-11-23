import { ChevronRight, MessageCircleQuestion } from 'lucide-react';
import { Link } from 'react-router';
import type { InboxQuestion } from '../../../../api';
import { EmptyState } from '../../../../components/EmptyState';
import { ListItem } from '../../../../components/ListItem';
import { Localized } from '../../../../components/Localized';
import { Thumb } from '../../../../components/Thumb';
import { Card } from '../../../../components/ui/card';
import { formatDateTime } from '../../../../lib/format';
import { useT } from '../../../../i18n';

export function InboxList({ items }: { items: InboxQuestion[] }) {
  const t = useT();
  if (items.length === 0) return <EmptyState message={t('Açık soru yok.')} />;
  return (
    <Card className="gap-0">
      {items.map((q) => (
        <ListItem key={q.id} asChild>
          <Link to={`/usta/questions/${q.id}`}>
            <Thumb kind="alert"><MessageCircleQuestion /></Thumb>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="font-semibold"><Localized value={q.question} /></span>
              <span className="text-sm text-muted-foreground">{q.machine_name} · {q.worker_name} {t('· dili:')} {q.worker_language_name} · {formatDateTime(q.created_at)}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" aria-hidden="true" />
          </Link>
        </ListItem>
      ))}
    </Card>
  );
}
