import { useToast } from '@/components/ui/Toast';
import { qty as formatQty } from '@/lib/format';
import { useDispatch } from '@/store/AppContext';
import type { Product } from '@/types';

export function useCartActions() {
  const dispatch = useDispatch();
  const toast = useToast();

  return {
    add(product: Product, amount = product.minQty) {
      dispatch({ type: 'cart/add', productId: product.id, qty: amount });
      toast.success('Добавлено в корзину', `${product.name} — ${formatQty(amount, product.unit)}`);
    },
    addMany(items: { productId: string; qty: number }[], message: string) {
      dispatch({ type: 'cart/addMany', items });
      toast.success('Позиции добавлены', message);
    },
    setQty(productId: string, amount: number) {
      dispatch({ type: 'cart/setQty', productId, qty: amount });
    },
    remove(productId: string) {
      dispatch({ type: 'cart/remove', productId });
    },
    toggleFavorite(product: Product, isFavorite: boolean) {
      dispatch({ type: 'favorites/toggleProduct', productId: product.id });
      toast.info(isFavorite ? 'Убрано из избранного' : 'Добавлено в избранное', product.name);
    },
  };
}
