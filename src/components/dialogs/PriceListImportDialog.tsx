import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, AlertTriangle, CheckCircle, X } from 'lucide-react';
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

  const downloadTemplate = () => {
    const templateData = [
      {
        product_code: 'SP-3142',
        customer_name: 'Marina SpA',
        list_name: 'Listino 2024',
        list_version: 'v1.0',
        list_identifier: '2024-001',
        unit_price: 85.50
      },
      {
        product_code: 'SP-2847',
        customer_name: 'Marina SpA', 
        list_name: 'Listino 2024',
        list_version: 'v1.0',
        list_identifier: '2024-001',
        unit_price: 72.30
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // product_code
      { wch: 20 }, // customer_name
      { wch: 20 }, // list_name
      { wch: 12 }, // list_version
      { wch: 15 }, // list_identifier
      { wch: 12 }  // unit_price
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'PriceListTemplate');
    
    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `Template_Listini_${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      const processedData: ImportRow[] = [];

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        const importRow: ImportRow = {
          product_code: row.product_code?.toString()?.trim() || '',
          customer_name: row.customer_name?.toString()?.trim() || '',
          list_name: row.list_name?.toString()?.trim() || '',
          list_version: row.list_version?.toString()?.trim() || '',
          list_identifier: row.list_identifier?.toString()?.trim() || '',
          unit_price: parseFloat(row.unit_price) || 0,
          rowIndex: i + 2, // +2 because Excel starts at 1 and we have headers
          errors: []
        };

        // Validation
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

        // Check if product exists and get base cost
        if (importRow.product_code) {
          const { data: productData } = await supabase
            .from('propellers')
            .select('id, model, base_cost')
            .eq('model', importRow.product_code)
            .maybeSingle();

          if (productData?.id) {
            importRow.productFound = true;
            importRow.baseCost = productData.base_cost || 0;
            
            // Calculate margins only if base_cost exists and unit_price is valid
            if (importRow.unit_price > 0 && productData.base_cost !== null) {
              importRow.marginEuro = importRow.unit_price - productData.base_cost;
              importRow.marginPercent = ((importRow.unit_price - productData.base_cost) / importRow.unit_price) * 100;
            }
          } else {
            importRow.productFound = false;
            importRow.errors.push('Prodotto non trovato nel database');
          }
        }

        processedData.push(importRow);
      }

      setImportData(processedData);
      setStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Errore",
        description: "Errore durante la lettura del file Excel",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const executeImport = async () => {
    const validRows = importData.filter(row => row.errors.length === 0 && row.productFound);
    if (validRows.length === 0) {
      toast({
        title: "Errore",
        description: "Nessuna riga valida da importare",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    setStep('importing');
    let successCount = 0;
    let errorCount = 0;

    try {
      // Group by customer and list
      const groupedData = validRows.reduce((acc, row) => {
        const key = `${row.customer_name}_${row.list_name}_${row.list_identifier}`;
        if (!acc[key]) {
          acc[key] = {
            customer_name: row.customer_name,
            list_name: row.list_name,
            list_version: row.list_version,
            list_identifier: row.list_identifier,
            items: []
          };
        }
        acc[key].items.push(row);
        return acc;
      }, {} as any);

      const groups = Object.values(groupedData) as any[];
      
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        setProgress((i / groups.length) * 100);

        try {
          // Find or create customer
          let customerId = '';
          const { data: existingCustomer } = await supabase
            .from('customers')
            .select('id')
            .eq('name', group.customer_name)
            .maybeSingle();

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert([{ name: group.customer_name }])
              .select('id')
              .single();

            if (customerError) throw customerError;
            customerId = newCustomer.id;
          }

          // Create price list
          const { data: priceList, error: priceListError } = await supabase
            .from('price_lists')
            .insert([{
              list_name: `${group.list_name} ${group.list_version}`,
              customer_id: customerId,
              currency: 'EUR',
              valid_from: new Date().toISOString().split('T')[0],
              notes: `Importato da Excel - ${group.list_identifier}`
            }])
            .select('id')
            .single();

          if (priceListError) throw priceListError;

          // Insert price list items
          for (const item of group.items) {
            const { data: product } = await supabase
              .from('propellers')
              .select('id')
              .eq('model', item.product_code)
              .single();

            if (product) {
              const { error: itemError } = await supabase
                .from('price_list_items')
                .insert([{
                  price_list_id: priceList.id,
                  propeller_id: product.id,
                  unit_price: item.unit_price,
                  margin_percent: item.marginPercent,
                  margin_euro: item.marginEuro,
                  pricing_method: 'margin_percent'
                }]);

              if (itemError) {
                console.error('Error inserting item:', itemError);
                errorCount++;
              } else {
                successCount++;
              }
            }
          }
        } catch (error) {
          console.error('Error importing group:', error);
          errorCount += group.items.length;
        }
      }

      setImportResults({ success: successCount, errors: errorCount });
      setStep('complete');
      
      if (successCount > 0) {
        toast({
          title: "Import completato",
          description: `${successCount} prodotti importati con successo${errorCount > 0 ? `, ${errorCount} errori` : ''}`
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Error during import:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'importazione",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      setProgress(100);
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
                    onClick={downloadTemplate}
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