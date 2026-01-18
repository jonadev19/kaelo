/**
 * Cart Store
 * Global state management for shopping cart using React Context + useReducer
 */

import React, { createContext, ReactNode, useContext, useReducer } from "react";

// ============================================
// Types
// ============================================

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  businessId: string;
  businessName: string;
  imageUrl?: string;
  notes?: string;
}

export interface CartState {
  items: CartItem[];
  businessId: string | null;
  businessName: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: { productId: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; quantity: number };
    }
  | { type: "UPDATE_NOTES"; payload: { productId: string; notes: string } }
  | { type: "CLEAR_CART" }
  | {
      type: "SET_BUSINESS";
      payload: { businessId: string; businessName: string };
    };

interface CartContextType {
  state: CartState;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getSubtotal: () => number;
  getItemQuantity: (productId: string) => number;
}

// ============================================
// Initial State
// ============================================

const initialState: CartState = {
  items: [],
  businessId: null,
  businessName: null,
};

// ============================================
// Reducer
// ============================================

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { businessId, businessName } = action.payload;

      // If cart has items from different business, clear first
      if (state.businessId && state.businessId !== businessId) {
        return {
          items: [action.payload],
          businessId,
          businessName,
        };
      }

      // Check if item already exists
      const existingIndex = state.items.findIndex(
        (item) => item.productId === action.payload.productId,
      );

      if (existingIndex >= 0) {
        // Update quantity
        const newItems = [...state.items];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          quantity:
            newItems[existingIndex].quantity + (action.payload.quantity || 1),
        };
        return { ...state, items: newItems };
      }

      // Add new item
      return {
        ...state,
        items: [...state.items, action.payload],
        businessId,
        businessName,
      };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter(
        (item) => item.productId !== action.payload.productId,
      );

      if (newItems.length === 0) {
        return initialState;
      }

      return { ...state, items: newItems };
    }

    case "UPDATE_QUANTITY": {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        return cartReducer(state, {
          type: "REMOVE_ITEM",
          payload: { productId },
        });
      }

      const newItems = state.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      );

      return { ...state, items: newItems };
    }

    case "UPDATE_NOTES": {
      const { productId, notes } = action.payload;
      const newItems = state.items.map((item) =>
        item.productId === productId ? { ...item, notes } : item,
      );
      return { ...state, items: newItems };
    }

    case "CLEAR_CART":
      return initialState;

    case "SET_BUSINESS":
      return {
        ...state,
        businessId: action.payload.businessId,
        businessName: action.payload.businessName,
      };

    default:
      return state;
  }
}

// ============================================
// Context
// ============================================

const CartContext = createContext<CartContextType | undefined>(undefined);

// ============================================
// Provider Component
// ============================================

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  const addItem = (
    item: Omit<CartItem, "quantity"> & { quantity?: number },
  ) => {
    dispatch({
      type: "ADD_ITEM",
      payload: { ...item, quantity: item.quantity || 1 },
    });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { productId, quantity } });
  };

  const updateNotes = (productId: string, notes: string) => {
    dispatch({ type: "UPDATE_NOTES", payload: { productId, notes } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const getItemCount = (): number => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getSubtotal = (): number => {
    return state.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  };

  const getItemQuantity = (productId: string): number => {
    const item = state.items.find((i) => i.productId === productId);
    return item?.quantity || 0;
  };

  const value: CartContextType = {
    state,
    addItem,
    removeItem,
    updateQuantity,
    updateNotes,
    clearCart,
    getItemCount,
    getSubtotal,
    getItemQuantity,
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

// ============================================
// Hook
// ============================================

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
