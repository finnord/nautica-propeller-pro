import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  model: string;
  description?: string;
  diameter?: number;
  pitch?: number;
  blades?: number;
  material_type?: string;
  base_cost?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: supabaseError } = await supabase
        .from('propellers')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      setProducts(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento prodotti';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: Partial<Product>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('propellers')
        .insert([{
          model: productData.model,
          description: productData.description,
          diameter: productData.diameter,
          pitch: productData.pitch,
          blades: productData.blades || 3,
          material_type: productData.material_type,
          base_cost: productData.base_cost || 0,
          status: productData.status || 'active'
        }])
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // Add to local state
      setProducts(prev => [data, ...prev]);
      
      toast({
        title: "Successo",
        description: "Prodotto creato con successo",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione del prodotto';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateProduct = async (id: string, productData: Partial<Product>) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('propellers')
        .update(productData)
        .eq('id', id)
        .select()
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      // Update local state
      setProducts(prev => prev.map(product => 
        product.id === id ? data : product
      ));

      toast({
        title: "Successo",
        description: "Prodotto aggiornato con successo",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento del prodotto';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('propellers')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      // Remove from local state
      setProducts(prev => prev.filter(product => product.id !== id));

      toast({
        title: "Successo",
        description: "Prodotto eliminato con successo",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione del prodotto';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getProduct = async (id: string) => {
    try {
      const { data, error: supabaseError } = await supabase
        .from('propellers')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (supabaseError) {
        throw supabaseError;
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento del prodotto';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    getProduct,
    refreshProducts: fetchProducts
  };
};