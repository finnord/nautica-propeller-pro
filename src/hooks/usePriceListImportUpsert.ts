import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PriceListConflictResolution {
  action: 'skip' | 'update' | 'append';
  newListName?: string;
}

export interface PriceListUpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
  logs: PriceListOperationLog[];
}

export interface PriceListOperationLog {
  customer: string;
  listName: string;
  listVersion?: string;
  action: 'created' | 'updated' | 'skipped' | 'error';
  details: string;
  timestamp: string;
}

export type ImportMode = 'append' | 'update' | 'upsert';

export const usePriceListImportUpsert = () => {
  const [isImporting, setIsImporting] = useState(false);

  const upsertPriceListData = async (
    data: any[],
    conflictResolutions: Record<string, PriceListConflictResolution> = {},
    mode: ImportMode = 'upsert'
  ): Promise<PriceListUpsertResult> => {
    setIsImporting(true);
    
    const result: PriceListUpsertResult = {
      inserted: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      logs: []
    };

    try {
      // Fetch propellers (correct table for price_list_items.propeller_id)
      console.log('Fetching propellers...');
      const { data: existingPropellers } = await supabase
        .from('propellers')
        .select('id, model, description, base_cost');

      if (!existingPropellers) {
        throw new Error('Failed to fetch propellers');
      }

      // Build product map for faster lookup with case-insensitive keys
      const productMap = new Map<string, any>();
      existingPropellers.forEach(propeller => {
        if (propeller.model) {
          const normalizedModel = propeller.model.toLowerCase().trim();
          productMap.set(normalizedModel, propeller);
        }
      });

      // Fetch cross-references for OEM/CEF codes
      console.log('Fetching cross-references...');
      const { data: crossReferences } = await supabase
        .from('cross_references')
        .select('reference_code, propeller_id, propellers!inner(id, model)')
        .eq('reference_type', 'CEF');

      // Build cross-reference map
      const crossRefMap = new Map<string, string>();
      if (crossReferences) {
        crossReferences.forEach(ref => {
          if (ref.reference_code && ref.propeller_id) {
            const normalizedCode = ref.reference_code.toLowerCase().trim();
            crossRefMap.set(normalizedCode, ref.propeller_id);
          }
        });
      }

      // Enhanced product resolution function
      const resolveProduct = (cefCode: string) => {
        const normalizedCode = cefCode.toLowerCase().trim();
        
        // Try direct model match first
        let product = productMap.get(normalizedCode);
        if (product) {
          console.log(`Direct match found for ${cefCode}: ${product.model}`);
          return product;
        }

        // Try cross-reference lookup
        const propellerId = crossRefMap.get(normalizedCode);
        if (propellerId) {
          product = existingPropellers.find(p => p.id === propellerId);
          if (product) {
            console.log(`Cross-reference match found for ${cefCode}: ${product.model}`);
            return product;
          }
        }

        // Try normalization (remove non-alphanumeric)
        const alphanumericCode = normalizedCode.replace(/[^a-z0-9]/g, '');
        if (alphanumericCode !== normalizedCode) {
          product = productMap.get(alphanumericCode);
          if (product) {
            console.log(`Normalized match found for ${cefCode}: ${product.model}`);
            return product;
          }
        }

        console.log(`No match found for CEF code: ${cefCode}`);
        return null;
      };

      // Group data by customer, list_name, and list_version
      const groupedData = new Map<string, any[]>();
      
      data.forEach(row => {
        const listVersion = row.list_version?.trim() || 'v1';
        const groupKey = `${row.customer_name?.toLowerCase().trim()}_${row.list_name?.toLowerCase().trim()}_${listVersion.toLowerCase()}`;
        if (!groupedData.has(groupKey)) {
          groupedData.set(groupKey, []);
        }
        groupedData.get(groupKey)!.push(row);
      });

      console.log(`Processing ${groupedData.size} price list groups...`);

      // Process each group using the atomic RPC function
      for (const [groupKey, rows] of groupedData.entries()) {
        try {
          if (rows.length === 0) continue;

          const firstRow = rows[0];
          const customerName = firstRow.customer_name?.trim();
          const listName = firstRow.list_name?.trim();
          const listVersion = firstRow.list_version?.trim() || 'v1';

          if (!customerName || !listName) {
            result.errors.push(`Missing customer name or list name for group: ${groupKey}`);
            result.skipped += rows.length;
            continue;
          }

          console.log(`Processing group: ${customerName} - ${listName} v${listVersion} (${rows.length} items)`);

          // Prepare items for the RPC function
          const items = [];
          let groupSkipped = 0;
          
          for (const row of rows) {
            const cefCode = row.cef_code?.trim();
            if (!cefCode) {
              result.errors.push(`Missing CEF code for row in ${listName}`);
              groupSkipped++;
              continue;
            }

            // Resolve product using enhanced lookup
            const product = resolveProduct(cefCode);
            if (!product) {
              result.errors.push(`Product not found for CEF code: ${cefCode}`);
              groupSkipped++;
              continue;
            }

            const unitPrice = parseFloat(row.unit_price?.toString() || '0');
            const marginPercent = row.margin_percent ? parseFloat(row.margin_percent.toString()) : null;
            const marginEuro = row.margin_euro ? parseFloat(row.margin_euro.toString()) : null;

            if (unitPrice <= 0) {
              result.errors.push(`Invalid unit price for CEF code: ${cefCode}`);
              groupSkipped++;
              continue;
            }

            items.push({
              propeller_id: product.id,
              unit_price: unitPrice,
              margin_percent: marginPercent,
              margin_euro: marginEuro,
              pricing_method: row.pricing_method || 'margin_percent',
              min_quantity: parseInt(row.min_quantity?.toString() || '1'),
              notes: row.notes || null
            });
          }

          if (items.length === 0) {
            result.skipped += rows.length;
            continue;
          }

          // Call the atomic RPC function
          const { data: rpcResult, error: rpcError } = await supabase
            .rpc('import_price_list_group', {
              p_customer_name: customerName,
              p_list_name: listName,
              p_list_version: listVersion,
              p_currency: firstRow.currency || 'EUR',
              p_valid_from: firstRow.valid_from || new Date().toISOString().split('T')[0],
              p_valid_to: firstRow.valid_to || null,
              p_notes: firstRow.notes || null,
              p_items: JSON.stringify(items)
            });

          if (rpcError || !rpcResult) {
            console.error('RPC Error:', rpcError);
            result.errors.push(`Failed to import group ${listName}: ${rpcError?.message || 'Unknown error'}`);
            result.skipped += rows.length;
            continue;
          }

          // Update result counters - rpcResult is JSONB, parse it properly
          const resultData = rpcResult as any;
          result.inserted += resultData.inserted || 0;
          result.updated += resultData.updated || 0;
          result.skipped += groupSkipped;

          if (resultData.errors && Array.isArray(resultData.errors)) {
            result.errors.push(...resultData.errors);
          }

          // Add operation log
          result.logs.push({
            customer: customerName,
            listName,
            listVersion,
            action: 'created',
            details: `Processed ${items.length} items (${resultData.inserted || 0} inserted, ${resultData.updated || 0} updated)`,
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Error processing group:', error);
          result.errors.push(`Error processing group ${groupKey}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          result.skipped += rows.length;
        }
      }

    } catch (error) {
      console.error('Import error:', error);
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error("Import failed");
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
          acc[op.action] = (acc[op.action] || 0) + 1;
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
    upsertPriceListData,
    downloadImportLog
  };
};