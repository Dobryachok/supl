import { useState } from 'react';
import type { MouseEvent } from 'react';
import { PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ButtonSize } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useOrderFlow } from '@/hooks/useOrderFlow';
import type { Order } from '@/types';

export function MarkDeliveredButton({
  order,
  size = 'md',
  label = 'Доставлено',
  stopPropagation = false,
}: {
  order: Order;
  size?: ButtonSize;
  label?: string;
  stopPropagation?: boolean;
}) {
  const flow = useOrderFlow();
  const [open, setOpen] = useState(false);

  const openModal = (event: MouseEvent) => {
    if (stopPropagation) event.stopPropagation();
    setOpen(true);
  };

  const confirm = () => {
    flow.deliver(order, 'buyer');
    setOpen(false);
  };

  return (
    <>
      <Button
        size={size}
        variant="success"
        icon={<PackageCheck className={size === 'sm' ? 'size-3.5' : 'size-4'} />}
        onClick={openModal}
      >
        {label}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Отметить поставку как доставленную?"
        size="sm"
        footer={
          <div className="flex w-full flex-col gap-2">
            <Button block variant="success" icon={<PackageCheck className="size-4" />} onClick={confirm}>
              Да, доставлено
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Отмена
            </Button>
          </div>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-600">
          Заявка{' '}
          <span className="font-semibold text-ink-900">{order.number}</span> от{' '}
          <span className="font-semibold text-ink-900">{order.supplierName}</span> будет переведена
          в статус «Доставлена». После этого можно принять товар на складе.
        </p>
      </Modal>
    </>
  );
}
