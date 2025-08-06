'use client';
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  basePath: string; // e.g. "/all" or "/offers"
}

export default function Pagination({ currentPage, pageCount, basePath }: PaginationProps) {
  if (pageCount <= 1) return null;

  const createLink = (page: number) => `${basePath}?page=${page}`;

  return (
    <nav className="flex justify-center gap-2 my-6">
      <Link
        href={createLink(Math.max(currentPage - 1, 1))}
        className={`px-3 py-2 border rounded ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
      >
        Prev
      </Link>
      {Array.from({ length: pageCount }).map((_, idx) => {
        const page = idx + 1;
        return (
          <Link
            key={page}
            href={createLink(page)}
            className={`px-3 py-2 border rounded ${page === currentPage ? 'bg-black text-white' : ''}`}
          >
            {page}
          </Link>
        );
      })}
      <Link
        href={createLink(Math.min(currentPage + 1, pageCount))}
        className={`px-3 py-2 border rounded ${currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}`}
      >
        Next
      </Link>
    </nav>
  );
}
