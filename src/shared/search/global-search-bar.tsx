'use client';

import { fetchProductsBySearch } from '@ecommerce-front/features/catalog/services/product/get';
import { useSearch } from '@/shared/search/search-context';
import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const router = useRouter();
  const { setSearch, results } = useSearch();

  // La búsqueda se ejecuta sólo al presionar Enter o click en el icono

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const trimmed = query.trim();
      if (trimmed === '') {
        setSearch('', []);
        if (results && results.length > 0 && query.trim() !== '') {
          router.push('/search');
        } else {
          router.push('/all');
        }
        return;
      }
      try {
        const response = await fetchProductsBySearch(trimmed);
        const products = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
        setSearch(trimmed, products);
      } catch {
        setSearch(trimmed, []);
      }
      router.push('/search');
    }
  };

  const handleClickSearch = async () => {
    const trimmed = query.trim();
    if (trimmed === '') {
      setSearch('', []);
      router.push('/search');
      return;
    }
    try {
      const response = await fetchProductsBySearch(trimmed);
      const products = Array.isArray(response.data) ? response.data : (response.data ? [response.data] : []);
      setSearch(trimmed, products);
    } catch {
      setSearch(trimmed, []);
    }
    router.push('/search');
  };

  return (
    <div className='relative flex w-full text-gray-600'>
      <input
        type='search'
        placeholder='Search'
        className='bg-black/2 border border-black/10 h-10 px-6 py-4 w-full pl-10 rounded-full focus:outline-none'
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button type='button' onClick={handleClickSearch} className='absolute left-0 top-0 mt-3 ml-4'>
        <Search size={16} />
      </button>
    </div>
  );
}
