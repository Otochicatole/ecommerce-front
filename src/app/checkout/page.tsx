'use client';
import { useCart } from '@/shared/cart/cart-context';
import Image from 'next/image';
import { getPublicImageUrl } from '@/shared/utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Wallet, initMercadoPago } from '@mercadopago/sdk-react';
import { createPreferenceFromCart } from '@/features/checkout/application/create-preference-from-cart';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import styles from '@/styles/checkout/checkout.module.css';

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

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const transition = { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <main className={styles.container}>
      <div className={styles.wrapper}>
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          checkout
        </motion.h1>

        {items.length === 0 ? (
          <motion.div
            className={styles.emptyState}
            {...fadeIn}
            transition={transition}
          >
            <p className={styles.emptyStateText}>
              tu carrito está vacío
            </p>
            <Link href="/" className={styles.emptyStateLink}>
              continuar comprando
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Cart summary - always visible */}
            <motion.div className={styles.card} {...fadeIn} transition={transition}>
              <h2 className={styles.sectionTitle}>resumen del pedido</h2>
              <div className={styles.productList}>
                {items.map(({ product, size, quantity }) => {
                  const imageUrl = getPublicImageUrl(product.media?.[0]?.formats?.thumbnail?.url ?? product.media?.[0]?.url);
                  return (
                    <div key={`${product.id}-${size ?? 'na'}`} className={styles.productItem}>
                      <Image
                        src={imageUrl}
                        alt={product.name}
                        width={64}
                        height={64}
                        className={styles.productImage}
                        unoptimized
                      />
                      <div className={styles.productInfo}>
                        <p className={styles.productName}>{product.name}</p>
                        {size && <p className={styles.productSize}>talle: {size}</p>}
                      </div>
                      <p className={styles.productQuantity}>x{quantity}</p>
                      <p className={styles.productPrice}>
                        ${(product.offer ? product.offerPrice : product.price).toLocaleString('en-US')}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className={styles.totalRow}>
                <span className={styles.totalLabel}>total</span>
                <span className={styles.totalValue}>${totalPrice.toLocaleString('en-US')}</span>
              </div>
            </motion.div>

            {/* Step: Cart - Button to continue */}
            <AnimatePresence mode="wait">
              {step === 'cart' && (
                <motion.button
                  key="cart-button"
                  onClick={handleContinueToCustomerData}
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  {...fadeIn}
                  transition={transition}
                  whileTap={{ scale: 0.97 }}
                >
                  continuar con la compra
                </motion.button>
              )}

              {/* Step: Customer Data - Form */}
              {step === 'customer-data' && (
                <motion.div
                  key="customer-form"
                  className={styles.card}
                  {...fadeIn}
                  transition={transition}
                >
                  <h2 className={styles.sectionTitle}>datos personales</h2>
                  <p className={styles.sectionDescription}>
                    necesitamos estos datos para generar tu orden de compra
                  </p>

                  <div className={styles.form}>
                    <div className={styles.formGroup}>
                      <label htmlFor="name" className={styles.label}>
                        nombre
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={styles.input}
                        placeholder="tu nombre"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="lastName" className={styles.label}>
                        apellido
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={styles.input}
                        placeholder="tu apellido"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="email" className={styles.label}>
                        email
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={styles.input}
                        placeholder="tu@email.com"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="dni" className={styles.label}>
                        DNI
                      </label>
                      <input
                        type="text"
                        id="dni"
                        value={dni}
                        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                        maxLength={8}
                        className={styles.input}
                        placeholder="sin puntos ni espacios"
                        required
                      />
                      <p className={styles.inputHint}>
                        este dato se usará para validar tu orden al retirar el producto
                      </p>
                    </div>
                  </div>

                  <div className={styles.buttonGroup}>
                    <motion.button
                      onClick={handleBackToCart}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      whileTap={{ scale: 0.97 }}
                    >
                      volver
                    </motion.button>
                    <motion.button
                      onClick={createPreference}
                      disabled={loading}
                      className={`${styles.button} ${styles.buttonPrimary} ${loading ? styles.loading : ''}`}
                      whileTap={{ scale: loading ? 1 : 0.97 }}
                    >
                      <span className={loading ? styles.loadingText : ''}>
                        {loading ? 'creando orden' : 'proceder al pago'}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Step: Payment - Mercado Pago Wallet */}
              {step === 'payment' && preferenceId && (
                <motion.div
                  key="payment"
                  {...fadeIn}
                  transition={transition}
                >
                  <div className={styles.successCard}>
                    <h2 className={styles.successTitle}>orden creada correctamente</h2>
                    <p className={styles.successText}>número de orden</p>
                    <div className={styles.orderNumber}>{orderId}</div>

                    <div className={styles.successDivider} />

                    <p className={styles.successInstructions}>
                      importante para retirar tu pedido:
                    </p>
                    <ul className={styles.instructionsList}>
                      <li>guardá este número de orden</li>
                      <li>llevá tu DNI y el comprobante de pago</li>
                      <li>la entrega es en persona previa coordinación</li>
                    </ul>
                  </div>

                  <motion.div
                    style={{ marginTop: 20 }}
                    className={styles.card}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className={styles.sectionTitle}>completar pago</h2>
                    <Wallet initialization={{ preferenceId, redirectMode: 'self' }} />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </main>
  );
}

