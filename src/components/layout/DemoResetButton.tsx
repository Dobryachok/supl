import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { resetDemoData, useDispatch } from '@/store/AppContext';

export function DemoResetButton() {
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        icon={<RefreshCw className="size-3.5" />}
        onClick={() => setOpen(true)}
      >
        Сбросить демо-данные
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Сбросить демо-данные"
        description="Заявки, корзина, чаты и правки каталога вернутся к стартовому состоянию"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                resetDemoData(dispatch);
                setOpen(false);
                toast.success('Демо-данные сброшены');
                navigate('/');
              }}
            >
              Сбросить
            </Button>
          </>
        }
      />
    </>
  );
}
