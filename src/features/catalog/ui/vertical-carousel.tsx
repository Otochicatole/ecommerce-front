'use client';
import { Product } from "@/types/api/product-response";
import Image from "next/image";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import env from "@/config";

interface VerticalCarouselProps {
  data?: Product;
  setImageViewUrl?: React.Dispatch<React.SetStateAction<string>>;
}

const getImageUrl = (url?: string) => {
  if (url) return `${env.strapiUrl}${url}`;
  return "/nullimg.webp";
};

const SCROLL_STEP = 10;
const scrollStep = (direction: "up" | "down", smooth = false) => {
  const carousel = document.getElementById("image-carousel");
  if (!carousel) return;
  // match orientation with CSS breakpoint: md and up = vertical; otherwise horizontal
  const isVertical = typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches;
  const delta = direction === "up" ? -SCROLL_STEP : SCROLL_STEP;
  const options: ScrollToOptions = smooth ? { behavior: 'smooth' } : {};
  if (isVertical) {
    carousel.scrollBy({ top: delta, ...options });
  } else {
    carousel.scrollBy({ left: delta, ...options });
  }
};

export default function VerticalCarousel({ data, setImageViewUrl }: VerticalCarouselProps) {
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const [showMobileArrows, setShowMobileArrows] = useState(false);

  const handleScroll = (direction: "up" | "down") => scrollStep(direction, true);

  const handleScrollStart = (direction: "up" | "down") => {
    if (scrollInterval.current) return;
    scrollStep(direction, false);
    scrollInterval.current = setInterval(() => scrollStep(direction, false), 16);
  };

  const handleScrollStop = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  return (
    <div
      className="group flex flex-row md:flex-col h-[120px] md:h-[550px] w-full md:w-[190px] p-2 md:p-3 bg-black/5 rounded-lg shadow-lg border border-black/3 relative"
      onTouchStart={() => setShowMobileArrows(true)}
      onTouchEnd={() => setShowMobileArrows(false)}
      onTouchCancel={() => setShowMobileArrows(false)}
      onMouseLeave={() => setShowMobileArrows(false)}
    >
      {/* Desktop up */}
      <button
        className="hidden md:inline-flex absolute z-10 w-8 h-8 bg-white text-black p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer -top-3 left-1/2 -translate-x-1/2"
        type="button"
        onClick={(e) => { handleScroll("up"); (e.currentTarget as HTMLButtonElement).blur(); }}
        onMouseDown={() => handleScrollStart("up")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        onTouchStart={() => handleScrollStart("up")}
        onTouchEnd={handleScrollStop}
        onTouchCancel={handleScrollStop}
        aria-label="Scroll up"
      >
        <ChevronUp size={14} />
      </button>
      {/* Mobile left */}
      <button
        className={`md:hidden inline-flex absolute z-10 w-8 h-8 bg-white text-black p-2 rounded-full shadow-md transition-opacity cursor-pointer left-[-10px] top-1/2 -translate-y-1/2 ${showMobileArrows ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
        type="button"
        onClick={(e) => { handleScroll("up"); (e.currentTarget as HTMLButtonElement).blur(); }}
        onMouseDown={() => handleScrollStart("up")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        onTouchStart={() => handleScrollStart("up")}
        onTouchEnd={handleScrollStop}
        onTouchCancel={handleScrollStop}
        aria-label="Scroll left"
      >
        <ChevronLeft size={14} />
      </button>

      <div id="image-carousel" className="flex md:flex-col flex-row h-full md:py-3 py-2 md:px-2 px-1 overflow-auto items-center gap-2 hide-scrollbar">
        {data?.media?.map((img, index) => (
          <Image
            key={index}
            className="object-cover rounded-sm md:mb-4 h-16 w-16 md:h-auto md:w-auto cursor-pointer hover:scale-110 transition-all"
            src={getImageUrl(img.url)}
            alt={data.name || "Imagen del producto"}
            loading="lazy"
            width={100}
            height={100}
            unoptimized
            onMouseEnter={() => { if (setImageViewUrl && img.url) setImageViewUrl(getImageUrl(img.url)); }}
            onClick={() => { if (setImageViewUrl && img.url) setImageViewUrl(getImageUrl(img.url)); }}
          />
        ))}
      </div>

      {/* Desktop down */}
      <button
        className="hidden md:inline-flex absolute z-10 w-8 h-8 bg-white text-black p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer -bottom-3 left-1/2 -translate-x-1/2"
        type="button"
        onClick={(e) => { handleScroll("down"); (e.currentTarget as HTMLButtonElement).blur(); }}
        onMouseDown={() => handleScrollStart("down")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        onTouchStart={() => handleScrollStart("down")}
        onTouchEnd={handleScrollStop}
        onTouchCancel={handleScrollStop}
        aria-label="Scroll down"
      >
        <ChevronDown size={14} />
      </button>
      {/* Mobile right */}
      <button
        className={`md:hidden inline-flex absolute z-10 w-8 h-8 bg-white text-black p-2 rounded-full shadow-md transition-opacity cursor-pointer right-[-10px] top-1/2 -translate-y-1/2 ${showMobileArrows ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100`}
        type="button"
        onClick={(e) => { handleScroll("down"); (e.currentTarget as HTMLButtonElement).blur(); }}
        onMouseDown={() => handleScrollStart("down")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        onTouchStart={() => handleScrollStart("down")}
        onTouchEnd={handleScrollStop}
        onTouchCancel={handleScrollStop}
        aria-label="Scroll right"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
