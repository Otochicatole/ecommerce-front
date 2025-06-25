import { Product } from "@/types/types";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRef } from "react";

interface VerticalCarouselProps {
  data: Product;
  setImageViewUrl: React.Dispatch<React.SetStateAction<string>>;
}

const getImageUrl = (url?: string) =>
  `${process.env.NEXT_PUBLIC_STRAPI_URL}${url || ""}`;

const scrollStep = (
  direction: "up" | "down",
  smooth: boolean = false
) => {
  const carousel = document.getElementById("image-carousel");
  if (!carousel) return;
  carousel.scrollBy({
    top: direction === "up" ? -20 : 20,
    ...(smooth ? { behavior: "smooth" } : {}),
  });
};

export default function VerticalCarousel({
  data,
  setImageViewUrl,
}: VerticalCarouselProps) {
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = (direction: "up" | "down") => {
    scrollStep(direction, true);
  };

  const handleScrollStart = (direction: "up" | "down") => {
    if (scrollInterval.current) return;
    scrollStep(direction, false);
    scrollInterval.current = setInterval(() => {
      scrollStep(direction, false);
    }, 16);
  };

  const handleScrollStop = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  return (
    <div className="flex flex-col h-[550px] w-[190px] p-3 bg-black/5 rounded-lg shadow-lg border border-black/3 relative group">
      <button
        className="absolute -top-5 w-7 h-7 left-1/2 transform z-10 -translate-x-1/2 bg-white text-black p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
        onClick={() => handleScroll("up")}
        onMouseDown={() => handleScrollStart("up")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        aria-label="Scroll up"
      >
        <ChevronUp size={12} />
      </button>
      <div
        id="image-carousel"
        className="flex flex-col h-[500px] overflow-auto items-center hide-scrollbar"
      >
        {data.media?.map((img, index) => (
          <Image
            key={index}
            className="object-cover rounded-sm mb-4 cursor-pointer hover:scale-110 transition-all"
            src={getImageUrl(img.url)}
            alt={data.name || "Imagen del producto"}
            width={100}
            height={100}
            unoptimized
            onMouseEnter={() => setImageViewUrl(getImageUrl(img.url))}
          />
        ))}
      </div>
      <button
        className="absolute -bottom-3 left-1/2 transform w-7 h-7 z-10 -translate-x-1/2 bg-white text-black p-2 rounded-full shadow-md opacity-0 transition-all group-hover:opacity-100 cursor-pointer"
        onClick={() => handleScroll("down")}
        onMouseDown={() => handleScrollStart("down")}
        onMouseUp={handleScrollStop}
        onMouseLeave={handleScrollStop}
        aria-label="Scroll down"
      >
        <ChevronDown size={12} />
      </button>
    </div>
  );
}
