# checkout feature

sistema de checkout integrado con mercado pago que captura datos del cliente, crea órdenes en strapi y procesa pagos con validación anti-fraude.

## flujo completo con seguridad

1. **resumen del carrito**: el usuario revisa los productos seleccionados y el total
2. **datos personales**: se solicitan nombre, apellido, email y dni del cliente
3. **creación de orden**: se valida el carrito contra strapi y se crea una orden con identificador único
4. **preference de mercado pago**: se genera la preference incluyendo los datos del payer (dni, email, nombre)
5. **pago**: el usuario completa el pago mediante mercado pago wallet
6. **webhook**: cuando MP confirma el pago, actualizamos la orden con los datos REALES del payer
7. **validación al retirar**: verificamos DNI contra los datos finales del pago

## estructura

```
application/
  - create-preference-from-cart.ts  # server action principal

services/
  - order.http.ts                   # CRUD de órdenes en strapi
  - order.utils.ts                  # utilidades (generación de IDs)

domain/
  (future: order validation, business rules)
```

## datos de la orden

cada orden incluye:

**datos iniciales (del checkout):**
- `order`: identificador único (UID) formato `ORD-{nanoid}`
- `name`, `lastName`, `dni`, `email`: datos ingresados por el usuario
- `products`: array con detalles de cada producto
- `total`: suma calculada en el servidor
- `orderPayment`: false inicialmente

**datos finales (del webhook de MP):**
- `payerName`: nombre completo que usó en el pago
- `payerEmail`: email que usó en el pago
- `payerDni`: DNI final que usó en el pago (puede ser diferente)
- `mpPaymentId`: ID del pago en mercado pago
- `mpPaymentStatus`: estado final del pago
- `orderPayment`: true cuando se confirma

## anti-fraude: por qué guardamos los datos del payer

**problema:** los datos pre-cargados pueden cambiar durante el checkout de MP.

**solución:** cuando el webhook confirma el pago, guardamos los datos REALES que se usaron:

```typescript
// datos iniciales (del formulario)
{ name: "Juan", dni: "12345678" }

// datos finales (del pago real)
{ payerName: "Juan Pérez", payerDni: "87654321" }  // ← el cliente cambió el DNI
```

**validación al retirar:**
1. cliente muestra número de orden + DNI físico
2. buscamos la orden en strapi
3. verificamos que el DNI coincida con `payerDni` (no con `dni`)
4. si coincide → entregamos el producto
5. si NO coincide → posible fraude, no entregamos

## integración con mercado pago

el dni y datos del cliente se envían en el objeto `payer` de la preference:

```typescript
{
  payer: {
    name: string,
    surname: string,
    email: string,
    identification: {
      type: 'DNI',
      number: string
    }
  },
  externalReference: orderId  // vincula la preference con la orden de strapi
}
```

## webhook de seguridad

el webhook (`/api/webhooks/mercadopago`):

1. ✅ verifica firma HMAC si está configurado `MP_WEBHOOK_SECRET`
2. ✅ consulta el pago en la API de MP usando `MP_ACCESS_TOKEN`
3. ✅ extrae los datos finales del payer
4. ✅ actualiza la orden solo si `status === "approved"`
5. ✅ registra todo en logs para auditoría

## variables de entorno requeridas

```env
MP_ACCESS_TOKEN=tu_access_token          # obligatorio
MP_WEBHOOK_SECRET=tu_webhook_secret      # recomendado para seguridad
NEXT_PUBLIC_MP_PUBLIC_KEY=tu_public_key  # para el widget de pago
```

## validaciones

### en el checkout:
- carrito no vacío
- productos existen en strapi
- talle existe si fue especificado
- precios se toman del servidor (autoritativos)
- dni numérico 7-8 dígitos
- email válido
- nombre y apellido no vacíos

### en el webhook:
- firma HMAC válida (si está configurado el secret)
- solo procesar pagos aprobados
- external_reference debe existir

### al retirar:
- orden existe en strapi
- `orderPayment === true`
- DNI físico coincide con `payerDni`
- número de orden coincide

## ejemplo de flujo completo

```
1. Usuario completa checkout:
   - nombre: "Juan"
   - dni: "12345678"
   
2. Se crea orden ORD-abc123:
   { name: "Juan", dni: 12345678, orderPayment: false }

3. Usuario va a MP y cambia datos:
   - nombre: "Juan Pérez González"
   - dni: "87654321"
   
4. MP confirma pago, webhook actualiza:
   {
     orderPayment: true,
     payerName: "Juan Pérez González",
     payerDni: "87654321",
     mpPaymentId: "123456789"
   }

5. Cliente viene a retirar:
   - muestra DNI 87654321 ✅
   - muestra orden ORD-abc123 ✅
   - sistema valida payerDni === "87654321" ✅
   - se entrega el producto ✅
```

## logs de auditoría

todos los eventos críticos se loguean:
- creación de orden (con datos del cliente)
- confirmación de pago (con datos del payer real)
- actualizaciones de orden
- errores de validación

esto permite rastrear cualquier fraude o discrepancia.
