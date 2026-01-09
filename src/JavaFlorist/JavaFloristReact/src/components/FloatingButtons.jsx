import React from "react";
import { HomeIcon, UserIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext";

export default function FloatingButtons({ onSearchClick }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  

  const goHomeSmart = () => {
    const isHome = window.location.pathname === "/";
    if (isHome) {
      const scrollBox = document.querySelector("[data-home-scroll]");
      if (scrollBox) {
        scrollBox.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (window.startPageFadeOut) window.startPageFadeOut();
    setTimeout(() => navigate("/"), 350);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-6">

      {/* 🏠 HOME BUTTON */}
      <button
        onClick={goHomeSmart}
        className="w-10 h-10 rounded-full bg-white shadow-md 
        flex items-center justify-center 
        transition group hover:bg-pink-400"
      >
        <HomeIcon className="w-5 h-5 text-gray-700 transition group-hover:text-white" />
      </button>

      {/* 🔍 SEARCH BUTTON */}
      <button
  onClick={() => navigate("/all-products")}
        className="w-10 h-10 rounded-full bg-white shadow-md 
        flex items-center justify-center 
        transition group hover:bg-pink-400"
      >
        <svg xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24" strokeWidth={2}
          className="w-6 h-6 stroke-gray-700 transition group-hover:stroke-white"
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 110-14 7 7 0 010 14z"
          />
        </svg>
      </button>

      {/* 👤 USER BUTTON → DASHBOARD */}
      <button
        onClick={() => {
          if (isAuthenticated) navigate("/dashboard");
          else navigate("/login");
        }}
        type="button"
        className="w-10 h-10 rounded-full shadow-md 
        flex items-center justify-center 
        transition group 
        bg-white text-gray-700 hover:bg-pink-400 hover:text-white"
      >
        <UserIcon className="w-5 h-5 transition" />
      </button>

    </div>
  );
}
