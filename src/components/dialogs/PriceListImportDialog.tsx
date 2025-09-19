import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { downloadPriceListTemplate } from '@/lib/excel-utils';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportRow {
  product_code: string;
  customer_name: string;
  list_name: string;
  list_version: string;
  list_identifier: string;
  unit_price: number;
  rowIndex: number;
  errors: string[];
  productFound?: boolean;
  productId?: string;
  baseCost?: number;
  marginPercent?: number;
  marginEuro?: number;
}

interface PriceListImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PriceListImportDialog = ({ open, onOpenChange, onSuccess }: PriceListImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<ImportRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

      const toTrimmedString = (value: unknown) => {
        if (typeof value === 'string' || typeof value === 'number') {
          return String(value).trim();
        }
        return '';
      };

      const toNumber = (value: unknown) => {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          return Number.isFinite(parsed) ? parsed : 0;
        }
        return 0;
      };

      const processedData: ImportRow[] = jsonData.map((row, index) => {
        const importRow: ImportRow = {
          product_code: toTrimmedString(row['product_code']),
          customer_name: toTrimmedString(row['customer_name']),
          list_name: toTrimmedString(row['list_name']),
          list_version: toTrimmedString(row['list_version']),
          list_identifier: toTrimmedString(row['list_identifier']),
          unit_price: toNumber(row['unit_price']),
          rowIndex: index + 2,
          errors: []
        };

        if (!importRow.product_code) {
          importRow.errors.push('Codice prodotto mancante');
        }
        if (!importRow.customer_name) {
          importRow.errors.push('Nome cliente mancante');
        }
        if (!importRow.list_name) {
          importRow.errors.push('Nome listino mancante');
        }
        if (!importRow.unit_price || importRow.unit_price <= 0) {
          importRow.errors.push('Prezzo unitario non valido');
        }

        return importRow;
      });

      const productCodes = Array.from(new Set(processedData.map(row => row.product_code).filter(Boolean)));
      const productLookup = new Map<string, { id: string; base_cost: number | null }>();

      if (productCodes.length > 0) {
        const { data: productsData, error: productsError } = await supabase
          .from('propellers')
          .select('id, model, base_cost')
          .in('model', productCodes);

        if (productsError) throw productsError;

        (productsData ?? []).forEach(product => {
          productLookup.set(product.model, {
            id: product.id,
            base_cost: product.base_cost,
          });
        });
      }

      const enrichedData = processedData.map(importRow => {
        if (importRow.product_code) {
          const product = productLookup.get(importRow.product_code);
          if (product) {
            importRow.productFound = true;
            importRow.productId = product.id;
            importRow.baseCost = product.base_cost ?? 0;

            if (importRow.unit_price > 0 && product.base_cost !== null) {
              importRow.marginEuro = importRow.unit_price - product.base_cost;
              importRow.marginPercent = ((importRow.unit_price - product.base_cost) / importRow.unit_price) * 100;
            }
          } else {
            importRow.productFound = false;
            importRow.errors.push('Prodotto non trovato nel database');
          }
        }

        return importRow;
      });

      setImportData(enrichedData);
      setStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Errore',
        description: "Errore durante la lettura del file Excel",
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const executeImport = async () => {
    const validRows = importData.filter(row => row.errors.length === 0 && row.productFound && row.productId);
    if (validRows.length === 0) {
      toast({
        title: 'Errore',
        description: 'Nessuna riga valida da importare',
        variant: 'destructive'
      });
      return;
    }

    setImporting(true);
    setStep('importing');
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    try {
      const groupedData = validRows.reduce((acc, row) => {
        const key = `${row.customer_name}_${row.list_name}_${row.list_identifier}`;
        if (!acc[key]) {
          acc[key] = {
            customer_name: row.customer_name,
            list_name: row.list_name,
            list_version: row.list_version,
            list_identifier: row.list_identifier,
            items: [] as ImportRow[]
          };
        }
        acc[key].items.push(row);
        return acc;
      }, {} as Record<string, { customer_name: string; list_name: string; list_version: string; list_identifier: string; items: ImportRow[] }>);

      const groups = Object.values(groupedData);

      const customerNames = Array.from(new Set(groups.map(group => group.customer_name)));
      const customerMap = new Map<string, string>();

      if (customerNames.length > 0) {
        const { data: existingCustomers, error: existingCustomersError } = await supabase
          .from('customers')
          .select('id, name')
          .in('name', customerNames);

        if (existingCustomersError) throw existingCustomersError;

        (existingCustomers ?? []).forEach(customer => {
          customerMap.set(customer.name, customer.id);
        });
      }

      const missingCustomers = customerNames.filter(name => !customerMap.has(name));
      if (missingCustomers.length > 0) {
        const { data: newCustomers, error: insertCustomersError } = await supabase
          .from('customers')
          .insert(missingCustomers.map(name => ({ name })))
          .select('id, name');

        if (insertCustomersError) throw insertCustomersError;

        (newCustomers ?? []).forEach(customer => {
          customerMap.set(customer.name, customer.id);
        });
      }

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        setProgress(Math.round((i / groups.length) * 100));

        const customerId = customerMap.get(group.customer_name);
        if (!customerId) {
          errorCount += group.items.length;
          continue;
        }

        try {
          const listName = group.list_version
            ? `${group.list_name} ${group.list_version}`.trim()
            : group.list_name;

          const { data: priceList, error: priceListError } = await supabase
            .from('price_lists')
            .insert([{
              list_name: listName,
              customer_id: customerId,
              currency: 'EUR',
              valid_from: new Date().toISOString().split('T')[0],
              notes: group.list_identifier
                ? `Importato da Excel - ${group.list_identifier}`
                : 'Importato da Excel'
            }])
            .select('id')
            .single();

          if (priceListError || !priceList) {
            errorCount += group.items.length;
            continue;
          }

          const itemsPayload = group.items
            .filter(item => item.productId)
            .map(item => ({
              price_list_id: priceList.id,
              propeller_id: item.productId!,
              unit_price: item.unit_price,
              margin_percent: item.marginPercent ?? null,
              margin_euro: item.marginEuro ?? null,
              pricing_method: item.marginPercent !== undefined ? 'margin_percent' : 'target_price'
            }));

          if (itemsPayload.length === 0) {
            continue;
          }

          const { error: insertItemsError } = await supabase
            .from('price_list_items')
            .insert(itemsPayload);

          if (insertItemsError) {
            console.error('Error inserting items:', insertItemsError);
            errorCount += itemsPayload.length;
          } else {
            successCount += itemsPayload.length;
          }
        } catch (groupError) {
          console.error('Error importing group:', groupError);
          errorCount += group.items.length;
        }
      }

      setProgress(100);
      setImportResults({ success: successCount, errors: errorCount });
      setStep('complete');

      if (successCount > 0) {
        toast({
          title: 'Import completato',
          description: `${successCount} prodotti importati con successo${errorCount > 0 ? `, ${errorCount} errori` : ''}`
        });
        onSuccess();
      }
   } catch (error) {
     console.error('Error during import:', error);
      setStep('preview');
     toast({
       title: 'Errore',
       description: "Errore durante l'importazione",
       variant: 'destructive'
     });
    } finally {
      setImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setImportData([]);
    setStep('upload');
    setProgress(0);
    setImportResults({ success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!importing) {
      resetDialog();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importa listino prezzi da Excel</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <div className="space-y-2">
                <p>Seleziona un file Excel con i dati del listino</p>
                <p className="text-sm text-muted-foreground">
                  Il file deve contenere le colonne: product_code, customer_name, list_name, list_version, list_identifier, unit_price
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="max-w-xs mx-auto"
                />
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={downloadPriceListTemplate}
                    variant="outline"
                    size="sm"
                  >
                    Scarica template
                  </Button>
                  <Button
                    onClick={processFile}
                    disabled={!file || processing}
                  >
                    {processing ? 'Elaborazione...' : 'Elabora file'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium">Anteprima importazione</h3>
                <p className="text-sm text-muted-foreground">
                  {importData.filter(row => row.errors.length === 0).length} righe valide, {importData.filter(row => row.errors.length > 0).length} errori
                </p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Indietro
                </Button>
                <Button
                  onClick={executeImport}
                  disabled={importData.filter(row => row.errors.length === 0).length === 0}
                >
                  Importa {importData.filter(row => row.errors.length === 0).length} prodotti
                </Button>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Riga</TableHead>
                    <TableHead>Codice</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Listino</TableHead>
                    <TableHead>Prezzo</TableHead>
                    <TableHead>Margine</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importData.slice(0, 50).map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.rowIndex}</TableCell>
                      <TableCell className="font-mono">{row.product_code}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.list_name}</TableCell>
                      <TableCell>€{row.unit_price.toFixed(2)}</TableCell>
                      <TableCell>
                        {row.marginPercent !== undefined ? (
                          <div className="text-sm">
                            <div>{row.marginPercent.toFixed(1)}%</div>
                            <div className="text-muted-foreground">€{row.marginEuro?.toFixed(2)}</div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {row.errors.length === 0 ? (
                          <Badge variant="secondary">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Valido
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {row.errors.length} errori
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {importData.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Mostrate prime 50 righe di {importData.length}
              </p>
            )}

            {importData.some(row => row.errors.length > 0) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Correggi gli errori evidenziati nel file e ricarica il documento per includere tutte le righe.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center">
            <Upload className="mx-auto h-12 w-12 text-primary animate-pulse" />
            <div>
              <h3 className="text-lg font-medium">Importazione in corso...</h3>
              <p className="text-muted-foreground">Non chiudere questa finestra</p>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <div>
              <h3 className="text-lg font-medium">Importazione completata</h3>
              <p className="text-muted-foreground">
                {importResults.success} prodotti importati con successo
                {importResults.errors > 0 && `, ${importResults.errors} errori`}
              </p>
            </div>
            <Button onClick={handleClose}>
              Chiudi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
