import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
  SkipForward
} from 'lucide-react';
import { downloadTemplate, downloadExportData } from '@/lib/excel-utils';
import { ConflictResolutionDialog, type Conflict, type ConflictResolution } from '@/components/dialogs/ConflictResolutionDialog';
import { useImportValidation, type UpsertValidationResult, type ValidationLevel } from '@/hooks/useImportValidation';
import { useImportUpsert, type UpsertResult } from '@/hooks/useImportUpsert';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'completed' | 'error';
type ImportMode = 'preview' | 'conflicts' | 'importing';

interface ImportData {
  sheet: string;
  data: any[];
  headers: string[];
}

export default function ImportExport() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [importMode, setImportMode] = useState<ImportMode>('preview');
  const [validationResults, setValidationResults] = useState<UpsertValidationResult[]>([]);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [allConflicts, setAllConflicts] = useState<Conflict[]>([]);
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, ConflictResolution>>({});
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [importResults, setImportResults] = useState<UpsertResult[]>([]);
  
  const { toast } = useToast();
  const { validateImpellerUpsert, validateRubberCompoundUpsert, validateBushingUpsert } = useImportValidation();
  const { upsertImpellers, upsertRubberCompounds, upsertBushings } = useImportUpsert();

  // Reset function
  const resetImport = () => {
    setImportStatus('idle');
    setImportProgress(0);
    setImportMode('preview');
    setValidationResults([]);
    setImportData([]);
    setFile(null);
    setAllConflicts([]);
    setConflictResolutions({});
    setImportResults([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    resetImport();
    setFile(selectedFile);
    setImportStatus('uploading');

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      setImportStatus('validating');
      
      const parsedData: ImportData[] = [];
      const validationPromises: Promise<UpsertValidationResult>[] = [];
      
      let totalSheets = 0;
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          parsedData.push({
            sheet: sheetName,
            data: jsonData,
            headers: Object.keys(jsonData[0] as any)
          });
          totalSheets++;
          
          // Add smart validation based on sheet content
          if (sheetName.toLowerCase().includes('impeller') || sheetName === 'Products') {
            validationPromises.push(validateImpellerUpsert(jsonData));
          } else if (sheetName.toLowerCase().includes('rubber') || sheetName.toLowerCase().includes('compound')) {
            validationPromises.push(validateRubberCompoundUpsert(jsonData));
          } else if (sheetName.toLowerCase().includes('bushing')) {
            validationPromises.push(validateBushingUpsert(jsonData));
          }
        }
        
        setImportProgress((parsedData.length / workbook.SheetNames.length) * 70);
      }
      
      // Wait for all validations
      const results = await Promise.all(validationPromises);
      
      // Collect all conflicts
      const conflicts: Conflict[] = [];
      results.forEach(result => conflicts.push(...result.conflicts));
      
      setImportData(parsedData);
      setValidationResults(results);
      setAllConflicts(conflicts);
      setImportStatus('completed');
      setImportProgress(100);
      
      // Show conflicts if any
      if (conflicts.length > 0) {
        setImportMode('conflicts');
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      setImportStatus('error');
      toast({
        title: 'Errore',
        description: 'Errore durante la lettura del file Excel',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async () => {
    setImportStatus('importing');
    setImportMode('importing');
    setImportProgress(0);

    try {
      const results: UpsertResult[] = [];
      let totalProgress = 0;
      const sheets = importData.length;
      
      for (const sheet of importData) {
        let result: UpsertResult;
        
        if (sheet.sheet.toLowerCase().includes('impeller') || sheet.sheet === 'Products') {
          result = await upsertImpellers(sheet.data, conflictResolutions);
        } else if (sheet.sheet.toLowerCase().includes('rubber') || sheet.sheet.toLowerCase().includes('compound')) {
          result = await upsertRubberCompounds(sheet.data, conflictResolutions);
        } else if (sheet.sheet.toLowerCase().includes('bushing')) {
          result = await upsertBushings(sheet.data, conflictResolutions);
        } else {
          result = { inserted: 0, updated: 0, skipped: sheet.data.length, errors: ['Tipo foglio non riconosciuto'] };
        }
        
        results.push(result);
        totalProgress += (100 / sheets);
        setImportProgress(Math.round(totalProgress));
      }
      
      setImportResults(results);
      setImportStatus('completed');
      
      const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
      const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
      
      toast({
        title: 'Import completato',
        description: `${totalInserted} inseriti, ${totalUpdated} aggiornati${totalErrors > 0 ? `, ${totalErrors} errori` : ''}`,
        variant: totalErrors > 0 ? 'destructive' : 'default'
      });
      
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus('error');
      toast({
        title: 'Errore import',
        description: 'Si è verificato un errore durante l\'importazione',
        variant: 'destructive'
      });
    }
  };

  const handleConflictResolutions = (resolutions: Record<string, ConflictResolution>) => {
    setConflictResolutions(resolutions);
    setImportMode('preview');
  };

  const handleResolveAllConflicts = (resolution: ConflictResolution) => {
    const allResolutions: Record<string, ConflictResolution> = {};
    allConflicts.forEach(conflict => {
      allResolutions[conflict.id] = resolution;
    });
    setConflictResolutions(allResolutions);
    setImportMode('preview');
  };

  const handleDownloadTemplate = () => {
    downloadTemplate();
    toast({
      title: "Template scaricato",
      description: "Il template Excel è stato scaricato con successo",
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Import/Export Dati</h1>
            <p className="text-body">Gestione import ed export dati da/verso Excel</p>
          </div>
        </div>

        <Tabs defaultValue="import">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
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
                    Template e Istruzioni
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium">Come Importare:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li>Scarica il template Excel con la struttura corretta</li>
                        <li>Compila i dati seguendo le colonne predefinite</li>
                        <li>I campi critici sono obbligatori per evitare errori</li>
                        <li>Il sistema rileva automaticamente record esistenti</li>
                        <li>Vengono proposti aggiornamenti per dati esistenti</li>
                        <li>I conflitti vengono risolti interattivamente</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Validazione Intelligente:</h4>
                      <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                        <li><Badge variant="destructive" className="text-xs">Critico</Badge> - Blocca l'import</li>
                        <li><Badge variant="secondary" className="text-xs">Importante</Badge> - Avvisi da verificare</li>
                        <li><Badge variant="outline" className="text-xs">Suggerito</Badge> - Migliorie consigliate</li>
                        <li>UPSERT automatico: inserisce nuovi record o aggiorna esistenti</li>
                        <li>Gestione conflitti: risoluzione interattiva delle differenze</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    <Button onClick={handleDownloadTemplate} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Scarica Template Excel
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

              {/* File Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Caricamento File
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
                      disabled={importStatus === 'uploading' || importStatus === 'validating'}
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
                          Formato supportato: .xlsx, .xls
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Progress */}
                  {(importStatus === 'uploading' || importStatus === 'validating') && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>
                          {importStatus === 'uploading' ? 'Caricamento...' : 'Validazione...'}
                        </span>
                        <span>{importProgress}%</span>
                      </div>
                      <Progress value={importProgress} />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Validation Results - Preview Mode */}
              {importMode === 'preview' && validationResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Anteprima Import - Analisi Intelligente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <Plus className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {validationResults.reduce((sum, r) => sum + r.proposedChanges.inserts, 0)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Nuovi record</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-blue-600">
                          <Edit className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {validationResults.reduce((sum, r) => sum + r.proposedChanges.updates, 0)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Aggiornamenti</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 text-orange-600">
                          <SkipForward className="h-5 w-5" />
                          <span className="text-2xl font-bold">
                            {validationResults.reduce((sum, r) => sum + r.proposedChanges.skipped, 0)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">Saltati</p>
                      </div>
                    </div>

                    {/* Validation Messages by Sheet */}
                    {validationResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium">{result.sheet}</h4>
                          <Badge variant={result.canProceed ? 'default' : 'destructive'}>
                            {result.rows} righe
                          </Badge>
                        </div>
                        
                        {/* Critical Messages */}
                        {result.validMessages.filter(m => m.level === 'critical').length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">
                                Errori Critici ({result.validMessages.filter(m => m.level === 'critical').length})
                              </span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-6">
                              {result.validMessages.filter(m => m.level === 'critical').map((msg, msgIndex) => (
                                <li key={msgIndex}>Riga {msg.rowNumber}: {msg.message}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Important Messages */}
                        {result.validMessages.filter(m => m.level === 'important').length > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">
                                Avvisi Importanti ({result.validMessages.filter(m => m.level === 'important').length})
                              </span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-6">
                              {result.validMessages.filter(m => m.level === 'important').slice(0, 5).map((msg, msgIndex) => (
                                <li key={msgIndex}>Riga {msg.rowNumber}: {msg.message}</li>
                              ))}
                              {result.validMessages.filter(m => m.level === 'important').length > 5 && (
                                <li className="text-muted-foreground">
                                  ... e altri {result.validMessages.filter(m => m.level === 'important').length - 5} avvisi
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                        
                        {/* Conflicts Summary */}
                        {result.conflicts.length > 0 && (
                          <div className="space-y-2 mt-3">
                            <div className="flex items-center gap-2 text-orange-600">
                              <AlertCircle className="h-4 w-4" />
                              <span className="font-medium">
                                Conflitti da Risolvere ({result.conflicts.length})
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground pl-6">
                              Record esistenti con valori diversi
                            </p>
                          </div>
                        )}
                        
                        {result.canProceed && result.validMessages.filter(m => m.level === 'critical').length === 0 && (
                          <div className="flex items-center gap-2 text-green-600 mt-3">
                            <CheckCircle className="h-4 w-4" />
                            <span>Pronto per l'import</span>
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Import Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {!validationResults.every(r => r.canProceed)
                          ? 'Correggere gli errori critici prima di procedere'
                          : allConflicts.length > 0
                          ? 'Conflitti rilevati - risolverli per procedere'
                          : 'Analisi completata, pronto per l\'import'
                        }
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={resetImport}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Ricomincia
                        </Button>
                        {allConflicts.length > 0 && (
                          <Button 
                            variant="outline"
                            onClick={() => setShowConflictDialog(true)}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Risolvi Conflitti ({allConflicts.length})
                          </Button>
                        )}
                        <Button 
                          onClick={handleImport}
                          disabled={!validationResults.every(r => r.canProceed)}
                        >
                          {allConflicts.length > 0 && Object.keys(conflictResolutions).length === 0 
                            ? 'Risolvi Conflitti Prima' 
                            : 'Procedi con Import'
                          }
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Import Results */}
              {importMode === 'importing' && importResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Risultati Import
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {importResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-green-600">{result.inserted}</div>
                            <div className="text-sm text-muted-foreground">Inseriti</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{result.updated}</div>
                            <div className="text-sm text-muted-foreground">Aggiornati</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-orange-600">{result.skipped}</div>
                            <div className="text-sm text-muted-foreground">Saltati</div>
                          </div>
                        </div>
                        
                        {result.errors.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <div className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4" />
                              <span className="font-medium">Errori ({result.errors.length})</span>
                            </div>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground pl-6">
                              {result.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Conflict Resolution Dialog */}
              <ConflictResolutionDialog
                open={showConflictDialog}
                onOpenChange={setShowConflictDialog}
                conflicts={allConflicts}
                onResolve={handleConflictResolutions}
                onResolveAll={handleResolveAllConflicts}
              />
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="grid gap-6">
              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Opzioni Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Single Category Exports */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Export per Categoria</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Prodotti</div>
                              <div className="text-sm text-muted-foreground">Giranti, mescole, bussole</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('products', 'xlsx')}
                            >
                              XLSX
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('products', 'csv')}
                            >
                              CSV
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Clienti</div>
                              <div className="text-sm text-muted-foreground">Anagrafica clienti</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('customers', 'xlsx')}
                            >
                              XLSX
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('customers', 'csv')}
                            >
                              CSV
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">RFQ</div>
                              <div className="text-sm text-muted-foreground">Richieste di quotazione</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('rfq', 'xlsx')}
                            >
                              XLSX
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('rfq', 'csv')}
                            >
                              CSV
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <div className="font-medium">Equivalenze</div>
                              <div className="text-sm text-muted-foreground">Cross-references</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('equivalences', 'xlsx')}
                            >
                              XLSX
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleExport('equivalences', 'csv')}
                            >
                              CSV
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Complete Export */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Export Completo</h4>
                      <div className="border rounded-lg p-6 text-center space-y-4">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Download className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-lg">Backup Completo</div>
                          <div className="text-sm text-muted-foreground">
                            Tutti i dati in un unico file con fogli separati
                          </div>
                        </div>
                        <div className="flex justify-center gap-3">
                          <Button onClick={() => handleExport('complete', 'xlsx')}>
                            <Download className="h-4 w-4 mr-2" />
                            Download XLSX
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleExport('complete', 'csv')}
                          >
                            Download CSV
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}