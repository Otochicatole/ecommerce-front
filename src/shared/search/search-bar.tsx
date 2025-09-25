'use client';
import { fetchProductsBySearch } from '@ecommerce-front/features/catalog/services/product/get';
import { Product } from '@/types/api/product-response';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIndex !== -1 && scrollContainerRef.current) {
      const selectedItem = scrollContainerRef.current.children[selectedIndex] as HTMLElement;
      selectedItem?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);


  useEffect(() => {
    const trimmed = query.trim();
    setError(null);
    setSelectedIndex(-1);
    if (trimmed === '') {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      try {
        const response = await fetchProductsBySearch(trimmed);
        const products = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
        setResults(products);
      } catch {
        setError('no pudimos buscar ahora, probá de nuevo en un rato.');
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [query]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true);
    setQuery(event.target.value);
  };

  const handleBlur = () => {
    if (error) return;
    setTimeout(() => setIsOpen(false), 150);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : i));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const exact = results.find((p) => p.name.toLowerCase() === query.toLowerCase());
      const target = selectedIndex !== -1 ? results[selectedIndex] : (exact ?? results[0]);
      if (target) {
        router.push(`/product/${target.documentId}`);
      } else {
        setError(`No se encontró un producto. por favor, intenta con otro nombre.`);
        setIsOpen(true);
      }
      if (target) setIsOpen(false);
    } else if (event.key === 'Escape') {
      setError(null);
      setIsOpen(false);
    }
  };

  return (
    <div className='relative flex w-full text-gray-600'>
      <input
        type='search'
        placeholder='Search'
        onFocus={() => setIsOpen(true)}
        onBlur={handleBlur}
        className='bg-black/2 border border-black/10 h-10 px-6 py-4 w-full pl-10 rounded-full focus:outline-none'
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button type='submit' className='absolute left-0 top-0 mt-3 ml-4'>
        <Search size={16} />
      </button>
      <div className={`absolute bg-white/70 border border-black/10 backdrop-blur-2xl w-full top-11 overflow-hidden rounded-sm z-50 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[340px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div id='smScroll' ref={scrollContainerRef} className='flex flex-col max-h-[300px] p-1 overflow-y-auto'>
          {error ? (
            <div className='p-3 text-center text-red-500'>{error}</div>
          ) : results.length > 0 ? (
            results.map((item, index) => (
              <article
                key={index}
                onClick={() => router.push(`/product/${item.documentId}`)}
                className={`flex flex-col p-3 hover:bg-white/80 hover:shadow rounded-sm transition-all cursor-pointer ${index === selectedIndex ? 'bg-white/80 shadow' : ''}`}
              >
                {item.name}
              </article>
            ))
          ) : (
            <div className='p-3 text-center'>Busca tu producto</div>
          )}
        </div>
      </div>
    </div>
  );
}
