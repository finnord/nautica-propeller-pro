import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PriceListImportRow, PriceListConflict } from './usePriceListImportValidation';

export type PriceListConflictResolution = 'keep_existing' | 'use_new' | 'skip_record';

export interface PriceListUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  log: PriceListOperationLog[];
}

export interface PriceListOperationLog {
  timestamp: string;
  operation: 'create_customer' | 'create_price_list' | 'create_item' | 'update_item' | 'skip';
  recordKey: string;
  oldValue?: any;
  newValue?: any;
  rowNumber: number;
}

export type ImportMode = 'append' | 'update' | 'upsert';

export function usePriceListImportUpsert() {
  const [isImporting, setIsImporting] = useState(false);

  const upsertPriceListData = async (
    data: PriceListImportRow[],
    conflictResolutions: Record<string, PriceListConflictResolution> = {},
    mode: ImportMode = 'upsert'
  ): Promise<PriceListUpsertResult> => {
    setIsImporting(true);
    
    const result: PriceListUpsertResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      log: []
    };

    try {
      // Get existing data
      const [{ data: existingCustomers }, { data: existingPriceLists }, { data: existingProducts }] = await Promise.all([
        supabase.from('customers').select('id, name, vat_number'),
        supabase.from('price_lists').select('id, customer_id, list_name, currency, customers(name)'),
        supabase.from('impellers').select('id, impeller_name, internal_code')
      ]);

      const customerMap = new Map(existingCustomers?.map(c => [c.name.toLowerCase(), c]) || []);
      const priceListMap = new Map(existingPriceLists?.map(pl => [`${pl.customers?.name?.toLowerCase()}_${pl.list_name.toLowerCase()}`, pl]) || []);
      const productMap = new Map();
      existingProducts?.forEach(p => {
        productMap.set(p.impeller_name?.toLowerCase(), p);
        if (p.internal_code) productMap.set(p.internal_code.toLowerCase(), p);
      });

      // Group rows by customer/price list for atomic operations
      const groups = new Map<string, { customerId?: string; priceListId?: string; rows: Array<{ row: PriceListImportRow; rowNumber: number }> }>();
      
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const rowNumber = i + 2;
        const customerName = row.customer_name || 'Cliente Generico';
        const listName = row.list_name || 'Listino Standard';
        const groupKey = `${customerName.toLowerCase()}_${listName.toLowerCase()}`;
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { rows: [] });
        }
        groups.get(groupKey)!.rows.push({ row, rowNumber });
      }

      // Process each group atomically
      for (const [groupKey, group] of groups.entries()) {
        try {
          // Setup group variables from first row if not already done
          if (!group.customerId || !group.priceListId) {
            const firstRow = group.rows[0];
            const customerName = firstRow.row.customer_name || 'Cliente Generico';
            const listName = firstRow.row.list_name || 'Listino Standard';
            const currency = firstRow.row.currency || 'EUR';
            
            // Find or create customer
            let customerId = customerMap.get(customerName.toLowerCase())?.id;
            if (!customerId) {
              if (mode === 'update') {
                // Skip entire group
                result.skipped += group.rows.length;
                continue;
              }

              const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                  name: customerName,
                  vat_number: firstRow.row.customer_code || null
                })
                .select('id')
                .single();

              if (customerError) {
                result.errors.push(`Gruppo ${groupKey}: Errore creazione cliente - ${customerError.message}`);
                result.skipped += group.rows.length;
                continue;
              }

              customerId = newCustomer.id;
              customerMap.set(customerName.toLowerCase(), { id: customerId, name: customerName, vat_number: firstRow.row.customer_code });
            }

            // Find or create price list
            const priceListKey = `${customerName.toLowerCase()}_${listName.toLowerCase()}`;
            let priceListId = priceListMap.get(priceListKey)?.id;
            
            if (!priceListId) {
              if (mode === 'update') {
                result.skipped += group.rows.length;
                continue;
              }

              const { data: newPriceList, error: priceListError } = await supabase
                .from('price_lists')
                .insert({
                  customer_id: customerId,
                  list_name: listName,
                  currency,
                  valid_from: firstRow.row.valid_from || new Date().toISOString().split('T')[0],
                  valid_to: firstRow.row.valid_to || null
                })
                .select('id')
                .single();

              if (priceListError) {
                result.errors.push(`Gruppo ${groupKey}: Errore creazione listino - ${priceListError.message}`);
                result.skipped += group.rows.length;
                continue;
              }

              priceListId = newPriceList.id;
              priceListMap.set(priceListKey, { id: priceListId, customer_id: customerId, list_name: listName, currency, customers: { name: customerName } });
            }
            
            group.customerId = customerId;
            group.priceListId = priceListId;
          }
          
          // Process each row in the group
          for (const { row, rowNumber } of group.rows) {
            // Skip if critical data missing
            if (!row.product_code && !row.product_name) {
              result.skipped++;
              result.log.push({
                timestamp: new Date().toISOString(),
                operation: 'skip',
                recordKey: `row_${rowNumber}`,
                rowNumber
              });
              continue;
            }

          // Find product - normalize and try multiple lookups
          const productCode = (row.product_code || row.product_name || '').trim().toLowerCase();
          let product = productMap.get(productCode);
          
          // Try additional normalization if not found
          if (!product && productCode) {
            // Remove special characters and try again
            const normalizedCode = productCode.replace(/[^a-z0-9]/g, '');
            for (const [key, value] of productMap.entries()) {
              if (key.replace(/[^a-z0-9]/g, '') === normalizedCode) {
                product = value;
                break;
              }
            }
          }
          
          if (!product) {
            result.errors.push(`Riga ${rowNumber}: Prodotto non trovato - ${row.product_code || row.product_name} (cercato: ${productCode})`);
            continue;
          }

          // Calculate price if missing
          let unitPrice = row.unit_price;
          if (!unitPrice || unitPrice <= 0) {
            // Get base cost from product and apply default margin
            const baseMargin = row.margin_percent || 30; // Default 30% margin
            unitPrice = (product.base_cost || 0) * (1 + baseMargin / 100);
          }

          // Check for existing price list item
          const { data: existingItem } = await supabase
            .from('price_list_items')
            .select('id, unit_price')
            .eq('price_list_id', group.priceListId!)
            .eq('propeller_id', product.id)
            .maybeSingle();

          if (existingItem) {
            // Handle conflict resolution
            const conflictKey = `price_${rowNumber}`;
            const resolution = conflictResolutions[conflictKey] || 'use_new';
            
            if (resolution === 'skip_record') {
              result.skipped++;
              continue;
            }
            
            if (resolution === 'keep_existing') {
              result.skipped++;
              result.log.push({
                timestamp: new Date().toISOString(),
                operation: 'skip',
                recordKey: `${groupKey}_${product.id}`,
                oldValue: existingItem.unit_price,
                rowNumber
              });
              continue;
            }

            if (mode === 'append') {
              result.skipped++;
              continue;
            }

            // Update existing item
            const { error: updateError } = await supabase
              .from('price_list_items')
              .update({
                unit_price: unitPrice,
                margin_percent: row.margin_percent,
                margin_euro: row.margin_euro,
                min_quantity: row.min_quantity || 1,
                notes: row.notes
              })
              .eq('id', existingItem.id);

            if (updateError) {
              result.errors.push(`Riga ${rowNumber}: Errore aggiornamento prezzo - ${updateError.message}`);
              continue;
            }

            result.updated++;
            result.log.push({
              timestamp: new Date().toISOString(),
              operation: 'update_item',
              recordKey: `${groupKey}_${product.id}`,
              oldValue: existingItem.unit_price,
              newValue: unitPrice,
              rowNumber
            });

          } else {
            // Create new item
            const { error: insertError } = await supabase
              .from('price_list_items')
              .insert({
                price_list_id: group.priceListId!,
                propeller_id: product.id,
                unit_price: unitPrice,
                margin_percent: row.margin_percent,
                margin_euro: row.margin_euro,
                min_quantity: row.min_quantity || 1,
                notes: row.notes,
                pricing_method: row.margin_percent ? 'margin_percent' : (row.margin_euro ? 'margin_euro' : 'fixed_price')
              });

            if (insertError) {
              result.errors.push(`Riga ${rowNumber}: Errore inserimento prezzo - ${insertError.message}`);
              continue;
            }

            result.inserted++;
            result.log.push({
              timestamp: new Date().toISOString(),
              operation: 'create_item',
              recordKey: `${groupKey}_${product.id}`,
              newValue: unitPrice,
              rowNumber
            });
           }
          }
           
        } catch (error) {
          result.errors.push(`Gruppo ${groupKey}: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
          result.skipped += group.rows.length;
        }
      }

    } catch (error) {
      result.errors.push(`Errore generale: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
    } finally {
      setIsImporting(false);
    }

    return result;
  };

  const downloadImportLog = (log: PriceListOperationLog[]) => {
    const logData = {
      timestamp: new Date().toISOString(),
      operations: log,
      summary: {
        total_operations: log.length,
        by_type: log.reduce((acc, op) => {
          acc[op.operation] = (acc[op.operation] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import_log_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    isImporting,
    setIsImporting,
    upsertPriceListData,
    downloadImportLog
  };
}