'use client';
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  pageCount: number;
  basePath: string;
}

export default function Pagination({ currentPage, pageCount, basePath }: PaginationProps) {
  if (pageCount <= 1) return null;

  const createLink = (page: number) => `${basePath}?page=${page}`;


  const MAX_VISIBLE_PAGES = 10;
  const halfWindow = Math.floor(MAX_VISIBLE_PAGES / 2);
  let startPage = Math.max(1, currentPage - halfWindow);
  const endPage = Math.min(pageCount, startPage + MAX_VISIBLE_PAGES - 1);
  startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, idx) => startPage + idx);

  return (
    <nav className="flex justify-center items-center py-3 gap-3 my-6">
      <Link
        href={createLink(Math.max(currentPage - 1, 1))}
        className={`flex items-center justify-center px-3 py-2 transition-all shadow-xl bg-white rounded-full hover:bg-blue-500 hover:text-white  ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
      >
        <ChevronLeft size={18} />
      </Link>
      {pages.map((page) => (
        <Link
          key={page}
          href={createLink(page)}
          className={`flex items-center justify-center px-3 py-2 transition-all rounded-full shadow-xl w-10 h-10 ${page === currentPage ? 'bg-blue-500 text-white scale-120' : 'bg-white hover:scale-110'}`}
        >
          {page}
        </Link>
      ))}
      <Link
        href={createLink(Math.min(currentPage + 1, pageCount))}
        className={`relative flex items-center justify-center px-3 py-2 transition-all shadow-xl bg-white rounded-full hover:bg-blue-500 hover:text-white  ${currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}`}
      >
        <ChevronRight size={18} />
      </Link>
    </nav>
  );
}
