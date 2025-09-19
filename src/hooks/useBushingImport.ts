import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BushingImportRow {
  bushing_code?: string;
  bushing_name?: string;
  material?: string;
  outer_diameter_mm?: number;
  inner_diameter_mm?: number;
  length_mm?: number;
  shaft_profile_type?: string;
  cost_each?: number;
  supplier?: string;
  lead_time_days?: number;
  notes?: string;
}

export function useBushingImport() {
  const [isImporting, setIsImporting] = useState(false);

  const importBushings = async (data: BushingImportRow[]) => {
    setIsImporting(true);
    
    try {
      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Get existing bushings
      const { data: existing } = await supabase
        .from('bushings')
        .select('bushing_code');

      const existingCodes = new Set(existing?.map(b => b.bushing_code) || []);

      for (const row of data) {
        if (!row.bushing_code || !row.material) continue;

        try {
          const bushingData = {
            bushing_code: row.bushing_code,
            material: row.material,
            outer_diameter_mm: row.outer_diameter_mm,
            inner_diameter_mm: row.inner_diameter_mm,
            length_mm: row.length_mm,
            shaft_profile: row.shaft_profile_type,
            indicative_cost: row.cost_each,
            notes: `${row.bushing_name ? `Nome: ${row.bushing_name}. ` : ''}${row.supplier ? `Fornitore: ${row.supplier}. ` : ''}${row.lead_time_days ? `Lead time: ${row.lead_time_days} giorni. ` : ''}${row.notes || ''}`
          };

          if (existingCodes.has(row.bushing_code)) {
            const { error } = await supabase
              .from('bushings')
              .update(bushingData)
              .eq('bushing_code', row.bushing_code);
            
            if (!error) updated++;
            else errors++;
          } else {
            const { error } = await supabase
              .from('bushings')
              .insert(bushingData);
            
            if (!error) imported++;
            else errors++;
          }
        } catch {
          errors++;
        }
      }

      return { imported, updated, errors };

    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    importBushings
  };
}