import { Product } from "@/types/types";
import Image from "next/image";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function VerticalCarousel({
  data,
  setImageViewUrl,
}: {
  data: Product;
  setImageViewUrl: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <>
      <div className="flex flex-col h-[550px] w-[112px] p-3 bg-black/5 rounded-lg shadow-lg border border-black/3 relative group">
        <button
          className="absolute -top-5 w-7 h-7 left-1/2 transform z-10 -translate-x-1/2 bg-white text-black p-2 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
          onClick={() => {
            document.getElementById("image-carousel")?.scrollBy({
              top: -100,
              behavior: "smooth",
            });
          }}
        >
          <ChevronUp size={12} />
        </button>
        <div
          id="image-carousel"
          className="h-[500px] overflow-hidden scrollbar-hide"
        >
          {data.media?.map((img, index) => (
            <Image
              onMouseEnter={() => {
                setImageViewUrl(
                  `${process.env.NEXT_PUBLIC_STRAPI_URL}${img.url || ""}`,
                );
              }}
              key={index}
              className="object-cover rounded-sm mb-4 cursor-pointer hover:scale-110 transition-all"
              src={`${process.env.NEXT_PUBLIC_STRAPI_URL}${img.url || ""}`}
              alt={data.name || "/nullimg.webp"}
              width={100}
              height={100}
              unoptimized
            />
          ))}
        </div>
        <button
          className="absolute -bottom-3 left-1/2 transform w-7 h-7 z-10 -translate-x-1/2 bg-white text-black p-2 rounded-full shadow-md opacity-0 transition-all group-hover:opacity-100 cursor-pointer"
          onClick={() => {
            document.getElementById("image-carousel")?.scrollBy({
              top: 100,
              behavior: "smooth",
            });
          }}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </>
  );
}
