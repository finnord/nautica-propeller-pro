import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Bushing } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useBushings = () => {
  const [bushings, setBushings] = useState<Bushing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchBushings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bushings')
        .select('*')
        .order('bushing_code', { ascending: true });

      if (error) throw error;
      setBushings((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento bussole';
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

  const createBushing = async (bushingData: Partial<Bushing>) => {
    try {
      const { data, error } = await supabase
        .from('bushings')
        .insert([bushingData as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Bussola creata con successo",
      });

      await fetchBushings();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione bussola';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateBushing = async (id: string, bushingData: Partial<Bushing>) => {
    try {
      const { error } = await supabase
        .from('bushings')
        .update(bushingData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Bussola aggiornata con successo",
      });

      await fetchBushings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento bussola';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteBushing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bushings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Bussola eliminata con successo",
      });

      await fetchBushings();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione bussola';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  useEffect(() => {
    fetchBushings();
  }, []);

  return {
    bushings,
    loading,
    error,
    fetchBushings,
    createBushing,
    updateBushing,
    deleteBushing,
  };
};