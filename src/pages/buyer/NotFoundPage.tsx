import { Compass } from 'lucide-react';
import { LinkButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export function NotFoundPage() {
  return (
    <div className="page pt-10">
      <EmptyState
        icon={<Compass className="size-6" />}
        title="Страница не найдена"
        text="Возможно, ссылка устарела или товар снят с публикации поставщиком."
        action={
          <>
            <LinkButton to="/">На главную</LinkButton>
            <LinkButton to="/catalog" variant="secondary">
              В каталог
            </LinkButton>
          </>
        }
      />
    </div>
  );
}
