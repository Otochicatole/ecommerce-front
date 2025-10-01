// Barra de navegación principal
// - Muestra categorías, links, carrito
// - Si sos admin: muestra acceso a /admin y botón de logout
'use client';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/shared/cart/cart-context';
import { CategoryAttributes } from '@/types/api/category-response';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import GlobalSearchBar from '@shared/search/global-search-bar';
import { useAdminAuth } from '@shared/auth/admin-auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
  { href: '/', label: 'Home' },
  { href: '/offers', label: 'Ofertas' },
  { href: '/all', label: 'Todo' },
];

type MinimalCategory = { documentId?: string; type: string };
type NavBarProps = { categories?: Array<CategoryAttributes | MinimalCategory> };

export default function NavBar({ categories = [] as CategoryAttributes[] }: NavBarProps) {
  const { isAdmin, logout, loading } = useAdminAuth();
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // categories are provided by server; keep an effect only if you plan to refresh client-side in the future

  const { totalItems, toggleCart } = useCart();

  // Avoid hydration mismatch by rendering a stable shell on first paint
  if (!mounted) {
    return (
      <nav
        className='fixed top-0 left-0 w-full z-50 bg-white shadow-sm'
        style={{ height: 'var(--nav-height)' }}
      >
        <div className='mx-auto max-w-screen-xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4' />
      </nav>
    );
  }

  if (isAdmin) {
    return (
      <nav
        className='fixed top-0 left-0 w-full z-50 bg-white shadow-sm'
        style={{ height: 'var(--nav-height)' }}
      >
        <div className='mx-auto max-w-screen-xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-end'>
          {!loading && (
            isAdmin && (
              <div className='flex items-center gap-2'>
                <button
                  onClick={async () => { await logout(); router.replace('/'); }}
                  className='px-3 py-2 text-sm border rounded-md hover:bg-gray-100'
                >
                  Logout
                </button>
              </div>
            )
          )}
        </div>
      </nav>
    );
  }


  return (
    <nav
      className='fixed top-0 left-0 w-full z-50 bg-white shadow-sm'
      style={{ height: 'var(--nav-height)' }}
    >
      <div className=' lg:ml-30 max-w-screen-xl h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4'>
        {/* left: mobile hamburger */}
        <div className='flex md:hidden items-center z-[60]'>
          <label className='cursor-pointer'>
            <input
              type='checkbox'
              className='hidden'
              aria-label='abrir menú'
              checked={mobileOpen}
              onChange={() => setMobileOpen(v => !v)}
            />
            <svg
              viewBox='0 0 32 32'
              className={`h-8 w-8 transition-transform duration-[600ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? '-rotate-45' : ''}`}
            >
              <path
                d='M27 10 13 10C10.8 10 9 8.2 9 6 9 3.5 10.8 2 13 2 15.2 2 17 3.8 17 6L17 26C17 28.2 18.8 30 21 30 23.2 30 25 28.2 25 26 25 23.8 23.2 22 21 22L7 22'
                fill='none'
                stroke='#111827'
                strokeWidth={3}
                strokeLinecap='round'
                strokeLinejoin='round'
                style={{
                  transition: 'stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)',
                  strokeDasharray: mobileOpen ? '20 300' : '12 63',
                  strokeDashoffset: mobileOpen ? -32.42 : 0,
                }}
              />
              <path
                d='M7 16 27 16'
                fill='none'
                stroke='#111827'
                strokeWidth={3}
                strokeLinecap='round'
                strokeLinejoin='round'
                style={{
                  transition: 'stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1), stroke-dashoffset 600ms cubic-bezier(0.4,0,0.2,1)'
                }}
              />
            </svg>
          </label>
        </div>



        {/* desktop: primary nav links */}
        <div className='hidden md:flex items-center gap-2 text-black/80'>
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className='relative z-10 flex justify-center items-center px-3 py-2 cursor-pointer border border-transparent hover:border-b-black'
            >
              <span className='mx-1'>{link.label}</span>
            </Link>
          ))}
          <div className='relative group inline-block'>
            <button className='relative z-10 flex items-center px-3 py-2 cursor-pointer border border-transparent'>
              <span className='mx-1'>Categorias</span>
              <ChevronDown size={14} className='group-hover:rotate-180 transition-all' />
            </button>
            <div className='absolute left-0 hidden group-hover:block border border-black/5 z-20 w-56 py-2 overflow-hidden bg-white rounded-md shadow-xl'>
              {categories.map((cat) => (
                <Link
                  key={cat.documentId}
                  href={`/category/${encodeURIComponent(cat.type)}`}
                  className='block px-4 py-3 text-sm capitalize transition-colors duration-200 transform hover:bg-gray-100'
                >
                  {cat.type}
                </Link>
              ))}
            </div>
          </div>
        </div>
        {/* search centered */}
        <div className='flex-1 px-2 md:px-6'>
          <GlobalSearchBar />
        </div>

        <div className='flex items-center gap-2'>
          <button onClick={toggleCart} className='relative p-3 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform'>
            <ShoppingCart size={24} />
            {totalItems > 0 && (
              <span className='absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full'>
                {totalItems}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* mobile dropdown panel with animation */}
      <div
        className={`absolute top-full left-0 w-full border-t z-[60] md:hidden transition-all duration-200 ease-out ${mobileOpen ? 'bg-white opacity-100 translate-y-0 shadow-lg pointer-events-auto' : 'bg-white/80 opacity-0 -translate-y-2 shadow-none pointer-events-none'}`}
        aria-hidden={!mobileOpen}
      >
        <nav className='px-4 py-3 space-y-1'>
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className='block w-full text-left px-3 py-2 rounded-md text-gray-900 transition-colors duration-200 hover:bg-gray-100'
            >
              {l.label}
            </Link>
          ))}

          <div className='pt-2'>
            <button
              type='button'
              className='w-full flex items-center justify-between px-3 py-2 rounded-md text-gray-900 transition-colors duration-200 hover:bg-gray-100'
              onClick={() => setMobileCatsOpen(v => !v)}
              aria-expanded={mobileCatsOpen}
            >
              <span>Categorias</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${mobileCatsOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`mt-1 overflow-hidden rounded-md border border-gray-100 transition-all duration-300 ${mobileCatsOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              {categories.map((cat) => (
                <Link
                  key={cat.documentId}
                  href={`/category/${encodeURIComponent(cat.type)}`}
                  onClick={() => setMobileOpen(false)}
                  className='block px-4 py-2 text-sm capitalize text-gray-800 transition-colors duration-200 hover:bg-gray-50'
                >
                  {cat.type}
                </Link>
              ))}
              {categories.length === 0 && (
                <span className='block px-4 py-2 text-sm text-gray-500'>sin categorías</span>
              )}
            </div>
          </div>
        </nav>
      </div>
    </nav>
  );
}
