// TypeScript types for the API response

// Product type
export interface Product {
  id: number;
  documentId: string;
  name: string;
  description: any;
  price: string;
  offerPrice: string;
  offer: boolean;
  stock: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  show: boolean;
  media: Media[];
  sizes: Size[];
  type_products: TypeProduct[];
}

interface Size {
  id: number;
  documentId: string;
  size: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Media {
  id: number;
  documentId: string;
  name: string;
  alternativeText: string | null;
  caption: string | null;
  width: number | null;
  height: number | null;
  formats: {
    thumbnail?: Format;
    small?: Format;
    medium?: Format;
    large?: Format;
  } | null;
  hash: string;
  ext: string;
  mime: string;
  size: number;
  url: string;
  previewUrl: string | null;
  provider: string;
  provider_metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

interface Format {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  path: string | null;
  width: number;
  height: number;
  size: number;
  sizeInBytes: number;
  url: string;
}

interface TypeProduct {
  id: number;
  documentId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

// Pagination type
export interface Pagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// Meta type containing pagination
export interface Meta {
  pagination: Pagination;
}

// API response type
export interface ApiResponseAllProducts {
  data: Product[];
  meta: Meta;
}

export interface ApiResponseProductById {
  data: Product;
  meta: Meta;
}

