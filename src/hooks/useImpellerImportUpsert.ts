import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ImpellerImportRow } from './useImpellerImportValidation';

export interface ImpellerUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: UpsertError[];
  log: UpsertLogEntry[];
}

export interface UpsertError {
  row: number;
  product_id: string;
  message: string;
}

export interface UpsertLogEntry {
  row: number;
  product_id: string;
  action: 'insert' | 'update' | 'skip';
  reason?: string;
}

export function useImpellerImportUpsert() {
  const [isImporting, setIsImporting] = useState(false);

  const upsertImpellerData = async (
    data: ImpellerImportRow[],
    mode: 'upsert' | 'append' | 'update' = 'upsert'
  ): Promise<ImpellerUpsertResult> => {
    setIsImporting(true);
    
    try {
      const result: ImpellerUpsertResult = {
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [],
        log: []
      };

      // Get existing impellers
      const { data: existingImpellers } = await supabase
        .from('impellers')
        .select('id, internal_code, impeller_name');

      const existingMap = new Map();
      existingImpellers?.forEach(imp => {
        if (imp.internal_code) existingMap.set(imp.internal_code, imp);
      });

      for (const [index, row] of data.entries()) {
        const rowNumber = index + 1;
        const productId = row.product_id || row.internal_code;
        
        if (!productId) {
          result.errors.push({
            row: rowNumber,
            product_id: 'N/A',
            message: 'Manca product_id o internal_code'
          });
          continue;
        }

        try {
          const existingImpeller = existingMap.get(productId);
          const impellerData = {
            internal_code: row.product_id || row.internal_code,
            impeller_name: row.name || 'Unnamed Product',
            product_type: row.product_type || 'impeller',
            uom: row.uom || 'pcs',
            base_cost: row.base_cost || 0,
            gross_margin_pct: row.gross_margin_pct,
            base_list_price: row.base_list_price,
            drawing_link_url: row.drawing_link_url,
            notes: row.notes,
            outer_diameter_mm: row.outer_diameter_mm,
            inner_diameter_mm: row.inner_diameter_mm,
            height_mm: row.thickness_mm,
            hub_diameter_mm: row.shaft_diameter_mm,
            blade_count: row.blade_count,
            rubber_volume_cm3: row.rubber_volume_cm3 || 0
          };

          if (existingImpeller) {
            if (mode === 'append') {
              result.skipped++;
              result.log.push({
                row: rowNumber,
                product_id: productId,
                action: 'skip',
                reason: 'Esiste già (modalità APPEND)'
              });
              continue;
            }

            // Update existing
            const { error } = await supabase
              .from('impellers')
              .update(impellerData)
              .eq('id', existingImpeller.id);

            if (error) throw error;

            result.updated++;
            result.log.push({
              row: rowNumber,
              product_id: productId,
              action: 'update'
            });

          } else {
            if (mode === 'update') {
              result.skipped++;
              result.log.push({
                row: rowNumber,
                product_id: productId,
                action: 'skip',
                reason: 'Non esiste (modalità UPDATE)'
              });
              continue;
            }

            // Insert new
            const { error } = await supabase
              .from('impellers')
              .insert(impellerData);

            if (error) throw error;

            result.inserted++;
            result.log.push({
              row: rowNumber,
              product_id: productId,
              action: 'insert'
            });
          }

        } catch (error) {
          result.errors.push({
            row: rowNumber,
            product_id: productId,
            message: error instanceof Error ? error.message : 'Errore sconosciuto'
          });
        }
      }

      return result;

    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImporting,
    upsertImpellerData
  };
}