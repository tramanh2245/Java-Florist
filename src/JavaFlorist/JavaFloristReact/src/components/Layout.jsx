import Navbar from "./Navbar";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";
import CartModal from "./CartModal";

export default function Layout({ setSelectedProduct }) {

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* GLOBAL CART MODAL */}
      <CartModal />

      {/* NAVBAR */}
      <Navbar />

      {/* PAGE CONTENT */}
      <main className="flex-1 pt-20">
        <Outlet context={{ setSelectedProduct }} />

      </main>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
