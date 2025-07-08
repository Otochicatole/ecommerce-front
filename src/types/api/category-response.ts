import { Pagination } from "./pagination";

export interface CategoryAttributes {
  id: number;
  documentId: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}

export interface Category {
  id: number;
  attributes: CategoryAttributes;
}

export interface Meta {
  pagination: Pagination;
}

export interface ApiResponseAllCategories {
  data: CategoryAttributes[];
  meta: Meta;
}
