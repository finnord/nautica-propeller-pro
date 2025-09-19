import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  ExternalLink
} from 'lucide-react';
import { downloadTemplate, downloadExportData } from '@/lib/excel-utils';
import * as XLSX from 'xlsx';

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'completed' | 'error';
type ValidationResult = {
  sheet: string;
  rows: number;
  errors: string[];
  warnings: string[];
};

interface ImportData {
  sheet: string;
  data: any[];
  headers: string[];
}

export default function ImportExport() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importData, setImportData] = useState<ImportData[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const { toast } = useToast();

  // Real validation functions
  const validateImpellerData = async (data: any[]): Promise<ValidationResult> => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [index, row] of data.entries()) {
      const rowNum = index + 2; // Excel row number
      
      if (!row.impeller_name) {
        errors.push(`Riga ${rowNum}: Nome girante obbligatorio`);
      }
      if (!row.rubber_volume_cm3 || row.rubber_volume_cm3 <= 0) {
        errors.push(`Riga ${rowNum}: Volume gomma obbligatorio e > 0`);
      }
      if (row.outer_diameter_mm && row.inner_diameter_mm && row.outer_diameter_mm <= row.inner_diameter_mm) {
        errors.push(`Riga ${rowNum}: Diametro esterno deve essere > diametro interno`);
      }
      
      // Check if rubber compound exists
      if (row.rubber_compound_code) {
        const { data: compound } = await supabase
          .from('rubber_compounds')
          .select('id')
          .eq('compound_code', row.rubber_compound_code)
          .single();
        
        if (!compound) {
          warnings.push(`Riga ${rowNum}: Mescola ${row.rubber_compound_code} non trovata`);
        }
      }
      
      // Check if bushing exists
      if (row.bushing_code) {
        const { data: bushing } = await supabase
          .from('bushings')
          .select('id')
          .eq('bushing_code', row.bushing_code)
          .single();
        
        if (!bushing) {
          warnings.push(`Riga ${rowNum}: Bussola ${row.bushing_code} non trovata`);
        }
      }
    }
    
    return {
      sheet: 'Impellers',
      rows: data.length,
      errors,
      warnings
    };
  };

  const validateCustomerData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      if (!row.name) {
        errors.push(`Riga ${rowNum}: Nome cliente obbligatorio`);
      }
      if (row.vat_number && !/^[A-Z]{2}[0-9]{11}$/.test(row.vat_number)) {
        warnings.push(`Riga ${rowNum}: Formato P.IVA non valido`);
      }
    }
    
    return {
      sheet: 'Customers',
      rows: data.length,
      errors,
      warnings
    };
  };

  const validateRubberCompoundData = (data: any[]): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    for (const [index, row] of data.entries()) {
      const rowNum = index + 2;
      
      if (!row.compound_code) {
        errors.push(`Riga ${rowNum}: Codice mescola obbligatorio`);
      }
      if (!row.compound_name) {
        errors.push(`Riga ${rowNum}: Nome mescola obbligatorio`);
      }
      if (!row.density_g_cm3 || row.density_g_cm3 <= 0) {
        errors.push(`Riga ${rowNum}: Densità obbligatoria e > 0`);
      }
      if (!row.base_polymer) {
        errors.push(`Riga ${rowNum}: Polimero base obbligatorio`);
      }
      if (row.material_cost_per_kg && row.material_cost_per_kg <= 0) {
        warnings.push(`Riga ${rowNum}: Costo materiale dovrebbe essere > 0`);
      }
    }
    
    return {
      sheet: 'RubberCompounds',
      rows: data.length,
      errors,
      warnings
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setImportStatus('uploading');
    setImportProgress(10);

    try {
      // Read Excel file
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      setImportStatus('validating');
      setImportProgress(30);
      
      const parsedData: ImportData[] = [];
      const validationPromises: Promise<ValidationResult>[] = [];
      
      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        if (sheetName === 'INFO' || sheetName === 'ISTRUZIONI') continue;
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const headers = Object.keys(jsonData[0] as object);
          parsedData.push({
            sheet: sheetName,
            data: jsonData,
            headers
          });
          
          // Validate based on sheet type
          if (sheetName.toLowerCase().includes('impeller') || sheetName === 'Products') {
            validationPromises.push(validateImpellerData(jsonData));
          } else if (sheetName.toLowerCase().includes('customer')) {
            validationPromises.push(Promise.resolve(validateCustomerData(jsonData)));
          } else if (sheetName.toLowerCase().includes('rubber') || sheetName.toLowerCase().includes('compound')) {
            validationPromises.push(Promise.resolve(validateRubberCompoundData(jsonData)));
          }
        }
      }
      
      setImportProgress(60);
      
      // Wait for all validations
      const results = await Promise.all(validationPromises);
      
      setImportData(parsedData);
      setValidationResults(results);
      setImportStatus('completed');
      setImportProgress(100);
      
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
    setImportProgress(0);

    try {
      let totalProgress = 0;
      const sheets = importData.length;
      
      for (const sheet of importData) {
        if (sheet.sheet.toLowerCase().includes('impeller') || sheet.sheet === 'Products') {
          await importImpellers(sheet.data);
        } else if (sheet.sheet.toLowerCase().includes('customer')) {
          await importCustomers(sheet.data);
        } else if (sheet.sheet.toLowerCase().includes('rubber') || sheet.sheet.toLowerCase().includes('compound')) {
          await importRubberCompounds(sheet.data);
        }
        
        totalProgress += (100 / sheets);
        setImportProgress(Math.round(totalProgress));
      }
      
      setImportStatus('completed');
      toast({
        title: 'Import completato',
        description: 'Tutti i dati sono stati importati con successo'
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

  const importImpellers = async (data: any[]) => {
    const validData = data.filter(row => row.impeller_name && row.rubber_volume_cm3 > 0);
    
    for (const row of validData) {
      const impellerData: any = {
        impeller_name: row.impeller_name,
        internal_code: row.internal_code || null,
        outer_diameter_mm: row.outer_diameter_mm || null,
        inner_diameter_mm: row.inner_diameter_mm || null,
        height_mm: row.height_mm || null,
        hub_diameter_mm: row.hub_diameter_mm || null,
        blade_count: row.blade_count || null,
        blade_thickness_base_mm: row.blade_thickness_base_mm || null,
        rubber_volume_cm3: row.rubber_volume_cm3,
        base_cost: row.base_cost || 0,
        gross_margin_pct: row.gross_margin_pct || null,
        base_list_price: row.base_list_price || null,
        drawing_link_url: row.drawing_link_url || null,
        notes: row.notes || null,
        status: row.status || 'active'
      };

      // Link rubber compound if provided
      if (row.rubber_compound_code) {
        const { data: compound } = await supabase
          .from('rubber_compounds')
          .select('id')
          .eq('compound_code', row.rubber_compound_code)
          .single();
        
        if (compound) {
          impellerData.rubber_compound_id = compound.id;
        }
      }

      // Link bushing if provided
      if (row.bushing_code) {
        const { data: bushing } = await supabase
          .from('bushings')
          .select('id')
          .eq('bushing_code', row.bushing_code)
          .single();
        
        if (bushing) {
          impellerData.bushing_id = bushing.id;
        }
      }

      await supabase.from('impellers').insert(impellerData);
    }
  };

  const importCustomers = async (data: any[]) => {
    const validData = data.filter(row => row.name);
    
    for (const row of validData) {
      const customerData = {
        name: row.name,
        vat_number: row.vat_number || null,
        website: row.website || null,
        annual_revenue_eur: row.annual_revenue_eur || null,
        contacts: row.contacts ? JSON.parse(row.contacts) : null,
        notes: row.notes || null
      };

      await supabase.from('customers').insert(customerData);
    }
  };

  const importRubberCompounds = async (data: any[]) => {
    const validData = data.filter(row => row.compound_code && row.compound_name && row.density_g_cm3 > 0);
    
    for (const row of validData) {
      const compoundData = {
        compound_code: row.compound_code,
        compound_name: row.compound_name,
        base_polymer: row.base_polymer,
        density_g_cm3: row.density_g_cm3,
        material_cost_per_kg: row.material_cost_per_kg || null,
        supplier_name: row.supplier_name || null,
        cef_internal_code: row.cef_internal_code || null,
        notes: row.notes || null
      };

      await supabase.from('rubber_compounds').insert(compoundData);
    }
  };

  const getStatusColor = (hasErrors: boolean, hasWarnings: boolean) => {
    if (hasErrors) return 'bg-red-500/10 text-red-700 border-red-200';
    if (hasWarnings) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-green-500/10 text-green-700 border-green-200';
  };

  const getStatusIcon = (hasErrors: boolean, hasWarnings: boolean) => {
    if (hasErrors) return XCircle;
    if (hasWarnings) return AlertCircle;
    return CheckCircle;
  };

  const handleDownloadTemplate = () => {
    const success = downloadTemplate();
    if (success) {
      toast({
        title: "Template scaricato",
        description: "Il template Excel è stato scaricato con successo",
      });
    } else {
      toast({
        title: "Errore download",
        description: "Si è verificato un errore durante il download",
        variant: "destructive",
      });
    }
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
              rubber_compounds:rubber_compound_id (compound_code, compound_name),
              bushings:bushing_id (bushing_code, material)
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
            {/* Import Instructions */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Template Import v3
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Utilizza il template Excel v3 con i seguenti fogli obbligatori:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Products</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>ImpellerDims</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>RubberMix</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Bushing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Customers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>PriceLists</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>EquivalentImpeller</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>EquivalentBushing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>RFQ & RFQLines</span>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadTemplate}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Scarica Template v3
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.open('https://docs.google.com/document/d/example-import-guide', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Guida Import
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* File Upload */}
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg">Carica File Excel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center relative">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Trascina il file Excel qui o clicca per selezionare</p>
                    <p className="text-xs text-muted-foreground">Supporto per file .xlsx e .xls (max 10MB)</p>
                    {file && (
                      <p className="text-sm text-primary font-medium">File selezionato: {file.name}</p>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                {importStatus !== 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {importStatus === 'uploading' && 'Caricamento file...'}
                        {importStatus === 'validating' && 'Validazione dati...'}
                        {importStatus === 'importing' && 'Importazione in corso...'}
                        {importStatus === 'completed' && 'Importazione completata'}
                      </span>
                      <span>{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validation Results */}
            {validationResults.length > 0 && (
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle className="text-lg">Risultati Validazione</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validationResults.map((result, index) => {
                    const hasErrors = result.errors.length > 0;
                    const hasWarnings = result.warnings.length > 0;
                    const StatusIcon = getStatusIcon(hasErrors, hasWarnings);

                    return (
                      <Card key={index} className="card-interactive">
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <StatusIcon className="h-5 w-5" />
                              <div>
                                <h3 className="font-semibold">{result.sheet}</h3>
                                <p className="text-sm text-muted-foreground">{result.rows} righe</p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(hasErrors, hasWarnings)}>
                              {hasErrors ? 'Errori' : hasWarnings ? 'Avvisi' : 'OK'}
                            </Badge>
                          </div>

                          {result.errors.length > 0 && (
                            <div className="space-y-1 mb-2">
                              <p className="text-sm font-medium text-red-700">Errori:</p>
                              {result.errors.map((error, i) => (
                                <p key={i} className="text-xs text-red-600 pl-2">• {error}</p>
                              ))}
                            </div>
                          )}

                          {result.warnings.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-yellow-700">Avvisi:</p>
                              {result.warnings.map((warning, i) => (
                                <p key={i} className="text-xs text-yellow-600 pl-2">• {warning}</p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}

                  <div className="flex justify-center pt-4">
                    <Button 
                      onClick={handleImport}
                      disabled={validationResults.some(r => r.errors.length > 0) || importStatus === 'importing'}
                      className="btn-primary"
                    >
                      {importStatus === 'importing' ? 'Importazione...' : 'Conferma Import'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Esporta Prodotti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esporta tutti i prodotti con dimensioni, materiali e prezzi
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('products', 'xlsx')}
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('products', 'csv')}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Esporta Clienti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esporta anagrafica clienti e listini prezzi
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('customers', 'xlsx')}
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('customers', 'csv')}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Esporta RFQ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esporta richieste di quotazione e offerte
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('rfq', 'xlsx')}
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('rfq', 'csv')}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Esporta Equivalenze
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esporta tutte le equivalenze tra prodotti
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('equivalences', 'xlsx')}
                    >
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleExport('equivalences', 'csv')}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-interactive">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5" />
                    Export Completo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esporta tutti i dati in formato template v3
                  </p>
                  <Button 
                    size="sm" 
                    className="btn-primary w-full"
                    onClick={() => handleExport('complete', 'xlsx')}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Scarica Tutto
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}