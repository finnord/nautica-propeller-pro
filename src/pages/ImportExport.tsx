import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink,
  RefreshCw,
  Plus,
  Edit,
  SkipForward,
  Settings,
  Archive,
  TrendingUp,
  AlertTriangle,
  Info
} from 'lucide-react';
import { downloadTemplate, downloadExportData, downloadPriceListTemplate } from '@/lib/excel-utils';
import { PriceListConflictDialog } from '@/components/dialogs/PriceListConflictDialog';
import { usePriceListImportValidation, type PriceListValidationResult, type PriceListImportRow, type ValidationLevel } from '@/hooks/usePriceListImportValidation';
import { usePriceListImportUpsert, type PriceListUpsertResult, type PriceListConflictResolution, type ImportMode } from '@/hooks/usePriceListImportUpsert';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'preview' | 'conflicts' | 'importing' | 'completed' | 'error';
type ImportStep = 'upload' | 'validate' | 'preview' | 'conflicts' | 'import' | 'complete';

export default function ImportExport() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [importStep, setImportStep] = useState<ImportStep>('upload');
  const [importMode, setImportMode] = useState<ImportMode>('upsert');
  const [validationResult, setValidationResult] = useState<PriceListValidationResult | null>(null);
  const [importData, setImportData] = useState<PriceListImportRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, PriceListConflictResolution>>({});
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [importResult, setImportResult] = useState<PriceListUpsertResult | null>(null);
  
  const { toast } = useToast();
  const { isValidating, validatePriceListImport } = usePriceListImportValidation();
  const { isImporting, upsertPriceListData, downloadImportLog } = usePriceListImportUpsert();

  // Reset function
  const resetImport = () => {
    setImportStatus('idle');
    setImportProgress(0);
    setImportStep('upload');
    setValidationResult(null);
    setImportData([]);
    setFile(null);
    setConflictResolutions({});
    setImportResult(null);
    setShowConflictDialog(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    resetImport();
    setFile(selectedFile);
    setImportStatus('uploading');
    setImportStep('validate');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      setImportStatus('validating');
      setImportProgress(30);
      
      // Get the first sheet (price list data)
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as PriceListImportRow[];
      
      if (jsonData.length === 0) {
        throw new Error('Il file Excel è vuoto o non contiene dati validi');
      }

      setImportData(jsonData);
      setImportProgress(60);
      
      // Validate the data
      const result = await validatePriceListImport(jsonData);
      setValidationResult(result);
      setImportProgress(100);
      
      // Determine next step based on validation
      if (!result.canProceed) {
        setImportStatus('error');
        setImportStep('upload');
        toast({
          title: 'Errori Critici',
          description: 'Il file contiene errori critici che bloccano l\'import. Correggi i dati e riprova.',
          variant: 'destructive'
        });
      } else if (result.conflicts.length > 0) {
        setImportStatus('conflicts');
        setImportStep('conflicts');
        setShowConflictDialog(true);
      } else {
        setImportStatus('preview');
        setImportStep('preview');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setImportStatus('error');
      setImportStep('upload');
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Errore durante la lettura del file Excel',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async () => {
    if (!validationResult) return;

    setImportStatus('importing');
    setImportStep('import');
    setImportProgress(0);

    try {
      const result = await upsertPriceListData(importData, conflictResolutions, importMode);
      setImportResult(result);
      setImportStatus('completed');
      setImportStep('complete');
      setImportProgress(100);
      
      const hasErrors = result.errors.length > 0;
      
      toast({
        title: hasErrors ? 'Import Completato con Errori' : 'Import Completato',
        description: `${result.inserted} inseriti, ${result.updated} aggiornati, ${result.skipped} saltati${hasErrors ? `, ${result.errors.length} errori` : ''}`,
        variant: hasErrors ? 'destructive' : 'default'
      });
      
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast({
        title: 'Errore Import',
        description: 'Si è verificato un errore durante l\'importazione',
        variant: 'destructive'
      });
    }
  };

  const handleConflictResolutions = (resolutions: Record<string, PriceListConflictResolution>) => {
    setConflictResolutions(resolutions);
    setShowConflictDialog(false);
    setImportStatus('preview');
    setImportStep('preview');
  };

  const handleResolveAllConflicts = (resolution: PriceListConflictResolution) => {
    const allResolutions: Record<string, PriceListConflictResolution> = {};
    validationResult?.conflicts.forEach(conflict => {
      allResolutions[conflict.id] = resolution;
    });
    setConflictResolutions(allResolutions);
    setShowConflictDialog(false);
    setImportStatus('preview');
    setImportStep('preview');
  };

  const handleDownloadTemplate = () => {
    downloadPriceListTemplate();
    toast({
      title: "Template scaricato",
      description: "Il template Excel per listini prezzi è stato scaricato con successo",
    });
  };

  const handleExport = async (type: 'products' | 'customers' | 'rfq' | 'equivalences' | 'complete', format: 'xlsx' | 'csv' = 'xlsx') => {
    try {
      let data: any[] = [];
      let filename = '';
      
      switch (type) {
        case 'products':
          const { data: impellers } = await supabase
            .from('impellers')
            .select(`
              *,
              rubber_compounds (compound_code, compound_name),
              bushings (bushing_code, material)
            `);
          data = impellers || [];
          filename = 'Prodotti_Export';
          break;
          
        case 'customers':
          const { data: customers } = await supabase
            .from('customers')
            .select('*');
          data = customers || [];
          filename = 'Clienti_Export';
          break;
          
        case 'rfq':
          const { data: rfqs } = await supabase
            .from('rfq')
            .select(`
              *,
              customers (name),
              rfq_lines (
                *,
                propellers (model)
              )
            `);
          data = rfqs || [];
          filename = 'RFQ_Export';
          break;
          
        case 'equivalences':
          const { data: crossRefs } = await supabase
            .from('cross_references')
            .select('*');
          data = crossRefs || [];
          filename = 'Equivalenze_Export';
          break;
          
        case 'complete':
          // Export all data in separate sheets
          const success = downloadExportData(type, format);
          if (success) {
            toast({
              title: "Export completato",
              description: `Dati completi esportati in formato ${format.toUpperCase()}`,
            });
          }
          return;
      }
      
      if (data.length === 0) {
        toast({
          title: "Nessun dato",
          description: "Non ci sono dati da esportare per questa categoria",
          variant: "destructive",
        });
        return;
      }
      
      // Create workbook and export
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, type);
      
      if (format === 'xlsx') {
        XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } else {
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      toast({
        title: "Export completato",
        description: `${data.length} record esportati in formato ${format.toUpperCase()}`,
      });
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Errore export",
        description: "Si è verificato un errore durante l'export",
        variant: "destructive",
      });
    }
  };

  const getValidationIcon = (level: ValidationLevel) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'important': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'suggested': return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getValidationBadgeVariant = (level: ValidationLevel) => {
    switch (level) {
      case 'critical': return 'destructive';
      case 'important': return 'secondary';
      case 'suggested': return 'outline';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Import/Export Listini Prezzi</h1>
            <p className="text-body">Sistema intelligente per import ed export di listini prezzi con gestione UPSERT</p>
          </div>
        </div>

        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import Listini
            </TabsTrigger>
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <div className="grid gap-6">
              {/* Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Sistema Import Intelligente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Funzionalità Avanzate:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li><strong>UPSERT Automatico:</strong> Inserisce nuovi record o aggiorna esistenti</li>
                        <li><strong>Validazione Intelligente:</strong> Critico/Importante/Suggerito</li>
                        <li><strong>Gestione Conflitti:</strong> Risoluzione interattiva delle differenze</li>
                        <li><strong>Modalità Flessibili:</strong> Append, Update, o Upsert completo</li>
                        <li><strong>Log Tracciabile:</strong> Record dettagliato di tutte le operazioni</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Campi Supportati:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li><Badge variant="destructive" className="text-xs mr-1">Obbligatorio</Badge>product_code o product_name</li>
                        <li><Badge variant="secondary" className="text-xs mr-1">Importante</Badge>customer_name, list_name, unit_price</li>
                        <li><Badge variant="outline" className="text-xs mr-1">Opzionale</Badge>margin_percent, currency, notes</li>
                        <li>Campi automatici: customer_code, valid_from/to</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button onClick={handleDownloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica Template Listini
                    </Button>
                    <Button variant="outline" asChild>
                      <a href="#" target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Guida Completa
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Import Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurazione Import
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Modalità Import</Label>
                      <RadioGroup 
                        value={importMode} 
                        onValueChange={(value) => setImportMode(value as ImportMode)}
                        className="flex flex-wrap gap-6 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="upsert" id="mode-upsert" />
                          <Label htmlFor="mode-upsert">
                            <span className="font-medium">UPSERT</span>
                            <span className="block text-xs text-muted-foreground">Inserisce o aggiorna automaticamente</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="append" id="mode-append" />
                          <Label htmlFor="mode-append">
                            <span className="font-medium">APPEND</span>
                            <span className="block text-xs text-muted-foreground">Solo nuovi record</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="update" id="mode-update" />
                          <Label htmlFor="mode-update">
                            <span className="font-medium">UPDATE</span>
                            <span className="block text-xs text-muted-foreground">Solo record esistenti</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Caricamento File Excel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={isValidating || isImporting}
                    />
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer block space-y-4"
                    >
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-lg font-medium">
                          {file ? file.name : 'Seleziona file Excel'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Formato supportato: .xlsx, .xls (listini prezzi)
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Progress */}
                  {(importStatus === 'uploading' || importStatus === 'validating' || importStatus === 'importing') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {importStatus === 'uploading' ? 'Caricamento...' : 
                           importStatus === 'validating' ? 'Validazione intelligente...' : 'Import in corso...'}
                        </span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Results - Preview Mode */}
              {importStatus === 'preview' && validationResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Anteprima Import - Pronto per Esecuzione
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{validationResult.summary.newCustomers}</div>
                        <div className="text-sm text-muted-foreground">Nuovi Clienti</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-secondary">{validationResult.summary.newPriceLists}</div>
                        <div className="text-sm text-muted-foreground">Nuovi Listini</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{validationResult.summary.newItems}</div>
                        <div className="text-sm text-muted-foreground">Nuovi Prezzi</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{validationResult.summary.updatedItems}</div>
                        <div className="text-sm text-muted-foreground">Prezzi Aggiornati</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{validationResult.summary.potentialConflicts}</div>
                        <div className="text-sm text-muted-foreground">Conflitti Risolti</div>
                      </div>
                    </div>

                    {/* Validation Messages */}
                    {validationResult.messages.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Messaggi di Validazione:</h4>
                        <ScrollArea className="h-32 border rounded-md p-2">
                          <div className="space-y-1">
                            {validationResult.messages.map((msg, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm p-2 rounded border-l-2" 
                                   style={{ borderLeftColor: msg.level === 'critical' ? 'hsl(var(--destructive))' : 
                                                             msg.level === 'important' ? 'hsl(var(--warning))' : 
                                                             'hsl(var(--muted-foreground))' }}>
                                {getValidationIcon(msg.level)}
                                <Badge variant={getValidationBadgeVariant(msg.level)} className="text-xs">
                                  Riga {msg.rowNumber}
                                </Badge>
                                <span className="font-medium">{msg.field}:</span>
                                <span>{msg.message}</span>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={handleImport}
                        disabled={!validationResult.canProceed || isImporting}
                        className="flex-1"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Esegui Import ({importData.length} righe)
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={resetImport}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importStatus === 'completed' && importResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Import Completato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Results Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{importResult.inserted}</div>
                        <div className="text-sm text-muted-foreground">Inseriti</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{importResult.updated}</div>
                        <div className="text-sm text-muted-foreground">Aggiornati</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                        <div className="text-sm text-muted-foreground">Saltati</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                        <div className="text-sm text-muted-foreground">Errori</div>
                      </div>
                    </div>

                    {/* Errors */}
                    {importResult.errors.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-destructive">Errori Riscontrati:</h4>
                        <ScrollArea className="h-32 border rounded-md p-2 bg-destructive/5">
                          <div className="space-y-1">
                            {importResult.errors.map((error, index) => (
                              <div key={index} className="text-sm text-destructive p-2 border-l-2 border-destructive/50">
                                {error}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t">
                      <Button 
                        onClick={() => downloadImportLog(importResult.log)}
                        variant="outline"
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Scarica Log Dettagliato
                      </Button>
                      <Button 
                        onClick={resetImport}
                        variant="outline"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Nuovo Import
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {/* Export Section - Keep existing implementation */}
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Dati
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Export per Categoria:</h4>
                      <div className="grid gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleExport('products')}
                          className="justify-start"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Prodotti/Impellers
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleExport('customers')}
                          className="justify-start"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Clienti
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleExport('rfq')}
                          className="justify-start"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          RFQ
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => handleExport('equivalences')}
                          className="justify-start"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Equivalenze
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Export Completo:</h4>
                      <div className="grid gap-2">
                        <Button 
                          onClick={() => handleExport('complete', 'xlsx')}
                          className="justify-start"
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Backup Completo (XLSX)
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => handleExport('complete', 'csv')}
                          className="justify-start"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Backup Completo (CSV)
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Conflict Resolution Dialog */}
        {validationResult && (
          <PriceListConflictDialog
            open={showConflictDialog}
            onOpenChange={setShowConflictDialog}
            conflicts={validationResult.conflicts}
            onResolve={handleConflictResolutions}
            onResolveAll={handleResolveAllConflicts}
          />
        )}
      </div>
    </AppLayout>
  );
}
