import { supabase } from '../../../lib/supabase';
import type { Product } from '@xyntra/types';
import { generateRandomCode } from '@xyntra/utils';

export interface CreateProductInput {
  business_id: string;
  category_id?: string;
  sku?: string;
  barcode?: string;
  name: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  tax_rate: number;
}

export const productsApi = {
  async getProducts(businessId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Product[];
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const sku = input.sku?.trim() || generateRandomCode('SKU', 6);
    const barcode = input.barcode?.trim() || generateRandomCode('BAR', 8);

    const { data, error } = await supabase
      .from('products')
      .insert({
        business_id: input.business_id,
        category_id: input.category_id || null,
        sku,
        barcode,
        name: input.name,
        description: input.description,
        image_url: input.image_url || null,
        cost_price: input.cost_price,
        selling_price: input.selling_price,
        stock_quantity: input.stock_quantity,
        minimum_stock: input.minimum_stock,
        tax_rate: input.tax_rate,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async updateProduct(
    id: string,
    input: Partial<CreateProductInput> & { is_active?: boolean }
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async deleteProduct(id: string): Promise<void> {
    // Check if item has historical sales in database
    const { count, error: countError } = await supabase
      .from('transaction_items')
      .select('*', { count: 'exact', head: true })
      .eq('product_id', id);

    if (countError) throw countError;

    if (count && count > 0) {
      // Deactivate instead
      const { error: deacErr } = await supabase
        .from('products')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (deacErr) throw deacErr;
      throw new Error(
        'Product cannot be deleted because it has historical sales. It has been deactivated instead.'
      );
    }

    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
