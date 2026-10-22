import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "./api";
import { useAuth } from "./auth";

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

const EMPTY = { items: [], count: 0, total_cents: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);

  const refresh = useCallback(async () => {
    if (!user) return setCart(EMPTY);
    try {
      setCart(await api.cart());
    } catch {
      setCart(EMPTY);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // every action returns the fresh cart from the server, which stays the source of truth
  const add = async (id, qty = 1) => setCart(await api.addToCart(id, qty));
  const setQty = async (id, qty) => setCart(await api.setQty(id, qty));
  const remove = async (id) => setCart(await api.removeFromCart(id));

  return <CartContext.Provider value={{ cart, add, setQty, remove, refresh }}>{children}</CartContext.Provider>;
}
