import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function ProductModal({ selected, onClose }) {
  
  const [selectedImg, setSelectedImg] = useState(null);
  const [qty, setQty] = useState(1);
  
  // Access Cart Context to add items
  const { addToCart } = useCart();
  
  // Access Auth Context to check user roles
  const { roles } = useAuth();
  
  // Logic: Only Guests (roles.length 0) or "Customer" role can buy.
  // "Partner" or "Admin" roles cannot buy flowers.
  const canPurchase = roles.length === 0 || roles.includes("Customer");

  // When a new product is selected, reset the image and quantity
  useEffect(() => {
    if (selected) {
      setSelectedImg(selected.img);
      setQty(1);
    }
  }, [selected]);

  // Handle adding product to cart
  const handleAddToCart = () => {
    addToCart(
      {
        bouquet_id: selected.bouquet_id || selected.id,
        name: selected.name,
        // Ensure price is a number (remove '$' sign if present)
        price:
          typeof selected.price === "string"
            ? parseFloat(selected.price.replace("$", ""))
            : selected.price,
        image: selectedImg || selected.img,
      },
      qty
    );
    onClose(); // Close modal after adding
  };

  return (
    // AnimatePresence handles the exit animation when modal closes
    <AnimatePresence>
      {selected && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center backdrop-blur-[2px] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose} // Close if clicking backdrop
        >
          <motion.div
            onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
            className="relative w-full max-w-7xl bg-white rounded-3xl overflow-y-auto shadow-lg max-h-[90vh]"
            // Pop-up animation effect
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Close Button (X) */}
            <button
              onClick={onClose}
              className="absolute top-5 right-7 text-gray-500 text-3xl hover:text-[#c05f7e] transition"
            >
              ✕
            </button>

            <div className="grid md:grid-cols-2 gap-10 p-8 md:p-12">
              
              {/* LEFT COLUMN: Image Gallery */}
              <div className="flex flex-col gap-4">
                {/* Main Large Image */}
                {selectedImg && (
                  <motion.img
                    key={selectedImg}
                    src={selectedImg}
                    alt={selected.name}
                    className="rounded-3xl shadow-md w-full h-[500px] object-cover"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  />
                )}

                {/* Thumbnails Row */}
                <div className="flex gap-4 items-center justify-center pt-2">
                  {selected.images && selected.images.slice(0, 3).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImg(img)}
                      className={`w-24 h-24 rounded-xl overflow-hidden border-2 transition 
                      ${selectedImg === img ? "border-pink-400" : "border-transparent"}`}
                    >
                      <img
                        src={img}
                        className="w-full h-full object-cover"
                        alt="thumbnail"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: Product Details */}
              <div className="p-6 bg-pink-50/30 rounded-3xl border border-pink-100 shadow-inner">
                <h1 className="text-3xl font-semibold text-pink-600 mb-2">
                  {selected.name}
                </h1>

                <p className="text-pink-600 font-bold text-2xl mb-4">
                  {selected.price}
                </p>

                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-pink-600 mb-1">
                    Product Information
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {selected.info}
                  </p>
                </div>

                {/* Action Buttons: Only show if user is allowed to purchase */}
                {canPurchase ? (
                  <>
                    <div className="flex items-center gap-4 mb-6">
                      <label className="text-gray-600">Quantity:</label>
                      <input
                        type="number"
                        value={qty}
                        onChange={(e) =>
                          setQty(Math.max(1, parseInt(e.target.value) || 1))
                        }
                        min={1}
                        className="w-20 border border-gray-300 rounded-full text-center py-1 focus:outline-none focus:ring-1 focus:ring-[#c05f7e]"
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleAddToCart}
                        className="flex-1 py-3 rounded-full bg-pink-400 text-white hover:bg-pink-500 transition font-semibold"
                      >
                        Add to Cart - $
                        {(
                          parseFloat(selected.price.replace("$", "")) * qty
                        ).toFixed(2)}
                      </button>

                      <button className="flex-1 py-3 rounded-full border border-[#c05f7e] text-[#c05f7e] hover:bg-[#c05f7e]/10 transition">
                        ♥ Wishlist
                      </button>
                    </div>
                  </>
                ) : (
                  // Warning message for Partners/Admins
                  <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center font-medium">
                    Ordering is disabled for {roles[0]} accounts. <br/>
                    Please login as a Customer to purchase.
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}