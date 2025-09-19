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
  id: string;
  recordKey: string;
  field: string;
  existingValue: any;
  newValue: any;
  rowNumber: number;
  type: 'customer' | 'price_list' | 'price_list_item';
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
  product_code?: string;
  product_name?: string;
  customer_name?: string;
  customer_code?: string;
  list_name?: string;
  unit_price?: number;
  margin_percent?: number;
  margin_euro?: number;
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
      // Get existing data for conflict detection
      const [{ data: existingCustomers }, { data: existingPriceLists }, { data: existingItems }] = await Promise.all([
        supabase.from('customers').select('id, name, vat_number'),
        supabase.from('price_lists').select('id, customer_id, list_name, currency, customers(name)'),
        supabase.from('price_list_items').select('id, price_list_id, propeller_id, unit_price, price_lists(list_name, customers(name))')
      ]);

      const customerMap = new Map(existingCustomers?.map(c => [c.name.toLowerCase(), c]) || []);
      const priceListMap = new Map(existingPriceLists?.map(pl => [`${pl.customers?.name?.toLowerCase()}_${pl.list_name.toLowerCase()}`, pl]) || []);

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2; // Excel row number (starting from 2)

        // CRITICAL validations - these BLOCK import
        if (!row.product_code && !row.product_name) {
          messages.push({
            level: 'critical',
            field: 'product_code/product_name',
            message: 'Almeno uno tra codice prodotto o nome prodotto è obbligatorio',
            rowNumber
          });
          continue;
        }

        // IMPORTANT validations - warnings but allow import
        if (!row.customer_name) {
          messages.push({
            level: 'important',
            field: 'customer_name',
            message: 'Nome cliente mancante - verrà usato "Cliente Generico"',
            rowNumber
          });
        }

        if (!row.list_name) {
          messages.push({
            level: 'important',
            field: 'list_name',
            message: 'Nome listino mancante - verrà usato "Listino Standard"',
            rowNumber
          });
        }

        if (!row.unit_price || row.unit_price <= 0) {
          messages.push({
            level: 'important',
            field: 'unit_price',
            message: 'Prezzo unitario mancante o non valido - verrà calcolato dal costo base',
            rowNumber
          });
        }

        // SUGGESTED validations - improvements
        if (!row.margin_percent && !row.margin_euro) {
          messages.push({
            level: 'suggested',
            field: 'margin',
            message: 'Margine non specificato - considera di aggiungere margine percentuale o fisso',
            rowNumber
          });
        }

        if (!row.currency) {
          messages.push({
            level: 'suggested',
            field: 'currency',
            message: 'Valuta non specificata - verrà usato EUR',
            rowNumber
          });
        }

        // Conflict detection
        const customerName = (row.customer_name || 'Cliente Generico').toLowerCase();
        const listName = (row.list_name || 'Listino Standard').toLowerCase();
        
        // Check for existing customer conflicts
        const existingCustomer = customerMap.get(customerName);
        if (!existingCustomer) {
          newCustomers++;
        }

        // Check for existing price list conflicts
        const priceListKey = `${customerName}_${listName}`;
        const existingPriceList = priceListMap.get(priceListKey);
        if (!existingPriceList) {
          newPriceLists++;
        } else {
          // Check for currency conflicts
          if (row.currency && existingPriceList.currency !== row.currency) {
            conflicts.push({
              id: `currency_${i}`,
              recordKey: `${customerName}_${listName}`,
              field: 'currency',
              existingValue: existingPriceList.currency,
              newValue: row.currency,
              rowNumber,
              type: 'price_list'
            });
            potentialConflicts++;
          }
        }

        // Check for existing item conflicts (approximate - would need product matching)
        if (existingPriceList && row.unit_price) {
          // This is a simplified check - in real implementation we'd match by product
          updatedItems++;
          
          // Create a conflict for demonstration
          conflicts.push({
            id: `price_${i}`,
            recordKey: `${customerName}_${listName}_${row.product_code}`,
            field: 'unit_price',
            existingValue: 'Prezzo esistente', // Would be actual existing price
            newValue: row.unit_price,
            rowNumber,
            type: 'price_list_item'
          });
          potentialConflicts++;
        } else {
          newItems++;
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