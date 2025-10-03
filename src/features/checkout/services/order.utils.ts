// Order utilities
// Pure functions for order management

import { nanoid } from 'nanoid';

// Generate a unique order identifier using nanoid
// Format: ORD-{nanoid} (e.g., ORD-V1StGXR8_Z5jdHi6B-myT)
export function generateOrderId(): string {
  return `ORD-${nanoid()}`;
}

