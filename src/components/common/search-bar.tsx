'use client';
import { fetchAllProducts } from "@/lib/get-products";
import { Product } from "@/types/api/product-response";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function SearchBar() {
    const [data, setData] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dataFiltered, setDataFiltered] = useState<Product[]>([]);
    const [inputFocus, setInputFocus] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const scrollContainerRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (selectedItemIndex !== -1 && scrollContainerRef.current) {
            const selectedItem = scrollContainerRef.current.children[selectedItemIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            }
        }
    }, [selectedItemIndex]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetchAllProducts();
                setData(response.data);
                setDataFiltered(response.data);
            } catch (err) {
                console.error("Failed to fetch products:", err);
            }
        };
        fetchData();
    }, []);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInputFocus(true);
        const query = event.target.value;
        setSearchQuery(query);
        setSelectedItemIndex(-1);
        setError(null);

        const filtered = data.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase())
        );
        setDataFiltered(filtered);
    };

    const handleBlur = () => {
        setTimeout(() => {
            setInputFocus(false);
        }, 150);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedItemIndex(prevIndex =>
                prevIndex < dataFiltered.length - 1 ? prevIndex + 1 : prevIndex
            );
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedItemIndex(prevIndex =>
                prevIndex > 0 ? prevIndex - 1 : 0
            );
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (selectedItemIndex !== -1) {
                router.push(`/product/${dataFiltered[selectedItemIndex].documentId}`);
                setInputFocus(false);
            } else {
                const exactMatch = data.find(
                    (item) => item.name.toLowerCase() === searchQuery.toLowerCase()
                );
                if (exactMatch) {
                    router.push(`/product/${exactMatch.documentId}`);
                    setInputFocus(false);
                } else {
                    setError('no se encontró un producto con ese nombre.');
                }
            }
        } else if (event.key === 'Escape') {
            setInputFocus(false);
        }
    };

    return (
        <>
            <div className="relative flex w-full text-gray-600">
                <input
                    type="search"
                    name="serch"
                    placeholder="Search"
                    onFocus={() => setInputFocus(true)}
                    onBlur={handleBlur}
                    className="bg-black/2 border border-black/10 h-10 px-6 py-4 w-full pl-10 rounded-full focus:outline-none"
                    value={searchQuery}
                    onChange={handleSearch}
                    onKeyDown={handleKeyDown}
                />
                <button
                    type="submit"
                    className="absolute left-0 top-0 mt-3 ml-4">
                    <Search size={16} />
                </button>
                <div
                    className={`absolute bg-white/70 border border-black/10 backdrop-blur-2xl w-full top-11 overflow-hidden rounded-sm z-50 transition-all duration-300 ease-in-out ${inputFocus ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div
                        id="smScroll"
                        ref={scrollContainerRef}
                        className="flex flex-col max-h-[300px] p-1 overflow-y-auto">
                        {error ? (
                            <div className="p-3 text-center text-red-500">{error}</div>
                        ) : dataFiltered.length > 0 ? (
                            dataFiltered.map((item, index) => (
                                <article
                                    onClick={() => router.push(`/product/${item.documentId}`)}
                                    className={`flex flex-col p-3 hover:bg-white/80 hover:shadow rounded-sm transition-all cursor-pointer ${index === selectedItemIndex ? 'bg-white/80 shadow' : ''}`}
                                    key={index}>
                                    {item.name}
                                </article>
                            ))
                        ) : (
                            <div className="p-3 text-center">No se encontro el producto</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
