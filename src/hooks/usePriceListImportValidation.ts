import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ValidationLevel = 'critical' | 'important' | 'suggested';

export interface ValidationMessage {
  level: ValidationLevel;
  field: string;
  message: string;
  rowNumber: number;
  code?: string;
}

export interface PriceListConflict {
  customer_name: string;
  list_name: string;
  list_version?: string;
  existing_data: any;
  incoming_data: PriceListImportRow[];
  conflicting_fields: string[];
}

export interface PriceListValidationResult {
  messages: ValidationMessage[];
  conflicts: PriceListConflict[];
  canProceed: boolean;
  summary: {
    newCustomers: number;
    newPriceLists: number;
    newItems: number;
    updatedItems: number;
    potentialConflicts: number;
  };
}

export interface PriceListImportRow {
  customer_name?: string;
  customer_code?: string;
  list_name?: string;
  list_version?: string;
  list_identifier?: string;
  cef_code?: string;
  unit_price?: number;
  margin_percent?: number;
  margin_euro?: number;
  pricing_method?: string;
  min_quantity?: number;
  notes?: string;
  currency?: string;
  valid_from?: string;
  valid_to?: string;
}

export function usePriceListImportValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validatePriceListImport = async (data: PriceListImportRow[]): Promise<PriceListValidationResult> => {
    setIsValidating(true);
    
    const messages: ValidationMessage[] = [];
    const conflicts: PriceListConflict[] = [];
    let newCustomers = 0;
    let newPriceLists = 0;
    let newItems = 0;
    let updatedItems = 0;
    let potentialConflicts = 0;

    try {
      // Fetch existing customers
      const { data: existingCustomers } = await supabase
        .from('customers')
        .select('id, name');

      const customerIds = new Map<string, string>();
      if (existingCustomers) {
        existingCustomers.forEach(customer => {
          customerIds.set(customer.name.toLowerCase().trim(), customer.id);
        });
      }

      // Group by customer, price list, and version for conflict detection
      const groups = new Map<string, PriceListImportRow[]>();
      
      data.forEach(row => {
        const listVersion = row.list_version?.trim() || 'v1';
        const groupKey = `${row.customer_name?.toLowerCase().trim()}_${row.list_name?.toLowerCase().trim()}_${listVersion.toLowerCase()}`;
        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(row);
      });

      // Check for existing price lists (including list_version)
      const { data: existingPriceLists } = await supabase
        .from('price_lists')
        .select('id, customer_id, list_name, list_version, customers!inner(name)')
        .in('customer_id', Array.from(customerIds.values()).filter(Boolean));

      const existingPriceListsMap = new Map<string, any>();
      if (existingPriceLists) {
        existingPriceLists.forEach(priceList => {
          const key = `${priceList.customers.name.toLowerCase().trim()}_${priceList.list_name.toLowerCase().trim()}_${(priceList.list_version || 'v1').toLowerCase()}`;
          existingPriceListsMap.set(key, priceList);
        });
      }

      // Validate each row
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel row number (starting from 2)

        // CRITICAL validations - these BLOCK import
        if (!row.cef_code?.trim()) {
          messages.push({
            level: 'critical',
            field: 'cef_code',
            message: 'Codice CEF è obbligatorio',
            rowNumber
          });
          continue;
        }

        if (!row.customer_name?.trim()) {
          messages.push({
            level: 'critical',
            field: 'customer_name',
            message: 'Nome cliente è obbligatorio',
            rowNumber
          });
          continue;
        }

        if (!row.list_name?.trim()) {
          messages.push({
            level: 'critical',
            field: 'list_name',
            message: 'Nome listino è obbligatorio',
            rowNumber
          });
          continue;
        }

        if (!row.unit_price || row.unit_price <= 0) {
          messages.push({
            level: 'critical',
            field: 'unit_price',
            message: 'Prezzo unitario deve essere maggiore di zero',
            rowNumber
          });
          continue;
        }

        // IMPORTANT validations - warnings but allow import
        if (!row.list_version?.trim()) {
          messages.push({
            level: 'important',
            field: 'list_version',
            message: 'Versione listino mancante - verrà usato "v1"',
            rowNumber
          });
        }

        if (!row.currency?.trim()) {
          messages.push({
            level: 'suggested',
            field: 'currency',
            message: 'Valuta non specificata - verrà usato EUR',
            rowNumber
          });
        }

        if (!row.margin_percent && !row.margin_euro) {
          messages.push({
            level: 'suggested',
            field: 'margin',
            message: 'Margine non specificato - considera di aggiungere margine percentuale o fisso',
            rowNumber
          });
        }
      }

      // Process groups for conflict detection
      for (const [groupKey, rows] of groups.entries()) {
        const firstRow = rows[0];
        const customerName = firstRow.customer_name?.toLowerCase().trim();
        const listName = firstRow.list_name?.toLowerCase().trim();
        
        if (!customerName || !listName) continue;

        // Check for new customers
        if (!customerIds.has(customerName)) {
          newCustomers++;
        }

        // Check for conflicts with existing price lists
        const listVersion = firstRow.list_version?.trim() || 'v1';
        const versionedGroupKey = `${customerName}_${listName}_${listVersion.toLowerCase()}`;
        const existingPriceList = existingPriceListsMap.get(versionedGroupKey);
        
        if (existingPriceList) {
          conflicts.push({
            customer_name: firstRow.customer_name || '',
            list_name: firstRow.list_name || '',
            list_version: listVersion,
            existing_data: existingPriceList,
            incoming_data: rows,
            conflicting_fields: ['list_name', 'list_version']
          });
          updatedItems += rows.length;
          potentialConflicts++;
        } else {
          newPriceLists++;
          newItems += rows.length;
        }
      }

      const criticalErrors = messages.filter(m => m.level === 'critical').length;
      
      return {
        messages,
        conflicts,
        canProceed: criticalErrors === 0,
        summary: {
          newCustomers,
          newPriceLists,
          newItems,
          updatedItems,
          potentialConflicts
        }
      };

    } catch (error) {
      console.error('Validation error:', error);
      return {
        messages: [{
          level: 'critical',
          field: 'system',
          message: 'Errore durante la validazione',
          rowNumber: 0
        }],
        conflicts: [],
        canProceed: false,
        summary: { newCustomers: 0, newPriceLists: 0, newItems: 0, updatedItems: 0, potentialConflicts: 0 }
      };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    isValidating,
    validatePriceListImport
  };
}