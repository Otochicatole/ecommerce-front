'use client';
import { fetchAllProducts } from "@/lib/get-products";
import { Product } from "@/types/api/product-response";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchBar() {
    const [data, setData] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [dataFiltered, setDataFiltered] = useState<Product[]>([]);
    const [inputFocus, setInputFocus] = useState(false);
    const router = useRouter();


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
        const query = event.target.value;
        setSearchQuery(query);

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
                        className="flex flex-col max-h-[300px] p-1 overflow-y-auto">
                        {dataFiltered.length > 0 ? (
                            dataFiltered.map((item, index) => (
                                <article
                                    onClick={() => router.push(`/product/${item.documentId}`)}
                                    className="flex flex-col p-3 hover:bg-white/80 hover:shadow rounded-sm transition-all cursor-pointer"
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