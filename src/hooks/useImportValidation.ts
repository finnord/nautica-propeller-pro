import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Conflict } from '@/components/dialogs/ConflictResolutionDialog';

export type ValidationLevel = 'critical' | 'important' | 'suggested';

export interface ValidationMessage {
  level: ValidationLevel;
  field: string;
  message: string;
  rowNumber: number;
}

export interface UpsertValidationResult {
  sheet: string;
  rows: number;
  validMessages: ValidationMessage[];
  conflicts: Conflict[];
  canProceed: boolean;
  proposedChanges: {
    inserts: number;
    updates: number;
    skipped: number;
  };
}

export function useImportValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateImpellerUpsert = async (data: any[]): Promise<UpsertValidationResult> => {
    const validMessages: ValidationMessage[] = [];
    const conflicts: Conflict[] = [];
    let inserts = 0;
    let updates = 0;
    let skipped = 0;

    // Get existing impellers by name and internal_code for conflict detection
    const existingQuery = await supabase
      .from('impellers')
      .select('*');
    
    const existingImpellers = existingQuery.data || [];
    const existingByName = new Map(existingImpellers.map(imp => [imp.impeller_name, imp]));
    const existingByCode = new Map(existingImpellers.filter(imp => imp.internal_code).map(imp => [imp.internal_code!, imp]));

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      // Critical validations (block import)
      if (!row.impeller_name?.trim()) {
        validMessages.push({
          level: 'critical',
          field: 'impeller_name',
          message: 'Nome girante obbligatorio',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      if (!row.rubber_volume_cm3 || row.rubber_volume_cm3 <= 0) {
        validMessages.push({
          level: 'critical',
          field: 'rubber_volume_cm3',
          message: 'Volume gomma obbligatorio e > 0',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      // Check for existing record by name or internal_code
      const existingByNameMatch = existingByName.get(row.impeller_name);
      const existingByCodeMatch = row.internal_code ? existingByCode.get(row.internal_code) : null;
      const existing = existingByNameMatch || existingByCodeMatch;

      if (existing) {
        // Check for conflicts in fields
        const fieldsToCheck = [
          'outer_diameter_mm', 'inner_diameter_mm', 'height_mm', 'hub_diameter_mm',
          'blade_count', 'blade_thickness_base_mm', 'rubber_volume_cm3', 'base_cost',
          'gross_margin_pct', 'base_list_price', 'drawing_link_url', 'notes', 'status'
        ];

        let hasConflicts = false;
        for (const field of fieldsToCheck) {
          const existingValue = existing[field];
          const newValue = row[field];
          
          // Only create conflict if both values exist and are different
          if (existingValue !== null && newValue !== null && 
              existingValue !== undefined && newValue !== undefined &&
              existingValue !== newValue) {
            conflicts.push({
              id: `${existing.id}-${field}`,
              recordKey: row.impeller_name,
              field,
              existingValue,
              newValue,
              rowNumber: rowNum
            });
            hasConflicts = true;
          }
        }

        if (hasConflicts) {
          // Record will be updated with conflict resolution
          updates++;
        } else {
          // Record will be updated with new non-null values
          updates++;
          validMessages.push({
            level: 'suggested',
            field: 'general',
            message: 'Record esistente sarà aggiornato con nuovi valori',
            rowNumber: rowNum
          });
        }
      } else {
        // New record
        inserts++;
      }

      // Important validations (warnings)
      if (row.outer_diameter_mm && row.inner_diameter_mm && row.outer_diameter_mm <= row.inner_diameter_mm) {
        validMessages.push({
          level: 'important',
          field: 'diameters',
          message: 'Diametro esterno dovrebbe essere > diametro interno',
          rowNumber: rowNum
        });
      }

      // Suggested validations (best practices)
      if (!row.blade_count) {
        validMessages.push({
          level: 'suggested',
          field: 'blade_count',
          message: 'Numero alette non specificato',
          rowNumber: rowNum
        });
      }

      if (!row.base_cost) {
        validMessages.push({
          level: 'suggested',
          field: 'base_cost',
          message: 'Costo base non specificato',
          rowNumber: rowNum
        });
      }
    }

    // Check if we can proceed (only critical errors block import)
    const criticalErrors = validMessages.filter(m => m.level === 'critical');
    const canProceed = criticalErrors.length === 0;

    return {
      sheet: 'Impellers',
      rows: data.length,
      validMessages,
      conflicts,
      canProceed,
      proposedChanges: { inserts, updates, skipped }
    };
  };

  const validateRubberCompoundUpsert = async (data: any[]): Promise<UpsertValidationResult> => {
    const validMessages: ValidationMessage[] = [];
    const conflicts: Conflict[] = [];
    let inserts = 0;
    let updates = 0;
    let skipped = 0;

    const existingQuery = await supabase
      .from('rubber_compounds')
      .select('*');
    
    const existingCompounds = existingQuery.data || [];
    const existingByCode = new Map(existingCompounds.map(comp => [comp.compound_code, comp]));

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      // Critical validations
      if (!row.compound_code?.trim()) {
        validMessages.push({
          level: 'critical',
          field: 'compound_code',
          message: 'Codice mescola obbligatorio',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      if (!row.compound_name?.trim()) {
        validMessages.push({
          level: 'critical',
          field: 'compound_name',
          message: 'Nome mescola obbligatorio',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      if (!row.density_g_cm3 || row.density_g_cm3 <= 0) {
        validMessages.push({
          level: 'critical',
          field: 'density_g_cm3',
          message: 'Densità obbligatoria e > 0',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      const existing = existingByCode.get(row.compound_code);
      if (existing) {
        // Check for conflicts
        const fieldsToCheck = ['compound_name', 'base_polymer', 'density_g_cm3', 'material_cost_per_kg', 'supplier_name', 'notes'];
        let hasConflicts = false;
        
        for (const field of fieldsToCheck) {
          const existingValue = existing[field];
          const newValue = row[field];
          
          if (existingValue !== null && newValue !== null && 
              existingValue !== undefined && newValue !== undefined &&
              existingValue !== newValue) {
            conflicts.push({
              id: `${existing.id}-${field}`,
              recordKey: row.compound_code,
              field,
              existingValue,
              newValue,
              rowNumber: rowNum
            });
            hasConflicts = true;
          }
        }
        
        updates++;
      } else {
        inserts++;
      }
    }

    const criticalErrors = validMessages.filter(m => m.level === 'critical');
    const canProceed = criticalErrors.length === 0;

    return {
      sheet: 'Rubber Compounds',
      rows: data.length,
      validMessages,
      conflicts,
      canProceed,
      proposedChanges: { inserts, updates, skipped }
    };
  };

  const validateBushingUpsert = async (data: any[]): Promise<UpsertValidationResult> => {
    const validMessages: ValidationMessage[] = [];
    const conflicts: Conflict[] = [];
    let inserts = 0;
    let updates = 0;
    let skipped = 0;

    const existingQuery = await supabase
      .from('bushings')
      .select('*');
    
    const existingBushings = existingQuery.data || [];
    const existingByCode = new Map(existingBushings.map(bush => [bush.bushing_code, bush]));

    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      // Critical validations
      if (!row.bushing_code?.trim()) {
        validMessages.push({
          level: 'critical',
          field: 'bushing_code',
          message: 'Codice bussola obbligatorio',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      if (!row.material?.trim()) {
        validMessages.push({
          level: 'critical',
          field: 'material',
          message: 'Materiale obbligatorio',
          rowNumber: rowNum
        });
        skipped++;
        continue;
      }

      const existing = existingByCode.get(row.bushing_code);
      if (existing) {
        // Check for conflicts
        const fieldsToCheck = ['material', 'inner_diameter_mm', 'outer_diameter_mm', 'length_mm', 'shaft_profile', 'indicative_cost', 'notes'];
        let hasConflicts = false;
        
        for (const field of fieldsToCheck) {
          const existingValue = existing[field];
          const newValue = row[field];
          
          if (existingValue !== null && newValue !== null && 
              existingValue !== undefined && newValue !== undefined &&
              existingValue !== newValue) {
            conflicts.push({
              id: `${existing.id}-${field}`,
              recordKey: row.bushing_code,
              field,
              existingValue,
              newValue,
              rowNumber: rowNum
            });
            hasConflicts = true;
          }
        }
        
        updates++;
      } else {
        inserts++;
      }
    }

    const criticalErrors = validMessages.filter(m => m.level === 'critical');
    const canProceed = criticalErrors.length === 0;

    return {
      sheet: 'Bushings',
      rows: data.length,
      validMessages,
      conflicts,
      canProceed,
      proposedChanges: { inserts, updates, skipped }
    };
  };

  return {
    isValidating,
    setIsValidating,
    validateImpellerUpsert,
    validateRubberCompoundUpsert,
    validateBushingUpsert
  };
}