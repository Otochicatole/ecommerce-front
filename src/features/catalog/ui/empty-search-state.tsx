interface EmptySearchStateProps {
  query?: string;
}

export default function EmptySearchState({ query }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="text-center max-w-md">
        <svg
          className="mx-auto mb-6"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="11"
            cy="11"
            r="7"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M16 16L21 21"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.3"
          />
        </svg>
        
        <h2 className="text-xl font-semibold mb-2 tracking-tight" style={{ color: 'var(--foreground)' }}>
          No se encontraron productos
        </h2>
        
        {query && (
          <p className="text-base mb-4" style={{ color: 'var(--ios-gray)' }}>
            No hay resultados para &ldquo;<span className="font-medium">{query}</span>&rdquo;
          </p>
        )}
        
        <p className="text-sm" style={{ color: 'var(--ios-gray)', opacity: 0.8 }}>
          Probá buscando con otras palabras o navegá por las categorías
        </p>
      </div>
    </div>
  );
}

