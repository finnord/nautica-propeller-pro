import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ImpellerImportRow {
  product_id?: string;
  product_type?: string;
  name?: string;
  internal_code?: string;
  uom?: string;
  base_cost?: number;
  gross_margin_pct?: number;
  base_list_price?: number;
  drawing_link_url?: string;
  notes?: string;
  outer_diameter_mm?: number;
  inner_diameter_mm?: number;
  thickness_mm?: number;
  blade_count?: number;
  shaft_diameter_mm?: number;
  shaft_profile?: string;
  rubber_volume_cm3?: number;
  drawing_notes?: string;
}

export interface ImpellerValidationResult {
  isValid: boolean;
  canProceed: boolean;
  errors: ValidationError[];
  conflicts: ValidationConflict[];
  summary: {
    total: number;
    valid: number;
    errors: number;
    conflicts: number;
  };
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  level: 'critical' | 'important' | 'suggested';
}

export interface ValidationConflict {
  id: string;
  row: number;
  product_id: string;
  existing: any;
  incoming: any;
  fields: string[];
}

export function useImpellerImportValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateImpellerImport = async (data: ImpellerImportRow[]): Promise<ImpellerValidationResult> => {
    setIsValidating(true);
    
    try {
      const errors: ValidationError[] = [];
      const conflicts: ValidationConflict[] = [];
      let validCount = 0;

      // Get existing impellers for conflict detection
      const { data: existingImpellers } = await supabase
        .from('impellers')
        .select('id, internal_code, impeller_name, base_cost, gross_margin_pct');

      const existingMap = new Map();
      existingImpellers?.forEach(imp => {
        if (imp.internal_code) existingMap.set(imp.internal_code, imp);
      });

      // Validate each row
      data.forEach((row, index) => {
        const rowNumber = index + 1;
        let hasErrors = false;

        // Critical validations
        if (!row.product_id && !row.internal_code) {
          errors.push({
            row: rowNumber,
            field: 'product_id/internal_code',
            message: 'Almeno uno tra product_id o internal_code è obbligatorio',
            level: 'critical'
          });
          hasErrors = true;
        }

        if (!row.name) {
          errors.push({
            row: rowNumber,
            field: 'name',
            message: 'Il nome del prodotto è obbligatorio',
            level: 'critical'
          });
          hasErrors = true;
        }

        // Important validations
        if (row.rubber_volume_cm3 !== undefined && row.rubber_volume_cm3 <= 0) {
          errors.push({
            row: rowNumber,
            field: 'rubber_volume_cm3',
            message: 'Il volume della gomma deve essere maggiore di 0',
            level: 'important'
          });
        }

        if (row.base_cost !== undefined && row.base_cost < 0) {
          errors.push({
            row: rowNumber,
            field: 'base_cost',
            message: 'Il costo base non può essere negativo',
            level: 'important'
          });
        }

        if (row.gross_margin_pct !== undefined && (row.gross_margin_pct < 0 || row.gross_margin_pct > 100)) {
          errors.push({
            row: rowNumber,
            field: 'gross_margin_pct',
            message: 'Il margine deve essere tra 0 e 100%',
            level: 'important'
          });
        }

        // Suggested validations
        if (!row.uom) {
          errors.push({
            row: rowNumber,
            field: 'uom',
            message: 'Unità di misura consigliata',
            level: 'suggested'
          });
        }

        // Check for conflicts with existing data
        const existingKey = row.product_id || row.internal_code;
        if (existingKey && existingMap.has(existingKey)) {
          const existing = existingMap.get(existingKey);
          const conflictFields: string[] = [];

          if (existing.impeller_name !== row.name) conflictFields.push('name');
          if (existing.base_cost !== row.base_cost) conflictFields.push('base_cost');
          if (existing.gross_margin_pct !== row.gross_margin_pct) conflictFields.push('gross_margin_pct');

          if (conflictFields.length > 0) {
            conflicts.push({
              id: `conflict_${rowNumber}`,
              row: rowNumber,
              product_id: existingKey,
              existing,
              incoming: row,
              fields: conflictFields
            });
          }
        }

        if (!hasErrors) validCount++;
      });

      const criticalErrors = errors.filter(e => e.level === 'critical').length;
      
      return {
        isValid: criticalErrors === 0,
        canProceed: criticalErrors === 0,
        errors,
        conflicts,
        summary: {
          total: data.length,
          valid: validCount,
          errors: errors.length,
          conflicts: conflicts.length
        }
      };

    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    validateImpellerImport
  };
}