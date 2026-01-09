import { useEffect, useRef, useState } from "react";
import logo from "../assets/logo/logo1.png";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartModal from "../components/CartModal";
import { useNavigate } from "react-router-dom";
import Sparkles from "../components/Sparkles";
import SignatureCarousel from "../components/SignatureCarousel";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrophy, // Experience
  faClock, // Same-day delivery
  faPenFancy, // Handwritten cards
  faMagicWandSparkles, // Modern presentation
} from "@fortawesome/free-solid-svg-icons";

export function HomePage() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);
  const [active, setActive] = useState(1);
  const { cartItems, toggleCart } = useCart();

  // AUTH CONTEXT
  const { isAuthenticated, roles } = useAuth();
  const isAdmin = roles.includes("Admin");

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handler = () => {
      const scrollY = container.scrollTop;
      const height = window.innerHeight || 1;
      const index = Math.round(scrollY / height) + 1;
      setActive(index);
    };

    container.addEventListener("scroll", handler);
    return () => container.removeEventListener("scroll", handler);
  }, []);

  const scrollToSection = (index) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: window.innerHeight * (index - 1),
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const section = document.querySelector("#section3");
    const paragraphs = Array.from(document.querySelectorAll(".section3-para"));
    const titleBlock = document.querySelector(".section3-title");
    const rightImage = document.querySelector(".section3-right");

    // Store and wrap paragraphs
    const originalTexts = paragraphs.map((p) => p.innerText.trim());

    paragraphs.forEach((p, idx) => {
      const words = originalTexts[idx].split(" ");
      p.innerHTML = words
        .map(
          (w) =>
            `<span class="fade-word opacity-0 inline-block mr-1">${w}</span>`
        )
        .join(" ");
    });

    const fadeInWords = async (p) => {
      const spans = Array.from(p.querySelectorAll(".fade-word"));
      for (let i = 0; i < spans.length; i++) {
        spans[i].style.transition = "opacity 0.4s ease";
        spans[i].style.opacity = "1";
        await new Promise((r) => setTimeout(r, 20));
      }
    };

    const startAnimation = async () => {
      // Reveal IMAGE FIRST
      rightImage.classList.remove("opacity-0", "translate-y-10");
      rightImage.classList.add("opacity-100", "translate-y-0");

      // Wait a bit so it's smooth
      await new Promise((r) => setTimeout(r, 200));

      // Reveal TITLE (TEXT)
      titleBlock.classList.remove("opacity-0", "translate-y-6");
      titleBlock.classList.add("opacity-100", "translate-y-0");

      // Reveal paragraphs
      for (let i = 0; i < paragraphs.length; i++) {
        await new Promise((r) => setTimeout(r, 250));
        await fadeInWords(paragraphs[i]);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
            observer.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(section);
  }, []);

  return (
    <div className="home-fade-in w-full h-screen">
      <div
        data-home-scroll
        ref={scrollRef}
        className="w-full h-screen snap-y snap-mandatory overflow-y-scroll overflow-x-hidden scroll-smooth"
      >
        {/* ───── NAVBAR ───── */}
        <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-4 bg-transparent">
          {/* LEFT: BRAND */}
          <div className="font-playfair-bold text-lg md:text-xl font-semibold text-pink-600 flex-1 flex justify-start ml-12">
            Java Florist
          </div>

          {/* CENTER NAV */}
          <div className="flex items-center gap-12">
            <button
              onClick={() => scrollToSection(2)}
              className={`transition-all ${active === 2
                  ? "text-pink-600 drop-shadow-[0_0_8px_rgba(240,120,160,0.8)]"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              Collection
            </button>

            <button
              onClick={() => scrollToSection(3)}
              className={`transition-all ${active === 3
                  ? "text-pink-600 drop-shadow-[0_0_8px_rgba(240,120,160,0.8)]"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              About
            </button>

            {/* LOGO CENTER */}
            <button onClick={() => scrollToSection(1)}>
              <img
                src={logo}
                alt="Java Florist"
                className={`transition-all ${active === 1
                    ? "w-20 h-20 md:w-24 md:h-24 drop-shadow-[0_0_12px_rgba(240,120,160,0.7)]"
                    : "w-10 h-10 md:w-12 md:h-12 opacity-80"
                  }`}
              />
            </button>

            <button
              onClick={() => scrollToSection(4)}
              className={`transition-all ${active === 4
                  ? "text-pink-600 drop-shadow-[0_0_8px_rgba(240,120,160,0.8)]"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              Why Us
            </button>

            <button
              onClick={() => scrollToSection(5)}
              className={`transition-all ${active === 5
                  ? "text-pink-600 drop-shadow-[0_0_8px_rgba(240,120,160,0.8)]"
                  : "text-gray-600 hover:text-pink-500"
                }`}
            >
              Partner Registration
            </button>
          </div>

          {/* RIGHT ICONS */}
          <div className="flex items-center gap-4 text-gray-600 flex-1 flex justify-end pr-2">
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
          </div>
        </nav>

        {/* DOT NAVIGATION */}
        <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              onClick={() => scrollToSection(i)}
              className={`w-[6px] h-[6px] rounded-full transition ${active === i
                  ? "bg-pink-500 scale-150 shadow-[0_0_10px_rgba(255,130,170,0.7)] animate-pulse"
                  : "bg-pink-200 hover:bg-pink-400 hover:scale-110"
                }`}
            />
          ))}
        </div>

        {/* ──────────────── SECTIONS ──────────────── */}

        {/* SECTION 1 — HERO */}
        <section
          id="section1"
          className={`relative w-full h-screen snap-center overflow-hidden ${active === 1 ? "active" : ""
            }`}
        >
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://i.pinimg.com/736x/01/ee/56/01ee56689a603f9058e0124ac3e54fa2.jpg')",
            }}
          />

          {/* Light overlay */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

          {/* Centered content */}
          <div className="relative w-full h-full flex items-center justify-center px-4 md:px-8">
            <div className="text-center">
              <h1 className="font-playfair-bold text-5xl md:text-7xl font-extrabold text-gray-900/90 tracking-tight leading-none mb-4">
                Java{" "}
                <span className="font-playfair-bold text-pink-500">
                  Florist
                </span>
              </h1>

              <p className=" uppercase tracking-[0.25em] text-xs text-pink-500 mb-3">
                soft. pastel. modern.
              </p>

              <p className="text-sm md:text-lg text-gray-700 max-w-md mb-6">
                Gentle florals crafted for the quiet moments and the loud
                emotions.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2 — SIGNATURE COLLECTION (Luxury Carousel) */}
        <section
          id="section2"
          className={`w-full h-screen bg-white flex items-center justify-center px-4 md:px-8 snap-center overflow-hidden section-transition ${active === 2 ? "active" : ""
            }`}
        >
          <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* LEFT TEXT */}
            <div
              className={`max-w-lg mt-16 md:mt-20 
    ${active === 2 ? "animate-fadeUp" : "opacity-0"}`}
            >
              <div className="uppercase tracking-[0.25em] text-xs text-pink-500 mb-3">
                collection
              </div>

              <div className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-gray-900">
                Explore Our{" "}
                <span className="bg-pink-400 bg-clip-text text-transparent">
                  Pastel Collection
                </span>
              </div>

              <div className="text-sm md:text-base text-gray-600 mb-8 max-w-md">
                A curated line of soft, modern bouquets designed for gentle
                moments, heartfelt gifts, and every occasion worth celebrating.
              </div>

              <button
                onClick={() => navigate("/all-products")}
                className="px-8 py-3 rounded-full text-sm font-medium transition shadow-lg bg-white border border-pink-400 text-pink-500 hover:bg-pink-500 hover:text-white"
              >
                View Collection
              </button>
            </div>

            {/* RIGHT — CAROUSEL */}
            <div
              className={`w-full max-w-md mx-auto md:mx-0 mt-10 md:mt-0 
    ${active === 2 ? "animate-fadeIn" : "opacity-0"}`}
            >
              <SignatureCarousel />
            </div>
          </div>
        </section>

        {/* SECTION 3 — ABOUT US */}
        <section
          id="section3"
          className={`w-full h-screen bg-pink-50 flex items-center justify-center px-4 md:px-8 snap-center overflow-hidden section-transition ${active === 3 ? "active" : ""
            }`}
        >
          <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* LEFT — ABOUT TEXT */}
            <div className="section3-title opacity-0 translate-y-6 transition-all duration-700">
              <img
                src="https://i.pinimg.com/736x/01/eb/a3/01eba3375d47ca8050377e574ba0b3fd.jpg"
                alt="About Java Florist"
                className="w-[90%] md:w-[80%] rounded-3xl shadow-xl border border-pink-100 object-cover"
              />
            </div>

            {/* RIGHT — IMAGE */}
            <div className="section3-right opacity-0 translate-y-10 transition-all duration-[1200ms]">
              <p className="uppercase tracking-[0.25em] text-xs text-pink-500 mb-3">
                about us
              </p>

              <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-4 text-gray-900">
                A small studio with
                <span className="text-pink-400"> soft taste.</span>
              </h2>

              <p
                className="text-sm md:text-base text-gray-600 mb-4 section3-para"
                data-index="0"
              >
                Java Florist began with something simple: a belief that flowers
                don’t just decorate a moment — they speak for us. They whisper
                the feelings we can’t always say out loud, the things that sit
                softly in the heart but never quite reach the lips.
              </p>

              <p
                className="text-sm md:text-base text-gray-600 mb-4 section3-para"
                data-index="1"
              >
                We started as a tiny studio, just a small table by the window, a
                few buckets of blooms, and a shelf lined with pastel ribbons
                collected over the years. There wasn’t much, but there was
                intention: every bouquet would be made slowly, gently, and with
                a kind of honesty you can feel just by looking at it.
              </p>

              <p
                className="text-sm md:text-base text-gray-600 section3-para"
                data-index="2"
              >
                As the days passed, we learned that people weren’t just buying
                flowers — they were trusting us with birthdays, apologies,
                confessions, and quiet little “I miss yous.” That shaped us more
                than anything.
              </p>

              <p
                className="text-sm md:text-base text-gray-600 section3-para"
                data-index="3"
              >
                While many florists focused on size or complexity, we leaned
                into something softer. We chose palettes that felt like early
                mornings, silhouettes that felt airy and modern, and a style
                built fully around emotion-first design. No loud colors, no
                heavy arrangements — just florals that feel thoughtful,
                comforting, and full of heart
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4 — WHY US (Modern Card Layout) */}
        <section
          id="section4"
          className={`w-full h-screen bg-white flex items-center justify-center px-4 md:px-8 snap-center overflow-hidden section-transition ${active === 4 ? "active" : ""
            }`}
        >
          <div className="w-full max-w-7xl mx-auto grid md:grid-cols-2 gap-10 md:gap-16 items-start mt-20">
            {/* LEFT SIDE TEXT */}
            <div className="max-w-lg">
              <span className="inline-block px-3 py-1  text-pink-500 text-xs rounded-full mb-4">
                SERVICES
              </span>

              <h2 className="text-3xl md:text-5xl font-semibold leading-tight text-gray-900 mb-4">
                Explore our gentle, curated
                <span className="text-pink-400"> floral experience.</span>
              </h2>

              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6">
                Designed for people who love soft elegance. Everything we
                create—from bouquet wrapping to pastel palettes—is crafted with
                intention.
              </p>
            </div>

            {/* RIGHT SIDE — FIXED SQUARE CARD GRID */}
            <div className="grid grid-cols-2 gap-6 w-[420px] md:w-[480px] mx-auto">
              {/* CARD 1 */}
              <div
                className={`group relative aspect-square rounded-2xl p-6 bg-pink-50 border border-pink-100
  transition-all duration-300 cursor-pointer overflow-hidden
  hover:bg-pink-500 hover:border-pink-500 hover:shadow-xl hover:shadow-pink-200/50
  flex flex-col items-center justify-center text-center
  ${active === 4 ? "card-animate" : "opacity-0"}`}
                style={{ animationDelay: "0s" }}
              >
                {/* Curved corner border */}
                <span
                  className="
      absolute top-0 left-0 
      w-10 h-10
      border-t-4 border-l-4 border-pink-400 
      rounded-tl-2xl
      pointer-events-none
      transition-all duration-300
      group-hover:border-white
    "
                ></span>

                <FontAwesomeIcon
                  icon={faTrophy}
                  className="h-10 w-10 text-pink-400 mb-4 transition-all duration-300 group-hover:text-white"
                />

                <h3 className="text-base font-semibold text-pink-600 group-hover:text-white transition">
                  3+ Weeks Experience
                </h3>

                <p className="text-sm text-gray-600 group-hover:text-white transition">
                  A decade of crafting delicate, thoughtful floral designs.
                </p>
              </div>

              {/* CARD 2 */}
              <div
                className={`group relative aspect-square rounded-2xl p-6 bg-pink-50 border border-pink-100
  transition-all duration-300 cursor-pointer overflow-hidden
  hover:bg-pink-500 hover:border-pink-500 hover:shadow-xl hover:shadow-pink-200/50
  flex flex-col items-center justify-center text-center
  ${active === 4 ? "card-animate" : "opacity-0"}`}
                style={{ animationDelay: "0.3s" }}
              >
                {/* Top-right corner border */}
                <span
                  className="
      absolute top-0 right-0 
      w-10 h-10
      border-t-4 border-r-4 border-pink-400
      rounded-tr-2xl
      pointer-events-none
      transition-all duration-300
      group-hover:border-white
    "
                ></span>
                <FontAwesomeIcon
                  icon={faClock}
                  className="h-10 w-10 text-pink-400 mb-4 transition-all duration-300 group-hover:text-white"
                />

                <h3 className="text-base font-semibold text-pink-600 group-hover:text-white transition">
                  Same-Day Delivery
                </h3>

                <p className="text-sm text-gray-600 group-hover:text-white transition">
                  Fresh florals delivered quickly and beautifully.
                </p>
              </div>

              {/* CARD 3 */}
              <div
                className={`group relative aspect-square rounded-2xl p-6 bg-pink-50 border border-pink-100
  transition-all duration-300 cursor-pointer overflow-hidden
  hover:bg-pink-500 hover:border-pink-500 hover:shadow-xl hover:shadow-pink-200/50
  flex flex-col items-center justify-center text-center
  ${active === 4 ? "card-animate" : "opacity-0"}`}
                style={{ animationDelay: "0.6s" }}
              >
                {/* Bottom-left corner border */}
                <span
                  className="
      absolute bottom-0 left-0
      w-10 h-10
      border-l-4 border-b-4 border-pink-400
      rounded-bl-2xl
      pointer-events-none
      transition-all duration-300
      group-hover:border-white
    "
                ></span>
                <FontAwesomeIcon
                  icon={faPenFancy}
                  className="h-10 w-10 text-pink-400 mb-4 transition-all duration-300 group-hover:text-white"
                />

                <h3 className="text-base font-semibold text-pink-600 group-hover:text-white transition">
                  Handwritten Cards
                </h3>

                <p className="text-sm text-gray-600 group-hover:text-white transition">
                  Personalized messages written with intention.
                </p>
              </div>

              {/* CARD 4 */}
              <div
                className={`group relative aspect-square rounded-2xl p-6 bg-pink-50 border border-pink-100
  transition-all duration-300 cursor-pointer overflow-hidden
  hover:bg-pink-500 hover:border-pink-500 hover:shadow-xl hover:shadow-pink-200/50
  flex flex-col items-center justify-center text-center
  ${active === 4 ? "card-animate" : "opacity-0"}`}
                style={{ animationDelay: "0.9s" }}
              >
                {/* Bottom-right corner border */}
                <span
                  className="
      absolute bottom-0 right-0
      w-10 h-10
      border-r-4 border-b-4 border-pink-400
      rounded-br-2xl
      pointer-events-none
      transition-all duration-300
      group-hover:border-white
    "
                ></span>
                <FontAwesomeIcon
                  icon={faMagicWandSparkles}
                  className="h-10 w-10 text-pink-400 mb-4 transition-all duration-300 group-hover:text-white"
                />

                <h3 className="text-base font-semibold text-pink-600 group-hover:text-white transition">
                  Modern Presentation
                </h3>

                <p className="text-sm text-gray-600 group-hover:text-white transition">
                  Minimal, stylish, and Instagram-ready.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5 */}
        <section
          id="section5"
          className={`w-full h-screen bg-pink-50 flex items-center justify-center px-4 md:px-8 snap-center overflow-hidden section-transition ${active === 5 ? "active" : ""
            }`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* ✨ SPARKLES BEHIND ONLY SECTION 5 */}
            <div className="absolute inset-0 z-0">
              <Sparkles />
            </div>

            {/* CONTENT */}
            <div className="w-full max-w-3xl mx-auto text-center mt-16 md:mt-20 relative z-10">
              <div className="w-full max-w-3xl mx-auto text-center mt-16 md:mt-20 relative z-10">
                <p className="uppercase tracking-[0.25em] text-xs text-pink-500 mb-3">
                  partner registration
                </p>

                <h2 className="text-3xl md:text-5xl font-semibold mb-4 text-gray-900">
                  Join the Java Florist <br />
                  <span className="text-pink-400"> Partner Network</span>
                </h2>

                <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto mb-6">
                  Become a trusted floral partner and grow your business with
                  us. Register below, share your store details, and start
                  collaborating with a brand built on quality, care, and modern
                  floristry.
                </p>
              </div>

              <button
                onClick={() => navigate("/partner-registration")}
                className="px-7 py-3 bg-pink-500 text-white rounded-full text-sm hover:bg-pink-600 transition shadow-lg shadow-pink-200"
              >
                Join as Partner
              </button>
            </div>
          </div>
        </section>
      </div>
      <CartModal />
    </div>
  );
}
export default HomePage;
