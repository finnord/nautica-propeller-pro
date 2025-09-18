import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  ArrowLeftRight, 
  Eye,
  Edit,
  Ship,
  Circle
} from 'lucide-react';
import { EquivalentImpeller, EquivalentBushing, MatchType } from '@/types';

// Mock data for demonstration
const mockImpellerEquivalences: EquivalentImpeller[] = [
  {
    source_product_id: 'G-2847',
    target_product_id: 'G-2901',
    match_type: 'dimensional',
    dimension_tolerance_mm: 1.0,
    material_note: 'Compatibile EPDM/NBR',
    bushing_note: 'Stesso profilo albero',
    shaft_profile_note: 'D-shaft 12mm',
    general_note: 'Sostituzione diretta per applicazioni marine standard'
  },
  {
    source_product_id: 'G-1234',
    target_product_id: 'G-5678',
    match_type: 'full',
    dimension_tolerance_mm: 0.1,
    general_note: 'Equivalenza completa, stesso codice di ricambio'
  }
];

const mockBushingEquivalences: EquivalentBushing[] = [
  {
    source_bushing_code: 'BO-012',
    target_bushing_code: 'BP-012',
    match_type: 'form-fit',
    shaft_profile_compatible: 'yes',
    material_note: 'Ottone vs Plastica - prestazioni simili',
    general_note: 'Alternativa economica per applicazioni meno critiche'
  }
];

const getMatchTypeColor = (type: MatchType) => {
  switch (type) {
    case 'full':
      return 'bg-green-500/10 text-green-700 border-green-200';
    case 'dimensional':
      return 'bg-blue-500/10 text-blue-700 border-blue-200';
    case 'form-fit':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    case 'partial':
      return 'bg-red-500/10 text-red-700 border-red-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

const getMatchTypeLabel = (type: MatchType) => {
  switch (type) {
    case 'full':
      return 'Completa';
    case 'dimensional':
      return 'Dimensionale';
    case 'form-fit':
      return 'Forma/Funzione';
    case 'partial':
      return 'Parziale';
    default:
      return type;
  }
};

export default function Equivalences() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('impellers');

  const filteredImpellerEquivalences = mockImpellerEquivalences.filter(eq =>
    eq.source_product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.target_product_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.general_note?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const filteredBushingEquivalences = mockBushingEquivalences.filter(eq =>
    eq.source_bushing_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    eq.target_bushing_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (eq.general_note?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Gestione Equivalenze</h1>
            <p className="text-body">Equivalenze tra giranti e bussole per sostituzioni</p>
          </div>
          <Button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Equivalenza
          </Button>
        </div>

        {/* Search */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Ricerca Equivalenze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cerca per codice prodotto, bussola o note..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-business"
              />
            </div>
          </CardContent>
        </Card>

        {/* Equivalences Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="impellers" className="flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Giranti
            </TabsTrigger>
            <TabsTrigger value="bushings" className="flex items-center gap-2">
              <Circle className="h-4 w-4" />
              Bussole
            </TabsTrigger>
          </TabsList>

          <TabsContent value="impellers" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredImpellerEquivalences.map((eq, index) => (
                <Card key={index} className="card-interactive">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Sorgente</p>
                          <p className="font-mono font-semibold">{eq.source_product_id}</p>
                        </div>
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Target</p>
                          <p className="font-mono font-semibold">{eq.target_product_id}</p>
                        </div>
                      </div>
                      <Badge className={getMatchTypeColor(eq.match_type)}>
                        {getMatchTypeLabel(eq.match_type)}
                      </Badge>
                    </div>

                    {eq.dimension_tolerance_mm && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground">Tolleranza Dimensionale</p>
                        <p className="text-sm font-semibold">±{eq.dimension_tolerance_mm}mm</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      {eq.material_note && (
                        <div>
                          <p className="text-muted-foreground">Note Materiale</p>
                          <p className="text-xs leading-relaxed">{eq.material_note}</p>
                        </div>
                      )}
                      {eq.bushing_note && (
                        <div>
                          <p className="text-muted-foreground">Note Bussola</p>
                          <p className="text-xs leading-relaxed">{eq.bushing_note}</p>
                        </div>
                      )}
                      {eq.shaft_profile_note && (
                        <div>
                          <p className="text-muted-foreground">Profilo Albero</p>
                          <p className="text-xs leading-relaxed">{eq.shaft_profile_note}</p>
                        </div>
                      )}
                    </div>

                    {eq.general_note && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Note Generali</p>
                        <p className="text-xs leading-relaxed">{eq.general_note}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Dettagli
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifica
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredImpellerEquivalences.length === 0 && (
              <Card className="card-elevated">
                <CardContent className="text-center py-12">
                  <Ship className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nessuna equivalenza trovata</h3>
                  <p className="text-muted-foreground mb-4">
                    Prova a modificare i criteri di ricerca o aggiungi una nuova equivalenza.
                  </p>
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Equivalenza Girante
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="bushings" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {filteredBushingEquivalences.map((eq, index) => (
                <Card key={index} className="card-interactive">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Sorgente</p>
                          <p className="font-mono font-semibold">{eq.source_bushing_code}</p>
                        </div>
                        <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Target</p>
                          <p className="font-mono font-semibold">{eq.target_bushing_code}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getMatchTypeColor(eq.match_type)}>
                          {getMatchTypeLabel(eq.match_type)}
                        </Badge>
                        <Badge variant={eq.shaft_profile_compatible === 'yes' ? 'default' : 'destructive'}>
                          Profilo: {eq.shaft_profile_compatible === 'yes' ? 'Compatibile' : 
                                   eq.shaft_profile_compatible === 'no' ? 'Non Compatibile' : 'Sconosciuto'}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      {eq.material_note && (
                        <div>
                          <p className="text-muted-foreground">Note Materiale</p>
                          <p className="text-xs leading-relaxed">{eq.material_note}</p>
                        </div>
                      )}
                    </div>

                    {eq.general_note && (
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground">Note Generali</p>
                        <p className="text-xs leading-relaxed">{eq.general_note}</p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t border-border">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        Dettagli
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifica
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredBushingEquivalences.length === 0 && (
              <Card className="card-elevated">
                <CardContent className="text-center py-12">
                  <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nessuna equivalenza trovata</h3>
                  <p className="text-muted-foreground mb-4">
                    Prova a modificare i criteri di ricerca o aggiungi una nuova equivalenza.
                  </p>
                  <Button className="btn-primary">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuova Equivalenza Bussola
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}