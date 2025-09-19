import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Impeller, ImpellerSearchCriteria, ImpellerSearchResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useImpellers = () => {
  const [impellers, setImpellers] = useState<Impeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchImpellers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('impellers')
        .select(`
          *,
          rubber_compound:rubber_compounds(
            id,
            compound_code,
            compound_name,
            base_polymer,
            density_g_cm3,
            material_cost_per_kg
          ),
          bushing:bushings(
            id,
            bushing_code,
            material,
            shaft_profile
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setImpellers((data as any) || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento giranti';
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

  const createImpeller = async (impellerData: Partial<Impeller>) => {
    try {
      const { data, error } = await supabase
        .from('impellers')
        .insert([impellerData as any])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Girante creata con successo",
      });

      await fetchImpellers(); // Refresh list
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione girante';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const updateImpeller = async (id: string, impellerData: Partial<Impeller>) => {
    try {
      const { error } = await supabase
        .from('impellers')
        .update(impellerData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Girante aggiornata con successo",
      });

      await fetchImpellers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento girante';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteImpeller = async (id: string) => {
    try {
      const { error } = await supabase
        .from('impellers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Girante eliminata con successo",
      });

      await fetchImpellers();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione girante';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  const getImpeller = async (id: string): Promise<Impeller | null> => {
    try {
      const { data, error } = await supabase
        .from('impellers')
        .select(`
          *,
          rubber_compound:rubber_compounds(*),
          bushing:bushings(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as any;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento girante';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  // Ricerca per similarità dimensionale (placeholder - da implementare con funzione DB)
  const searchSimilarImpellers = async (criteria: ImpellerSearchCriteria): Promise<ImpellerSearchResult[]> => {
    try {
      // Per ora usiamo una ricerca semplice basata sui filtri
      const { data, error } = await supabase
        .from('impellers')
        .select(`
          *,
          rubber_compound:rubber_compounds(*),
          bushing:bushings(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Simulazione calcolo match score
      const results: ImpellerSearchResult[] = (data as any[]).map(impeller => ({
        ...impeller,
        match_score: 75, // Placeholder score
        dimensional_differences: {
          od_diff_mm: 0,
          id_diff_mm: 0,
          height_diff_mm: 0,
          hub_diff_mm: 0,
          blade_count_diff: 0
        }
      }));
      
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella ricerca similarità';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return [];
    }
  };

  useEffect(() => {
    fetchImpellers();
  }, []);

  return {
    impellers,
    loading,
    error,
    fetchImpellers,
    createImpeller,
    updateImpeller,
    deleteImpeller,
    getImpeller,
    searchSimilarImpellers,
  };
};