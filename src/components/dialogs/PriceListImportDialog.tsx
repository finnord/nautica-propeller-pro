import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { downloadPriceListTemplate } from '@/lib/excel-utils';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePriceListImportValidation, type PriceListImportRow } from '@/hooks/usePriceListImportValidation';
import { usePriceListImportUpsert } from '@/hooks/usePriceListImportUpsert';
import * as XLSX from 'xlsx';

// Use PriceListImportRow from validation hook instead

interface PriceListImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const PriceListImportDialog = ({ open, onOpenChange, onSuccess }: PriceListImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<PriceListImportRow[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [importResults, setImportResults] = useState<{ success: number; errors: number }>({ success: 0, errors: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const { isValidating, validatePriceListImport } = usePriceListImportValidation();
  const { isImporting, upsertPriceListData } = usePriceListImportUpsert();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const processFile = async () => {
    if (!file) return;

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

      const processedData: PriceListImportRow[] = jsonData.map((row, index) => ({
        product_code: toTrimmedString(row['product_code']),
        product_name: toTrimmedString(row['product_name']) || toTrimmedString(row['product_code']),
        customer_name: toTrimmedString(row['customer_name']),
        customer_code: toTrimmedString(row['customer_code']),
        list_name: toTrimmedString(row['list_name']),
        currency: toTrimmedString(row['currency']) || 'EUR',
        unit_price: toNumber(row['unit_price']),
        margin_percent: toNumber(row['margin_percent']) || undefined,
        margin_euro: toNumber(row['margin_euro']) || undefined,
        min_quantity: toNumber(row['min_quantity']) || 1,
        notes: toTrimmedString(row['notes']) || undefined,
        valid_from: toTrimmedString(row['valid_from']) || undefined,
        valid_to: toTrimmedString(row['valid_to']) || undefined
      }));

      // Validate the data
      const validationResult = await validatePriceListImport(processedData);
      console.log('Validation result:', validationResult);

      setImportData(processedData);
      setStep('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: 'Errore',
        description: "Errore durante la lettura del file Excel",
        variant: 'destructive'
      });
    }
  };

  const executeImport = async () => {
    if (importData.length === 0) {
      toast({
        title: 'Errore',
        description: 'Nessun dato da importare',
        variant: 'destructive'
      });
      return;
    }

    setStep('importing');

    try {
      const result = await upsertPriceListData(importData, {}, 'upsert');
      
      setImportResults({ 
        success: result.inserted + result.updated, 
        errors: result.errors.length 
      });
      setStep('complete');

      if (result.inserted > 0 || result.updated > 0) {
        toast({
          title: 'Import completato',
          description: `${result.inserted} inseriti, ${result.updated} aggiornati${result.errors.length > 0 ? `, ${result.errors.length} errori` : ''}`
        });
        
        if (result.errors.length > 0) {
          console.error('Import errors:', result.errors);
        }
        
        onSuccess();
      } else if (result.errors.length > 0) {
        toast({
          title: 'Errore',
          description: `Import fallito: ${result.errors[0]}`,
          variant: 'destructive'
        });
        setStep('preview');
      }
    } catch (error) {
      console.error('Error during import:', error);
      setStep('preview');
      toast({
        title: 'Errore',
        description: "Errore durante l'importazione",
        variant: 'destructive'
      });
    }
  };

  const resetDialog = () => {
    setFile(null);
    setImportData([]);
    setStep('upload');
    setImportResults({ success: 0, errors: 0 });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    if (!isImporting) {
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
                    disabled={!file || isValidating}
                  >
                    {isValidating ? 'Validazione...' : 'Elabora file'}
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
                  {importData.length} righe da processare
                </p>
              </div>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Indietro
                </Button>
                <Button
                  onClick={executeImport}
                  disabled={importData.length === 0 || isImporting}
                >
                  {isImporting ? 'Importazione...' : `Importa ${importData.length} prodotti`}
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
                      <TableCell>{index + 2}</TableCell>
                      <TableCell className="font-mono">{row.product_code || row.product_name}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.list_name}</TableCell>
                      <TableCell>€{(row.unit_price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {row.margin_percent !== undefined ? (
                          <div className="text-sm">
                            <div>{row.margin_percent.toFixed(1)}%</div>
                            <div className="text-muted-foreground">€{row.margin_euro?.toFixed(2)}</div>
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pronto
                        </Badge>
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

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                I dati verranno validati durante l'importazione. Le righe non valide verranno saltate automaticamente.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 text-center">
            <Upload className="mx-auto h-12 w-12 text-primary animate-pulse" />
            <div>
              <h3 className="text-lg font-medium">Importazione in corso...</h3>
              <p className="text-muted-foreground">Non chiudere questa finestra</p>
            </div>
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
