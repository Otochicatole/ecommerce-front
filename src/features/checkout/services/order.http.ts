'use server';

// Order HTTP Service
// Handles communication with Strapi for order management

import httpClient from '@/config/http';

export type OrderItem = {
  productId: number;
  documentId: string;
  name: string;
  price: number;
  quantity: number;
  size: string | null;
};

export type CreateOrderPayload = {
  name: string;
  lastName: string;
  dni: number;
  products: OrderItem[];
  total: number;
  order: string; // unique order identifier (UID)
  orderPayment: boolean;
};

export type OrderResponse = {
  data: {
    id: number;
    documentId: string;
    name: string;
    lastName: string;
    dni: number;
    products: OrderItem[];
    total: number;
    order: string;
    orderPayment: boolean;
    payerName?: string;
    payerEmail?: string;
    payerDni?: string;
    mpPaymentId?: string;
    mpPaymentStatus?: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  };
};

// Create a new order in Strapi
export async function createOrder(payload: CreateOrderPayload): Promise<OrderResponse> {
  const { data } = await httpClient.post<OrderResponse>('/api/orders', {
    data: payload,
  });
  return data;
}

// Update order payment status and payer info after payment confirmation
export async function updateOrderPayment(
  orderId: string,
  paymentData: {
    orderPayment: boolean;
    payerName?: string;
    payerEmail?: string;
    payerDni?: string;
    mpPaymentId?: string;
    mpPaymentStatus?: string;
  }
): Promise<OrderResponse> {
  // Find order by order field (unique identifier)
  type OrderListResponse = { data: OrderResponse['data'][] };
  const { data: responseData } = await httpClient.get<OrderListResponse>(
    `/api/orders?filters[order][$eq]=${orderId}`
  );

  const orders = responseData.data;

  if (!orders || !Array.isArray(orders) || orders.length === 0) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const order = orders[0];

  // Update order with payment confirmation data
  const { data } = await httpClient.put<OrderResponse>(
    `/api/orders/${order.documentId}`,
    {
      data: paymentData,
    }
  );

  return data;
}

