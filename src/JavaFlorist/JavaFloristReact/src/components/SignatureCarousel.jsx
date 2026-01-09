import { useState, useEffect } from "react";

export default function SignatureCarousel() {
  const images = [
    "https://images.pexels.com/photos/5414055/pexels-photo-5414055.jpeg",
    "https://images.pexels.com/photos/5409758/pexels-photo-5409758.jpeg",
    "https://images.pexels.com/photos/255379/pexels-photo-255379.jpeg",
    "https://images.pexels.com/photos/931162/pexels-photo-931162.jpeg",
    "https://i.pinimg.com/736x/d9/9d/0d/d99d0db35d640d07b455753536f618c0.jpg"
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const getOffset = (i) => {
    const diff = (i - index + images.length) % images.length;

    if (diff === 0) return "translate-x-0 scale-100 z-50 blur-0";
    if (diff === 1) return "translate-x-[220px] scale-75 z-30 blur-sm";
    if (diff === images.length - 1)
      return "-translate-x-[220px] scale-75 z-30 blur-sm";

    return "opacity-0 scale-50 pointer-events-none";
  };

  return (
    <div className="relative w-full flex justify-center items-center h-[480px] overflow-hidden">
      {images.map((src, i) => (
        <img
          key={i}
          src={src}
          className={`
            absolute top-1/2 -translate-y-1/2 rounded-3xl shadow-xl
            transition-all duration-700 object-cover
            w-[300px] h-[360px]
            ${getOffset(i)}
          `}
        />
      ))}
    </div>
  );
}
