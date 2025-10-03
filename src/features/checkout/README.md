# checkout feature

sistema de checkout integrado con mercado pago que captura datos del cliente, crea órdenes en strapi y procesa pagos.

## flujo

1. **resumen del carrito**: el usuario revisa los productos seleccionados y el total
2. **datos personales**: se solicitan nombre, apellido y dni del cliente
3. **creación de orden**: se valida el carrito contra strapi y se crea una orden con identificador único
4. **preference de mercado pago**: se genera la preference incluyendo los datos del payer (dni)
5. **pago**: el usuario completa el pago mediante mercado pago wallet
6. **confirmación**: el webhook actualiza el estado de la orden cuando se confirma el pago

## estructura

```
application/
  - create-preference-from-cart.ts  # server action principal

services/
  - order.http.ts                   # comunicación con strapi para órdenes

domain/
  (future: order validation, business rules)
```

## datos de la orden

cada orden incluye:
- **order**: identificador único (UID) formato `ORD-{timestamp}-{random}`
- **name, lastName, dni**: datos personales del cliente
- **products**: array con detalles de cada producto (id, documentId, name, price, quantity, size)
- **total**: suma calculada en el servidor
- **orderPayment**: false por defecto, se actualiza a true cuando el webhook confirma el pago

## integración con mercado pago

el dni y datos del cliente se envían en el objeto `payer` de la preference:

```typescript
{
  payer: {
    name: string,
    surname: string,
    identification: {
      type: 'DNI',
      number: string
    }
  },
  externalReference: orderId  // vincula la preference con la orden de strapi
}
```

esto hace que el dni aparezca en los detalles del pago de mercado pago, permitiendo validar la orden al momento de entregar el producto en persona.

## validaciones

- carrito no vacío
- productos existen en strapi y coinciden con los datos del cliente
- talle existe si fue especificado
- precios se toman del servidor (autoritativos)
- dni es numérico y tiene entre 7 y 8 dígitos
- nombre y apellido no están vacíos

## próximos pasos (opcional)

- actualizar `orderPayment` mediante webhook cuando se confirma el pago
- página de confirmación mostrando el orderId para que el cliente lo guarde
- panel admin para gestionar órdenes y entregas

