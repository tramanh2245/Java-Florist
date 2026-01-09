import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getBouquets } from "../api/bouquets";
import { useOutletContext } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowDownWideShort,
  faArrowUpWideShort,
} from "@fortawesome/free-solid-svg-icons";

const BACKEND_URL = "https://localhost:7107";

export default function AllProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("none");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 16;

  const adImg =
    "https://i.pinimg.com/1200x/c9/a5/b6/c9a5b6a94d5e60c85cda13140152b109.jpg";
  const adTitle = "Special Seasonal Offer";
  const adText = "Enjoy up to 25% off selected bouquets this week only!";

  // ⭐ NEW — category state
  const [activeOccasion, setActiveOccasion] = useState("all");

  const { setSelectedProduct } = useOutletContext();

  // ⭐ Config for banners + titles
  const occasionConfig = {
    all: {
      title: "All Bouquets",
      subtitle: "Explore our full flower collection.",
      banner:
        "https://i.pinimg.com/1200x/12/0b/77/120b7710f2e22be8d9ad9418cc370d52.jpg",
    },
    Birthday: {
      title: "Happy Birthday!",
      subtitle: "Celebrate their special day 🎉",
      banner:
        "https://i.pinimg.com/1200x/37/ce/4d/37ce4da75e7d77131e908cd16f1b019c.jpg",
    },
    Anniversary: {
      title: "Anniversary Flowers",
      subtitle: "Timeless blooms for timeless love",
      banner:
        "https://i.pinimg.com/1200x/5a/5b/d2/5a5bd2e114abf007717b0163e0385b72.jpg",
    },
    "Valentine's Day": {
      title: "Valentine's Day",
      subtitle: "Romantic roses for someone special",
      banner:
        "https://i.pinimg.com/736x/96/d1/ea/96d1ea86fa12d948d25dc2f7220de7fc.jpg",
    },
    "Mother's Day": {
      title: "Mother's Day",
      subtitle: "Show your love with elegant blooms",
      banner:
        "https://images.unsplash.com/photo-1655034896530-65301cfecf70?q=80&w=1193&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    Sympathy: {
      title: "Sympathy Flowers",
      subtitle: "Express your condolences with grace",
      banner:
        "https://images.unsplash.com/photo-1622307068522-5be13e5f1f57?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGZ1bmVyYWwlMjBmbG93ZXJzfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000",
    },
    Congratulations: {
      title: "Congratulations!",
      subtitle: "Celebrate achievements with vibrant flowers",
      banner:
        "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&w=1600&q=80",
    },

    "New Baby": {
      title: "Welcome New Baby",
      subtitle: "Soft colors for joyful welcomes",
      banner:
        "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&w=1600&q=80",
    },
    Wedding: {
      title: "Wedding Collection",
      subtitle: "Elegant flowers for unforgettable moments",
      banner:
        "https://i.pinimg.com/1200x/f4/3f/7a/f43f7af16a374746485a382a9177a5e4.jpg",
    },
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBouquets();
  }, []);

  const fetchBouquets = async () => {
    try {
      const res = await getBouquets();
      const allBouquets = res.data;

      const formatted = allBouquets.map((b) => {
        const mainImage =
          b.images?.find((img) => img.is_Main_Image) || b.images?.[0];

        const imageUrl = mainImage
          ? `${BACKEND_URL}${mainImage.url}`
          : "https://via.placeholder.com/400x400?text=No+Image";

        const galleryImages = b.images?.map(
          (img) => `${BACKEND_URL}${img.url}`
        ) || [imageUrl];

        return {
          id: b.bouquet_Id,
          name: b.name,
          rawPrice: b.price,
          price: `$${b.price}.00`,
          img: imageUrl,
          images: galleryImages,
          info:
            b.description ||
            "Handcrafted daily to ensure maximum freshness and elegance.",
          occasion: b.occasion?.name || "Other",
        };
      });

      setProducts(formatted);
    } catch (error) {
      console.error("Failed to load all products", error);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ occasion filter
  const displayProducts = products
    .filter((p) => {
      const matchesOccasion =
        activeOccasion.toLowerCase() === "all" ||
        p.occasion?.toLowerCase() === activeOccasion.toLowerCase();

      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesPrice = p.rawPrice >= minPrice && p.rawPrice <= maxPrice;

      return matchesOccasion && matchesSearch && matchesPrice;
    })
    .sort((a, b) => {
      if (sortOption === "high-low") return a.rawPrice - b.rawPrice;
      if (sortOption === "low-high") return b.rawPrice - a.rawPrice;
      return 0;
    });
  // Pagination slicing
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const currentItems = displayProducts.slice(indexOfFirst, indexOfLast);

  const totalPages = Math.ceil(displayProducts.length / itemsPerPage);

  const cardVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.1 },
    }),
  };

  return (
    <div className="animate-fadeSlide min-h-screen bg-gray-50 pb-20">
      {/* 🌸 Dynamic Banner */}
      <section className="relative w-full h-[300px] md:h-[350px] overflow-hidden shadow-md">
        <img
          src={occasionConfig[activeOccasion].banner}
          alt={occasionConfig[activeOccasion].title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center">
          <h1 className="text-4xl md:text-5xl text-white font-bold drop-shadow">
            {occasionConfig[activeOccasion].title}
          </h1>
          <p className="text-white text-lg mt-2 drop-shadow">
            {occasionConfig[activeOccasion].subtitle}
          </p>
        </div>
      </section>

      {/* 🔍 FILTER BAR */}
      <section className="max-w-7xl mx-auto px-6 -mt-8 relative z-10">
        <div className="bg-white p-5 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Sort + Search */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() =>
                setSortOption(
                  sortOption === "low-high" ? "high-low" : "low-high"
                )
              }
              className="p-2 w-10 h-10 border rounded-lg hover:text-pink-500 hover:border-pink-400"
            >
              <FontAwesomeIcon
                icon={
                  sortOption === "low-high"
                    ? faArrowDownWideShort
                    : faArrowUpWideShort
                }
              />
            </button>

            <input
              type="text"
              placeholder="Search flowers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-[700px] border px-4 py-2 rounded-lg focus:ring-2 focus:ring-pink-300"
            />
          </div>

          {/* Price Range Slider */}
          <div className="w-full md:w-80">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-600">Price Range</span>
              <span className="text-sm font-semibold text-pink-500">
                ${minPrice} — ${maxPrice}
              </span>
            </div>

            <div className="relative w-full h-10 mt-2 select-none">
              {/* Background Track */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full h-2 bg-pink-100 rounded-full"></div>

              {/* Active Range Highlight */}
              <div
                className="absolute top-1/2 -translate-y-1/2 h-2 bg-pink-400 rounded-full pointer-events-none"
                style={{
                  left: `${(minPrice / 500) * 100}%`,
                  right: `${100 - (maxPrice / 500) * 100}%`,
                }}
              ></div>

              {/* MIN SLIDER */}
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(Math.min(Number(e.target.value), maxPrice - 10))
                }
                className="
        absolute w-full h-10
        appearance-none bg-transparent z-30
        pointer-events-none      /* IMPORTANT: the rail doesn't receive input */
        [&::-webkit-slider-thumb]:pointer-events-auto /* ONLY thumb is clickable */
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:h-5
        [&::-webkit-slider-thumb]:w-5
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-pink-500
        [&::-webkit-slider-thumb]:border-2
        [&::-webkit-slider-thumb]:border-white
        [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,0,128,0.5)]
      "
              />

              {/* MAX SLIDER */}
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={maxPrice}
                onChange={(e) =>
                  setMaxPrice(Math.max(Number(e.target.value), minPrice + 10))
                }
                className="
        absolute w-full h-10
        appearance-none bg-transparent z-20
        pointer-events-none      /* IMPORTANT */
        [&::-webkit-slider-thumb]:pointer-events-auto /* only thumb draggable */
        [&::-webkit-slider-thumb]:appearance-none
        [&::-webkit-slider-thumb]:h-5
        [&::-webkit-slider-thumb]:w-5
        [&::-webkit-slider-thumb]:rounded-full
        [&::-webkit-slider-thumb]:bg-pink-500
        [&::-webkit-slider-thumb]:border-2
        [&::-webkit-slider-thumb]:border-white
        [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(255,0,128,0.5)]
      "
              />
            </div>

            {/* Labels */}
            <div className="grid grid-cols-6 text-[11px] text-gray-400 mt-1">
              <span>$0</span>
              <span className="ml-1">$100</span>
              <span className="ml-2">$200</span>
              <span className="ml-4">$300</span>
              <span className="ml-6">$400</span>
              <span className="ml-8">$500</span>
            </div>
          </div>
        </div>

        {/* ⭐ Occasion Buttons */}
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {[
            "All",
            "Birthday",
            "Anniversary",
            "Valentine's Day",
            "Mother's Day",
            "Sympathy",
            "Congratulations",
            "New Baby",
            "Wedding",
          ].map((o) => {
            const key = o === "All" ? "all" : o; // 🌸 IMPORTANT FIX

            return (
              <motion.button
                key={o}
                onClick={() => setActiveOccasion(key)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
          px-5 py-2 rounded-full 
          ${activeOccasion === key
                    ? "bg-pink-500 text-white"
                    : "bg-pink-100 text-pink-700"
                  }
          font-medium shadow-sm transition
        `}
              >
                {o}
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* 💐 PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Loading products...
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">
            No products found.
          </div>
        ) : (
          <>
            {/* PRODUCT GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {currentItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  custom={i}
                  variants={cardVariant}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  onClick={() => setSelectedProduct(item)}
                  className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition group cursor-pointer"
                >
                  <div className="h-64 overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold truncate">
                      {item.name}
                    </h3>
                    <p className="text-pink-600 font-bold text-lg">
                      {item.price}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-12 gap-3">
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`
              px-4 py-2 rounded-lg border 
              ${currentPage === 1
                      ? "text-gray-400 border-gray-300 cursor-not-allowed"
                      : "text-pink-600 border-pink-300 hover:bg-pink-50"
                    }
            `}
                >
                  Prev
                </button>

                {/* Page Numbers */}
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`
                px-4 py-2 rounded-lg 
                ${currentPage === i + 1
                        ? "bg-pink-500 text-white"
                        : "bg-pink-100 text-pink-700 hover:bg-pink-200"
                      }
              `}
                  >
                    {i + 1}
                  </button>
                ))}

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className={`
              px-4 py-2 rounded-lg border 
              ${currentPage === totalPages
                      ? "text-gray-400 border-gray-300 cursor-not-allowed"
                      : "text-pink-600 border-pink-300 hover:bg-pink-50"
                    }
            `}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* 🎁 PROMO BANNER */}
      {adImg && (
        <section className="max-w-5xl mx-auto px-6 pb-10  ">
          <div className="relative w-full h-[250px] md:h-[300px] rounded-2xl overflow-hidden shadow-lg">
            <img
              src={adImg}
              alt="Promo"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-pink-600/70 to-transparent flex flex-col justify-center px-10 text-white">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">{adTitle}</h2>
              <p className="mb-6 max-w-md text-sm md:text-base">{adText}</p>
              <button className="w-fit px-6 py-2 bg-white text-pink-700 font-bold rounded-full hover:bg-gray-100 transition">
                Order Now
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
