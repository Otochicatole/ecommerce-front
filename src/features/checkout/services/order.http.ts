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

