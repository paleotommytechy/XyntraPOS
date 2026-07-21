import { supabase } from '../../../lib/supabase';
import type { Category } from '@xyntra/types';

export const categoriesApi = {
  async getCategories(businessId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (error) throw error;
    return (data || []) as Category[];
  },

  async createCategory(
    businessId: string,
    name: string,
    description?: string
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        business_id: businessId,
        name,
        description,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async updateCategory(
    id: string,
    name: string,
    description?: string
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  },

  async deleteCategory(id: string): Promise<void> {
    // Integrity check: block delete if active products exist in category
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)
      .is('deleted_at', null);

    if (countError) throw countError;
    if (count && count > 0) {
      throw new Error(
        'Cannot delete category. There are active products linked to it. Reassign or delete those products first.'
      );
    }

    const { error } = await supabase
      .from('categories')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },
};
