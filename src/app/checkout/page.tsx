'use client';
import Box from '@/shared/ui/box';
import { useCart } from '@/shared/cart/cart-context';
import Image from 'next/image';
import { getPublicImageUrl } from '@/shared/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wallet, initMercadoPago } from '@mercadopago/sdk-react';
import { createPreferenceFromCart } from '@/features/checkout/application/create-preference-from-cart';
import toast from 'react-hot-toast';

type CheckoutStep = 'cart' | 'customer-data' | 'payment';

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // customer form state
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dni, setDni] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY as string | undefined;
    if (publicKey) initMercadoPago(publicKey);
  }, []);

  const handleContinueToCustomerData = () => {
    if (items.length === 0) return;
    setStep('customer-data');
  };

  const handleBackToCart = () => {
    setStep('cart');
  };

  const validateCustomerData = (): boolean => {
    if (!name.trim()) {
      toast.error('ingresá tu nombre');
      return false;
    }
    if (!lastName.trim()) {
      toast.error('ingresá tu apellido');
      return false;
    }
    if (!email.trim()) {
      toast.error('ingresá tu email');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast.error('ingresá un email válido');
      return false;
    }
    if (!dni.trim()) {
      toast.error('ingresá tu DNI');
      return false;
    }
    const dniNum = Number(dni);
    if (!Number.isInteger(dniNum) || dniNum <= 0) {
      toast.error('el DNI debe ser un número válido');
      return false;
    }
    if (dni.length < 7 || dni.length > 8) {
      toast.error('el DNI debe tener entre 7 y 8 dígitos');
      return false;
    }
    return true;
  };

  const createPreference = async () => {
    if (items.length === 0 || loading) return;

    if (!validateCustomerData()) return;

    setLoading(true);
    try {
      const cartPayload = items.map(({ product, size, quantity }) => ({
        productId: product.id,
        documentId: product.documentId,
        size,
        quantity,
      }));

      const customerData = {
        name: name.trim(),
        lastName: lastName.trim(),
        dni: dni.trim(),
        email: email.trim(),
      };

      const result = await createPreferenceFromCart(cartPayload, customerData);
      setPreferenceId(result.preferenceId);
      setOrderId(result.orderId);
      setStep('payment');
      toast.success('orden creada correctamente');
    } catch (err: unknown) {
      console.error('Failed to create preference', err);
      const message = err instanceof Error ? err.message : 'error al crear la orden';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex justify-center p-6 min-h-screen">
      <Box className="w-full max-w-3xl space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">checkout</h1>

        {items.length === 0 ? (
          <p className="text-gray-600">tu carrito está vacío. <Link href="/" className="text-blue-600 hover:underline">seguir comprando</Link></p>
        ) : (
          <>
            {/* Cart summary - always visible */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800">resumen del pedido</h2>
              <ul className="divide-y divide-gray-200 border rounded-lg">
                {items.map(({ product, size, quantity }) => {
                  const imageUrl = getPublicImageUrl(product.media?.[0]?.formats?.thumbnail?.url ?? product.media?.[0]?.url);
                  return (
                    <li key={`${product.id}-${size ?? 'na'}`} className="flex items-center gap-4 p-4">
                      <Image src={imageUrl} alt={product.name} width={64} height={64} className="rounded-md object-cover" unoptimized />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                        {size && <p className="text-sm text-gray-500">talle: {size}</p>}
                      </div>
                      <p className="text-sm text-gray-700">x{quantity}</p>
                      <p className="text-sm font-medium text-gray-900">${(product.offer ? product.offerPrice : product.price).toLocaleString('en-US')}</p>
                    </li>
                  );
                })}
              </ul>

              <div className="flex justify-between text-lg font-semibold border-t pt-4">
                <span>total</span>
                <span>${totalPrice.toLocaleString('en-US')}</span>
              </div>
            </div>

            {/* Step: Cart - Button to continue */}
            {step === 'cart' && (
              <button
                onClick={handleContinueToCustomerData}
                className="w-full bg-blue-600 text-white py-3 rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform"
              >
                continuar con la compra
              </button>
            )}

            {/* Step: Customer Data - Form */}
            {step === 'customer-data' && (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-800">datos personales</h2>
                <p className="text-sm text-gray-600">necesitamos estos datos para generar tu orden de compra</p>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      nombre
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu nombre"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      apellido
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu apellido"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-1">
                      DNI
                    </label>
                    <input
                      type="text"
                      id="dni"
                      value={dni}
                      onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                      maxLength={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="sin puntos ni espacios"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">este dato se usará para validar tu orden al retirar el producto</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleBackToCart}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg shadow hover:bg-gray-300 active:scale-95 transition-transform"
                  >
                    volver
                  </button>
                  <button
                    onClick={createPreference}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg shadow hover:bg-blue-700 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {loading ? 'creando orden...' : 'proceder al pago'}
                  </button>
                </div>
              </div>
            )}

            {/* Step: Payment - Mercado Pago Wallet */}
            {step === 'payment' && preferenceId && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h2 className="text-lg font-medium text-green-800 mb-2">orden creada correctamente</h2>
                  <p className="text-sm text-green-700 mb-1">número de orden: <span className="font-mono font-semibold">{orderId}</span></p>
                  <p className="text-sm text-green-700">completá el pago para finalizar tu compra</p>
                </div>

                <div className="pt-2">
                  <Wallet initialization={{ preferenceId, redirectMode: 'self' }} />
                </div>
              </div>
            )}
          </>
        )}
      </Box>
    </main>
  );
}

