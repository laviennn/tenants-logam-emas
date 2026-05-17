import { persistentAtom } from '@nanostores/persistent';
import { ui } from '../i18n/ui';
import { langStore } from './lang';

const getLang = () => {
  if (typeof document !== 'undefined') {
    return (document.documentElement.lang || langStore.get() || 'id') as 'id' | 'en' | 'my';
  }
  return 'id';
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

// State is persisted to localStorage under key 'shopping-cart'
export const cartStore = persistentAtom<Record<string, CartItem>>(
  'shopping-cart',
  {},
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity: number = 1) {
  const currentCart = cartStore.get();
  const existingItem = currentCart[item.id];
  const safePrice = Number(item.price) || 0;
  const safeQtyToAdd = Number(quantity) || 1;

  if (existingItem) {
    cartStore.set({
      ...currentCart,
      [item.id]: {
        ...existingItem,
        price: safePrice,
        quantity: (Number(existingItem.quantity) || 0) + safeQtyToAdd,
      }
    });
  } else {
    cartStore.set({
      ...currentCart,
      [item.id]: {
        ...item,
        price: safePrice,
        quantity: safeQtyToAdd,
      }
    });
  }

  // Trigger Toast
  const lang = getLang();
  const rawMsg = ui[lang]?.[ 'toast.added_to_cart'] || '{name} ({quantity}x) berhasil ditambahkan ke keranjang';
  const message = rawMsg.replace('{name}', item.name).replace('{quantity}', String(safeQtyToAdd));

  window.dispatchEvent(new CustomEvent('cart-toast', { 
    detail: { message, type: 'success' } 
  }));
}

export function removeFromCart(id: string) {
  const currentCart = cartStore.get();
  if (currentCart[id]) {
    const newCart = { ...currentCart };
    const itemName = currentCart[id].name;
    delete newCart[id];
    cartStore.set(newCart);

    // Trigger Toast
    const lang = getLang();
    const rawMsg = ui[lang]?.[ 'toast.removed_from_cart'] || '{name} dihapus dari keranjang';
    const message = rawMsg.replace('{name}', itemName);

    window.dispatchEvent(new CustomEvent('cart-toast', { 
      detail: { message, type: 'info' } 
    }));
  }
}

export function updateQuantity(id: string, qty: number) {
  const currentCart = cartStore.get();
  const existingItem = currentCart[id];
  const safeQty = Number(qty) || 0;
  
  if (existingItem) {
    if (safeQty <= 0) {
      removeFromCart(id);
    } else {
      cartStore.set({
        ...currentCart,
        [id]: { ...existingItem, quantity: safeQty }
      });
    }
  }
}
