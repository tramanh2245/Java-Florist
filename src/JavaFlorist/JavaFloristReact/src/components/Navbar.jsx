import { Link, useLocation } from "react-router-dom";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import logo from "../assets/logo/logo1.png"; 
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  const { cartItems, toggleCart } = useCart();

  return (
    <>
      {!isHome && (
        <nav className="fixed top-0 left-0 w-full z-50 px-8 py-4 
                        bg-white/70 backdrop-blur-lg shadow-sm 
                        flex items-center justify-between">

          {/* LEFT — BRAND */}
          <Link 
            to="/" 
            className="font-playfair-bold text-lg md:text-xl font-semibold text-pink-600 flex-1 flex justify-start"
          >
            Java Florist
          </Link>

          {/* CENTER — LOGO */}
          <button className="flex items-center justify-center group focus:outline-none">
            <img
              src={logo}
              alt="Java Florist"
              className="w-12 h-12 md:w-16 md:h-16 
                transition-all duration-500 
                group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_rgba(240,120,160,0.6)]"
            />
          </button>

          {/* RIGHT — CART BUTTON */}
          <button 
            onClick={toggleCart} 
            className="relative flex items-center justify-end flex-1 pr-2 text-gray-600"
          >
            <ShoppingCartIcon className="w-6 h-6" />

            {/* BADGE (only show when items > 0) */}
            {cartItems.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
  <span
    className="
      absolute -top-2 -right-1
      bg-pink-500 text-white text-xs font-bold
      w-5 h-5 rounded-full
      flex items-center justify-center
      animate-pulse
    "
  >
    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
  </span>
)}

          </button>

        </nav>
      )}
    </>
  );
}
