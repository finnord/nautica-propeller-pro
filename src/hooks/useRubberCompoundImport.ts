import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RubberCompoundImportRow {
  mix_code?: string;
  mix_name?: string;
  base_polymer?: string;
  shore_hardness?: number;
  density_g_cm3?: number;
  material_price_per_kg?: number;
  color?: string;
  marine_approved?: string;
  temperature_range?: string;
  notes?: string;
}

export function useRubberCompoundImport() {
  const [isImporting, setIsImporting] = useState(false);

  const importRubberCompounds = async (data: RubberCompoundImportRow[]) => {
    setIsImporting(true);
    
    try {
      let imported = 0;
      let updated = 0;
      let errors = 0;

      // Get existing compounds
      const { data: existing } = await supabase
        .from('rubber_compounds')
        .select('compound_code');

      const existingCodes = new Set(existing?.map(c => c.compound_code) || []);

      for (const row of data) {
        if (!row.mix_code || !row.mix_name || !row.base_polymer) continue;

        try {
          const compoundData = {
            compound_code: row.mix_code,
            compound_name: row.mix_name,
            base_polymer: row.base_polymer,
            density_g_cm3: row.density_g_cm3 || 1.0,
            material_cost_per_kg: row.material_price_per_kg,
            notes: `${row.color ? `Colore: ${row.color}. ` : ''}${row.marine_approved ? `Marine: ${row.marine_approved}. ` : ''}${row.temperature_range ? `Temp: ${row.temperature_range}. ` : ''}${row.notes || ''}`
          };

          if (existingCodes.has(row.mix_code)) {
            const { error } = await supabase
              .from('rubber_compounds')
              .update(compoundData)
              .eq('compound_code', row.mix_code);
            
            if (!error) updated++;
            else errors++;
          } else {
            const { error } = await supabase
              .from('rubber_compounds')
              .insert(compoundData);
            
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
    importRubberCompounds
  };
}