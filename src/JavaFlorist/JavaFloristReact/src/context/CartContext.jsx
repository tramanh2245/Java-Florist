import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

// Create the Context object
const CartContext = createContext();

// Custom hook to use the Cart Context easily in other components
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { token } = useAuth();

  // State to control the slide-out cart UI
  const [cartOpen, setCartOpen] = useState(false);

  // State for Cart Items
  // Initialize from LocalStorage to persist data even if the page refreshes
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  // Effect: Whenever cartItems change, save them to LocalStorage
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
  }, [cartItems]);

  // --- LOGIC: Clear Cart on Logout ---
  const prevTokenRef = useRef(token);

  useEffect(() => {
    // If we had a token before, but now it's null (User logged out)
    if (prevTokenRef.current && !token) {
      setCartItems([]);
      localStorage.removeItem("cart");
    }

    // Update current token reference
    prevTokenRef.current = token;
  }, [token]);

  const toggleCart = () => setCartOpen(!cartOpen);

  // Function to add item to cart
  const addToCart = (item, quantity = 1) => {
    setCartItems((prev) => {
      // Check if the item is already in the cart
      const exists = prev.find((p) => p.bouquet_id === item.bouquet_id);
      
      if (exists) {
        // If exists, update the quantity instead of adding a duplicate row
        return prev.map((p) =>
          p.bouquet_id === item.bouquet_id
            ? { ...p, quantity: p.quantity + quantity }
            : p
        );
      }
      // If not exists, add as a new item
      return [...prev, { ...item, quantity: quantity }];
    });
  };

  // Function to update quantity directly (e.g., via + / - buttons)
  const updateQty = (id, qty) => {
    if (qty < 1) return; // Prevent negative quantity
    setCartItems((prev) =>
      prev.map((p) => (p.bouquet_id === id ? { ...p, quantity: qty } : p))
    );
  };

  // Remove a specific item from cart
  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((p) => p.bouquet_id !== id));
  };

  // Clear entire cart (e.g., after successful checkout)
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem("cart");
  };

  return (
    <CartContext.Provider
      value={{
        cartOpen,
        toggleCart,
        cartItems,
        addToCart,
        updateQty,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};