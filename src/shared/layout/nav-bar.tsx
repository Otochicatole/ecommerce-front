// Barra de navegación principal
// - Muestra categorías, links, carrito
// - Si sos admin: muestra acceso a /admin y botón de logout
'use client';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/shared/cart/cart-context';
import { fetchAllCategories } from '@ecommerce-front/features/catalog/services/type-product/get';
import { CategoryAttributes } from '@/types/api/category-response';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/shared/auth/admin-auth-context';
import { useRouter } from 'next/navigation';
import SearchBar from '@/shared/search/search-bar';

const links = [
  { href: '/', label: 'Home' },
  { href: '/offers', label: 'Ofertas' },
  { href: '/all', label: 'Todo' },
];

export default function NavBar() {
  const [dropdownLinksCategories, setDropdownLinksCategories] = useState<CategoryAttributes[]>([]);
  const { isAdmin, logout, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchAllCategories();
        setDropdownLinksCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const { totalItems, toggleCart } = useCart();

  return (
    <nav className='fixed top-0 left-0 flex flex-row items-center w-full justify-between px-6 z-50 min-h-20 bg-white shadow-sm'>
      <div />
      {/* Central section with search and links */}
      <div className='flex flex-col pt-3 justify-between gap-3 w-[40%]'>
        <SearchBar />

        <div className='flex px-6 w-full text-black/80'>
          {links.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className='relative z-10 flex justify-center items-center p-2 cursor-pointer border border-transparent min-w-20 hover:border-b-black'
            >
              <span className='mx-1'>{link.label}</span>
            </Link>
          ))}

          <div className='relative group inline-block'>
            <button className='relative z-10 flex items-center p-2 cursor-pointer border border-transparent'>
              <span className='mx-1'>Categorias</span>
              <ChevronDown size={14} className='group-hover:rotate-180 transition-all' />
            </button>
            <div className='absolute right-0 hidden group-hover:block border border-black/5 z-20 w-56 py-2 overflow-hidden bg-white rounded-md shadow-xl'>
              {dropdownLinksCategories.map((cat) => (
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
      </div>

      {/* Right section: admin actions + cart */}
      <div className='flex items-center gap-2'>
        {!loading && (
          isAdmin ? (
            <div className='flex items-center gap-2'>
              <Link
                href='/admin/stock'
                className='px-3 py-2 text-sm border rounded-md hover:bg-gray-100'
              >
                Admin
              </Link>
              <button
                onClick={async () => { await logout(); router.replace('/'); }}
                className='px-3 py-2 text-sm border rounded-md hover:bg-gray-100'
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href={'/login?redirect=' + encodeURIComponent('/admin/stock')}
              className='px-3 py-2 text-sm border rounded-md hover:bg-gray-100'
            >
              Admin login
            </Link>
          )
        )}
        <button onClick={toggleCart} className='relative p-3 hover:bg-gray-100 rounded-lg active:scale-95 transition-transform'>
          <ShoppingCart size={24} />
          {totalItems > 0 && (
            <span className='absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full'>
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
}
