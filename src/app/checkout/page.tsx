'use client';
import Box from '@/shared/ui/box';
import { useCart } from '@/shared/cart/cart-context';
import Image from 'next/image';
import env from '@/config';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();

  const handleConfirm = () => {
    // placeholder – real integration with payment would go here
    alert('Gracias por tu compra');
    clearCart();
    router.push('/');
  };

  return (
    <main className="flex justify-center p-6 min-h-screen">
      <Box className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>

        {items.length === 0 ? (
          <p className="text-gray-600">Tu carrito está vacío. <Link href="/" className="text-blue-600 hover:underline">Seguir comprando</Link></p>
        ) : (
          <>
            <ul className="divide-y divide-gray-200">
              {items.map(({ product, size, quantity }) => {
                const imageUrl = product.media?.[0]?.url ? `${env.strapiUrl}${product.media[0].formats?.thumbnail?.url ?? product.media[0].url}` : '/nullimg.webp';
                return (
                  <li key={`${product.id}-${size ?? 'na'}`} className="flex items-center gap-4 py-4">
                    <Image src={imageUrl} alt={product.name} width={64} height={64} className="rounded-md object-cover" unoptimized />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      {size && <p className="text-sm text-gray-500">Talle: {size}</p>}
                    </div>
                    <p className="text-sm text-gray-700">x{quantity}</p>
                    <p className="text-sm font-medium text-gray-900">${Number(product.offer ? product.offerPrice : product.price).toLocaleString('en-US')}</p>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>${totalPrice.toLocaleString('en-US')}</span>
            </div>

            <button onClick={handleConfirm} className="w-full bg-blue-600 text-white py-3 rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform">
              Confirmar compra
            </button>
          </>
        )}
      </Box>
    </main>
  );
}

