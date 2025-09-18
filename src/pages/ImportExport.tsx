import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

type ImportStatus = 'idle' | 'uploading' | 'validating' | 'importing' | 'completed' | 'error';
type ValidationResult = {
  sheet: string;
  rows: number;
  errors: string[];
  warnings: string[];
};

export default function ImportExport() {
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importProgress, setImportProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);

  const mockValidationResults: ValidationResult[] = [
    {
      sheet: 'Products',
      rows: 45,
      errors: [],
      warnings: ['Riga 12: material_price_per_kg mancante per mescola NBR-85']
    },
    {
      sheet: 'ImpellerDims',
      rows: 32,
      errors: ['Riga 8: rubber_volume_cm3 obbligatorio mancante'],
      warnings: ['Riga 15: bushing_code non trovato']
    },
    {
      sheet: 'Customers',
      rows: 12,
      errors: [],
      warnings: []
    }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('uploading');
    setImportProgress(10);

    // Simulate upload and validation
    setTimeout(() => {
      setImportStatus('validating');
      setImportProgress(40);
      
      setTimeout(() => {
        setValidationResults(mockValidationResults);
        setImportStatus('completed');
        setImportProgress(100);
      }, 2000);
    }, 1000);
  };

  const handleImport = () => {
    setImportStatus('importing');
    setImportProgress(0);

    // Simulate import process
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setImportStatus('completed');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
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
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Scarica Template v3
                  </Button>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
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
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
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
                    <Button size="sm" variant="outline">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline">
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
                    <Button size="sm" variant="outline">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline">
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
                    <Button size="sm" variant="outline">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline">
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
                    <Button size="sm" variant="outline">
                      <FileSpreadsheet className="h-3 w-3 mr-1" />
                      Excel
                    </Button>
                    <Button size="sm" variant="outline">
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
                  <Button size="sm" className="btn-primary w-full">
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