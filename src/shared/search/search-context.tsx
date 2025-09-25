'use client';

import { createContext, useContext, useMemo, useState } from 'react';
import type { Product } from '@/types/api/product-response';

export type SearchState = {
  query: string;
  results: Product[];
};

type SearchContextValue = SearchState & {
  setQuery: (q: string) => void;
  setResults: (r: Product[]) => void;
  setSearch: (q: string, r: Product[]) => void;
};

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<Product[]>([]);

  const value = useMemo<SearchContextValue>(
    () => ({
      query,
      results,
      setQuery,
      setResults,
      setSearch: (q, r) => {
        setQuery(q);
        setResults(r);
      },
    }),
    [query, results]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}


