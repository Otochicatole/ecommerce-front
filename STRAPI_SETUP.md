# configuración de strapi para el sistema de órdenes

este documento explica cómo configurar el content-type **orders** en strapi para que funcione con el sistema anti-fraude.

## crear content-type: orders

en el panel de strapi, andá a **Content-Type Builder** → **Create new collection type**

nombre: `order`

### campos necesarios

#### 1. datos del cliente (ingresados en el checkout)

```
name (Text)
  - tipo: Short text
  - requerido: sí

lastName (Text)
  - tipo: Short text
  - requerido: sí

dni (Number)
  - tipo: Integer
  - requerido: sí

email (Text)
  - tipo: Email
  - no requerido (para compatibilidad con órdenes viejas)
```

#### 2. identificador de orden

```
order (UID)
  - tipo: UID
  - requerido: sí
  - único: sí
  - formato: ORD-{nanoid}
```

#### 3. productos y total

```
products (JSON)
  - tipo: JSON
  - requerido: sí
  - estructura: array de OrderItem
    [
      {
        productId: number,
        documentId: string,
        name: string,
        price: number,
        quantity: number,
        size: string | null
      }
    ]

total (Number)
  - tipo: Decimal
  - requerido: sí
```

#### 4. estado del pago

```
orderPayment (Boolean)
  - tipo: Boolean
  - requerido: sí
  - default: false
```

#### 5. datos del payer (llenados por el webhook) 🔐

estos campos se llenan automáticamente cuando mercado pago confirma el pago:

```
payerName (Text)
  - tipo: Short text
  - no requerido
  - descripción: "Nombre completo usado en el pago de MP"

payerEmail (Text)
  - tipo: Email
  - no requerido
  - descripción: "Email usado en el pago de MP"

payerDni (Text)
  - tipo: Short text
  - no requerido
  - descripción: "DNI final usado en el pago de MP (IMPORTANTE PARA VALIDACIÓN)"

mpPaymentId (Text)
  - tipo: Short text
  - no requerido
  - descripción: "ID del pago en Mercado Pago"

mpPaymentStatus (Text)
  - tipo: Short text
  - no requerido
  - descripción: "Estado del pago (approved, rejected, etc)"
```

## permisos

asegurate de configurar los permisos para que:

### public (sin autenticación)
- `create` en orders ✅ (para crear órdenes desde el checkout)
- `find` y `findOne` ❌ (no queremos que cualquiera vea las órdenes)

### authenticated (con API token)
- `find` ✅
- `findOne` ✅
- `update` ✅ (para el webhook)

## validación al retirar producto

cuando un cliente viene a retirar el producto:

1. **pedile**: número de orden + DNI físico
2. **buscá la orden** en strapi por el campo `order`
3. **verificá**:
   - `orderPayment === true` (que el pago esté confirmado)
   - `payerDni === dni_mostrado` (que el DNI coincida con el usado en el pago)
4. **si todo coincide**: entregás el producto ✅
5. **si NO coincide**: posible fraude, NO entregues el producto ⚠️

## ejemplo de orden completa

```json
{
  "id": 123,
  "documentId": "abc123xyz",
  "order": "ORD-V1StGXR8_Z5jdHi6B-myT",
  
  // datos ingresados en el checkout
  "name": "Juan",
  "lastName": "Pérez",
  "dni": 12345678,
  "email": "juan@email.com",
  
  // productos y total
  "products": [
    {
      "productId": 1,
      "documentId": "xyz789",
      "name": "Remera Negra",
      "price": 15000,
      "quantity": 2,
      "size": "M"
    }
  ],
  "total": 30000,
  
  // estado inicial
  "orderPayment": false,
  
  // estos campos se llenan cuando el webhook confirma el pago
  "payerName": "Juan Pérez González",
  "payerEmail": "juanp@email.com",
  "payerDni": "87654321",  // ← el cliente cambió el DNI en MP
  "mpPaymentId": "123456789",
  "mpPaymentStatus": "approved",
  
  "createdAt": "2025-01-01T10:00:00.000Z",
  "updatedAt": "2025-01-01T10:05:00.000Z",
  "publishedAt": "2025-01-01T10:00:00.000Z"
}
```

## por qué necesitamos payerDni separado

**escenario de fraude:**

1. alguien roba los datos de una tarjeta
2. completa el checkout con DNI falso: `12345678`
3. en mercado pago, usa su propio DNI real: `87654321`
4. el pago se aprueba (tarjeta robada)
5. viene a retirar mostrando DNI `12345678`

**sin payerDni:** le entregamos el producto ❌  
**con payerDni:** verificamos contra `87654321`, no coincide, NO entregamos ✅

el webhook guarda el DNI **real** que se usó en el pago, no el que ingresó en el formulario.

## variables de entorno necesarias

asegurate de tener configuradas en el front:

```env
NEXT_PUBLIC_STRAPI_URL=https://tu-strapi.com
MP_ACCESS_TOKEN=tu_access_token
MP_WEBHOOK_SECRET=tu_webhook_secret (opcional pero recomendado)
NEXT_PUBLIC_MP_PUBLIC_KEY=tu_public_key
```

## testing

para probar el flujo completo:

1. hacé una compra de prueba con tarjetas de test de MP
2. usá un DNI diferente en el checkout vs en mercado pago
3. verificá que el webhook actualice correctamente los campos `payer*`
4. probá validar con ambos DNI para ver que solo funciona con el correcto

## logs de auditoría

todos los eventos se loguean:
- creación de orden (en `create-preference-from-cart.ts`)
- confirmación de pago (en webhook)
- actualizaciones fallidas

revisá los logs del servidor para debugging.

