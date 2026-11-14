import { apiClient } from '@/lib/api-client';
import type {
  CreateProductPayload,
  Product,
  ProductsListResponse,
} from '@/types/contracts';

export async function fetchProductsApi(params?: {
  search?: string;
  category?: string;
  gstRate?: string;
}): Promise<ProductsListResponse> {
  const { data } = await apiClient.get<ProductsListResponse>('/products', {
    params,
  });
  return data;
}

export async function createProductApi(
  payload: CreateProductPayload,
): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload);
  return data;
}

export async function updateProductApi(
  id: string,
  payload: Partial<CreateProductPayload>,
): Promise<Product> {
  const { data } = await apiClient.patch<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteProductApi(
  id: string,
): Promise<{ success: boolean }> {
  const { data } = await apiClient.delete<{ success: boolean }>(
    `/products/${id}`,
  );
  return data;
}

export async function seedProductsApi(): Promise<{
  count: number;
  data: Product[];
}> {
  const { data } = await apiClient.post<{ count: number; data: Product[] }>(
    '/products/seed',
  );
  return data;
}
