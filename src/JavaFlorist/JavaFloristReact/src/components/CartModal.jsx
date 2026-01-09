import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

export default function CartModal() {
  const { cartOpen, toggleCart, cartItems, updateQty, removeItem } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const navigate = useNavigate();

  const handleCheckout = () => {
    toggleCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <motion.div
          className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={toggleCart}
        >
          {/* Right Drawer */}
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="w-full sm:w-[420px] bg-white h-full shadow-2xl p-6 overflow-y-auto rounded-l-3xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-pink-600">Your Cart 🛒</h2>
              <button onClick={toggleCart} className="text-3xl text-gray-500 hover:text-pink-500">×</button>
            </div>

            {/* Items */}
            <div className="space-y-6">
              {cartItems.length === 0 && (
                <p className="text-gray-500 text-center">Your cart is empty…</p>
              )}

              {cartItems.map((item) => (
                <div key={item.bouquet_id} className="flex gap-4">
                  <img
                    src={item.image}
                    className="w-20 h-20 rounded-xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-pink-600 font-semibold">${item.price}</p>

                    {/* Quantity */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        className="px-3 py-1 bg-pink-200 rounded-full"
                        onClick={() =>
                          updateQty(item.bouquet_id, Math.max(1, item.quantity - 1))
                        }
                      >
                        -
                      </button>

                      <span>{item.quantity}</span>

                      <button
                        className="px-3 py-1 bg-pink-200 rounded-full"
                        onClick={() =>
                          updateQty(item.bouquet_id, item.quantity + 1)
                        }
                      >
                        +
                      </button>

                      <button
                        className="text-red-500 ml-auto"
                        onClick={() => removeItem(item.bouquet_id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total + Checkout */}
            {cartItems.length > 0 && (
              <div className="mt-10 pt-6 border-t">
                <p className="text-xl font-semibold text-gray-800">
                  Total: <span className="text-pink-600">${total.toFixed(2)}</span>
                </p>

                <button
                onClick={handleCheckout}
                className="w-full mt-4 py-3 bg-pink-600 text-white rounded-full font-semibold hover:bg-pink-500 transition">
                  Proceed to Checkout
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
