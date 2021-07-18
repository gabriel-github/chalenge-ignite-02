import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@Rocketseat:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart];
      const product = updatedCart.find((product) => product.id === productId);

      const stock = await api.get(`stock/${productId}`);
      const currentAmount = stock.data.amount;
      const amount = product ? product.amount : 0;
      const amountUpdated = amount + 1;

      if (amount > currentAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (product) {
        product.amount = amountUpdated;
      } else {
        const response = await api.get(`products/${productId}`);
        const newProduct = {
          ...response.data,
          amount: 1,
        };

        updatedCart.push(newProduct);
      }

      setCart([...updatedCart]);
      localStorage.setItem("@Rocketseat:cart", JSON.stringify(updatedCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartUpdated = cart.filter((product) => product.id !== productId);
      setCart([...cartUpdated]);
      localStorage.setItem("@Rocketseat:cart", JSON.stringify(cartUpdated));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const cartUpdated = cart.map((product) =>
        product.id === productId
          ? {
              ...product,
              amount: amount,
            }
          : product
      );

      setCart([...cartUpdated]);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
