// Order API response types
// These types match the Strapi "orders" collection type

export interface OrderItem {
  productId: number;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
}

export interface Order {
  id: number;
  documentId: string;
  name: string;
  lastName: string;
  dni: number;
  products: OrderItem[];
  total: number;
  order: string; // unique order identifier (UID)
  orderPayment: boolean;
  // Payer data from Mercado Pago (filled after payment confirmation)
  payerName?: string;
  payerEmail?: string;
  payerDni?: string;
  mpPaymentId?: string;
  mpPaymentStatus?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface ApiResponseOrder {
  data: Order;
}

export interface ApiResponseAllOrders {
  data: Order[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

