import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conflict, ConflictResolution } from '@/components/dialogs/ConflictResolutionDialog';

export interface UpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function useImportUpsert() {
  const [isImporting, setIsImporting] = useState(false);

  const upsertImpellers = async (
    data: any[], 
    conflictResolutions: Record<string, ConflictResolution> = {}
  ): Promise<UpsertResult> => {
    const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
    
    // Get existing impellers for upsert logic
    const existingQuery = await supabase.from('impellers').select('*');
    const existingImpellers = existingQuery.data || [];
    const existingByName = new Map(existingImpellers.map(imp => [imp.impeller_name, imp]));
    const existingByCode = new Map(existingImpellers.filter(imp => imp.internal_code).map(imp => [imp.internal_code!, imp]));

    for (const row of data) {
      try {
        // Skip invalid rows
        if (!row.impeller_name?.trim() || !row.rubber_volume_cm3 || row.rubber_volume_cm3 <= 0) {
          result.skipped++;
          continue;
        }

        // Find existing record
        const existingByNameMatch = existingByName.get(row.impeller_name);
        const existingByCodeMatch = row.internal_code ? existingByCode.get(row.internal_code) : null;
        const existing = existingByNameMatch || existingByCodeMatch;

        // Prepare data
        const impellerData: any = {
          impeller_name: row.impeller_name,
          rubber_volume_cm3: row.rubber_volume_cm3,
          product_type: 'impeller'
        };

        // Add optional fields only if they have values
        const optionalFields = [
          'internal_code', 'outer_diameter_mm', 'inner_diameter_mm', 'height_mm',
          'hub_diameter_mm', 'blade_count', 'blade_thickness_base_mm', 'base_cost',
          'gross_margin_pct', 'base_list_price', 'drawing_link_url', 'notes', 'status'
        ];

        for (const field of optionalFields) {
          if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
            // Handle conflict resolution
            if (existing) {
              const conflictKey = `${existing.id}-${field}`;
              const resolution = conflictResolutions[conflictKey];
              
              if (resolution === 'skip_record') {
                result.skipped++;
                continue;
              } else if (resolution === 'keep_existing') {
                // Keep existing value, don't update
                continue;
              }
              // 'use_new' or no resolution means use new value
            }
            
            impellerData[field] = row[field];
          }
        }

        // Handle rubber compound linkage
        if (row.rubber_compound_code) {
          const { data: compound } = await supabase
            .from('rubber_compounds')
            .select('id')
            .eq('compound_code', row.rubber_compound_code)
            .maybeSingle();
          
          if (compound) {
            impellerData.rubber_compound_id = compound.id;
          }
        }

        // Handle bushing linkage
        if (row.bushing_code) {
          const { data: bushing } = await supabase
            .from('bushings')
            .select('id')
            .eq('bushing_code', row.bushing_code)
            .maybeSingle();
          
          if (bushing) {
            impellerData.bushing_id = bushing.id;
          }
        }

        if (existing) {
          // Update existing record
          const { error } = await supabase
            .from('impellers')
            .update(impellerData)
            .eq('id', existing.id);
          
          if (error) {
            result.errors.push(`Errore aggiornamento ${row.impeller_name}: ${error.message}`);
          } else {
            result.updated++;
          }
        } else {
          // Insert new record
          const { error } = await supabase
            .from('impellers')
            .insert(impellerData);
          
          if (error) {
            result.errors.push(`Errore inserimento ${row.impeller_name}: ${error.message}`);
          } else {
            result.inserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Errore processamento ${row.impeller_name}: ${error}`);
      }
    }

    return result;
  };

  const upsertRubberCompounds = async (
    data: any[], 
    conflictResolutions: Record<string, ConflictResolution> = {}
  ): Promise<UpsertResult> => {
    const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
    
    const existingQuery = await supabase.from('rubber_compounds').select('*');
    const existingCompounds = existingQuery.data || [];
    const existingByCode = new Map(existingCompounds.map(comp => [comp.compound_code, comp]));

    for (const row of data) {
      try {
        if (!row.compound_code?.trim() || !row.compound_name?.trim() || !row.density_g_cm3 || row.density_g_cm3 <= 0) {
          result.skipped++;
          continue;
        }

        const existing = existingByCode.get(row.compound_code);
        
        const compoundData: any = {
          compound_code: row.compound_code,
          compound_name: row.compound_name,
          density_g_cm3: row.density_g_cm3,
          base_polymer: row.base_polymer || 'Not specified'
        };

        // Handle optional fields with conflict resolution
        const optionalFields = ['material_cost_per_kg', 'supplier_name', 'cef_internal_code', 'notes'];
        for (const field of optionalFields) {
          if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
            if (existing) {
              const conflictKey = `${existing.id}-${field}`;
              const resolution = conflictResolutions[conflictKey];
              
              if (resolution === 'skip_record') {
                result.skipped++;
                continue;
              } else if (resolution === 'keep_existing') {
                continue;
              }
            }
            compoundData[field] = row[field];
          }
        }

        if (existing) {
          const { error } = await supabase
            .from('rubber_compounds')
            .update(compoundData)
            .eq('id', existing.id);
          
          if (error) {
            result.errors.push(`Errore aggiornamento ${row.compound_code}: ${error.message}`);
          } else {
            result.updated++;
          }
        } else {
          const { error } = await supabase
            .from('rubber_compounds')
            .insert(compoundData);
          
          if (error) {
            result.errors.push(`Errore inserimento ${row.compound_code}: ${error.message}`);
          } else {
            result.inserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Errore processamento ${row.compound_code}: ${error}`);
      }
    }

    return result;
  };

  const upsertBushings = async (
    data: any[], 
    conflictResolutions: Record<string, ConflictResolution> = {}
  ): Promise<UpsertResult> => {
    const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
    
    const existingQuery = await supabase.from('bushings').select('*');
    const existingBushings = existingQuery.data || [];
    const existingByCode = new Map(existingBushings.map(bush => [bush.bushing_code, bush]));

    for (const row of data) {
      try {
        if (!row.bushing_code?.trim() || !row.material?.trim()) {
          result.skipped++;
          continue;
        }

        const existing = existingByCode.get(row.bushing_code);
        
        const bushingData: any = {
          bushing_code: row.bushing_code,
          material: row.material
        };

        // Handle optional fields with conflict resolution
        const optionalFields = ['inner_diameter_mm', 'outer_diameter_mm', 'length_mm', 'shaft_profile', 'indicative_cost', 'drawing_link_url', 'notes'];
        for (const field of optionalFields) {
          if (row[field] !== null && row[field] !== undefined && row[field] !== '') {
            if (existing) {
              const conflictKey = `${existing.id}-${field}`;
              const resolution = conflictResolutions[conflictKey];
              
              if (resolution === 'skip_record') {
                result.skipped++;
                continue;
              } else if (resolution === 'keep_existing') {
                continue;
              }
            }
            bushingData[field] = row[field];
          }
        }

        if (existing) {
          const { error } = await supabase
            .from('bushings')
            .update(bushingData)
            .eq('id', existing.id);
          
          if (error) {
            result.errors.push(`Errore aggiornamento ${row.bushing_code}: ${error.message}`);
          } else {
            result.updated++;
          }
        } else {
          const { error } = await supabase
            .from('bushings')
            .insert(bushingData);
          
          if (error) {
            result.errors.push(`Errore inserimento ${row.bushing_code}: ${error.message}`);
          } else {
            result.inserted++;
          }
        }
      } catch (error) {
        result.errors.push(`Errore processamento ${row.bushing_code}: ${error}`);
      }
    }

    return result;
  };

  return {
    isImporting,
    setIsImporting,
    upsertImpellers,
    upsertRubberCompounds,
    upsertBushings
  };
}
