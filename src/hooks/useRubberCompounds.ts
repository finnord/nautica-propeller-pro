import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RubberCompound } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useRubberCompounds = () => {
  const [compounds, setCompounds] = useState<RubberCompound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCompounds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('rubber_compounds')
        .select('*')
        .order('compound_code', { ascending: true });

      if (error) throw error;
      setCompounds((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento mescole';
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

  const createCompound = async (compoundData: Partial<RubberCompound>) => {
    try {
      const { data, error } = await supabase
        .from('rubber_compounds')
        .insert([compoundData as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Mescola creata con successo",
      });

      await fetchCompounds();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione mescola';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateCompound = async (id: string, compoundData: Partial<RubberCompound>) => {
    try {
      const { error } = await supabase
        .from('rubber_compounds')
        .update(compoundData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Mescola aggiornata con successo",
      });

      await fetchCompounds();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento mescola';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteCompound = async (id: string) => {
    try {
      const { error } = await supabase
        .from('rubber_compounds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Mescola eliminata con successo",
      });

      await fetchCompounds();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione mescola';
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
    fetchCompounds();
  }, []);

  return {
    compounds,
    loading,
    error,
    fetchCompounds,
    createCompound,
    updateCompound,
    deleteCompound,
  };
};