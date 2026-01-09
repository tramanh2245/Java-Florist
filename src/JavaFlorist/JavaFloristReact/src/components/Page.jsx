import { useEffect, useState } from "react";

export default function Page({ children }) {
  const [animClass, setAnimClass] = useState("page-fade-in");

  // When leaving (Home button pressed)
  window.startPageFadeOut = () => {
    setAnimClass("page-fade-out");
  };

  return (
    <div className={animClass}>
      {children}
    </div>
  );
}
