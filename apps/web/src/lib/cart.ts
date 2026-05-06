import { persistentAtom } from '@nanostores/persistent';

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
  window.dispatchEvent(new CustomEvent('cart-toast', { 
    detail: { message: `${item.name} (${safeQtyToAdd}x) berhasil ditambahkan ke keranjang`, type: 'success' } 
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
    window.dispatchEvent(new CustomEvent('cart-toast', { 
      detail: { message: `${itemName} dihapus dari keranjang`, type: 'info' } 
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
