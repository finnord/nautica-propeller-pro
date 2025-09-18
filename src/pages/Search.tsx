import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  Search as SearchIcon, 
  Settings, 
  Ship, 
  Eye,
  ArrowLeftRight,
  Target
} from 'lucide-react';
import { ImpellerSearchCriteria, ImpellerSearchResult } from '@/types';

// Mock search results
const mockSearchResults: ImpellerSearchResult[] = [
  {
    product_id: 'G-2847',
    product_type: 'impeller',
    name: 'Girante Standard 85mm',
    internal_code: 'GS-085-NBR',
    uom: 'pcs',
    base_cost: 45.80,
    gross_margin_pct: 35,
    base_list_price: 70.46,
    drawing_link_url: 'https://drawings.company.com/G-2847.pdf',
    notes: 'Girante standard per pompe centrifughe marine',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:22:00Z',
    dimensional_match: {
      od_diff_mm: 0.5,
      id_diff_mm: -0.2,
      height_diff_mm: 0.1,
      hub_diff_mm: 0.0,
      blade_count_diff: 0
    },
    match_score: 95
  },
  {
    product_id: 'G-2901',
    product_type: 'impeller',
    name: 'Girante Rinforzata 84mm',
    internal_code: 'GR-084-EPDM',
    uom: 'pcs',
    base_cost: 52.30,
    gross_margin_pct: 32,
    base_list_price: 76.91,
    notes: 'Girante rinforzata per applicazioni marine pesanti',
    created_at: '2024-01-12T11:20:00Z',
    updated_at: '2024-01-19T15:35:00Z',
    dimensional_match: {
      od_diff_mm: -0.8,
      id_diff_mm: 0.3,
      height_diff_mm: -0.4,
      hub_diff_mm: 0.1,
      blade_count_diff: 0
    },
    match_score: 87
  }
];

export default function Search() {
  const [searchCriteria, setSearchCriteria] = useState<ImpellerSearchCriteria>({
    outer_diameter_mm: undefined,
    inner_diameter_mm: undefined,
    height_mm: undefined,
    hub_diameter_mm: undefined,
    blade_count: undefined,
    tolerance_od_mm: 1.0,
    tolerance_id_mm: 0.5,
    tolerance_height_mm: 0.5,
    tolerance_hub_mm: 0.3,
    tolerance_blade_count: 1
  });
  
  const [searchResults, setSearchResults] = useState<ImpellerSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setSearchResults(mockSearchResults);
      setIsSearching(false);
    }, 1000);
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-500/10 text-green-700 border-green-200';
    if (score >= 75) return 'bg-yellow-500/10 text-yellow-700 border-yellow-200';
    return 'bg-red-500/10 text-red-700 border-red-200';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-heading">Trova Girante</h1>
            <p className="text-body">Ricerca giranti per dimensioni con tolleranze</p>
          </div>
        </div>

        {/* Search Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Criteri di Ricerca
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Dimensions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="od">Diametro Esterno (mm)</Label>
                <Input
                  id="od"
                  type="number"
                  placeholder="85.0"
                  value={searchCriteria.outer_diameter_mm || ''}
                  onChange={(e) => setSearchCriteria(prev => ({
                    ...prev,
                    outer_diameter_mm: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="input-business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="id">Diametro Interno (mm)</Label>
                <Input
                  id="id"
                  type="number"
                  placeholder="12.0"
                  value={searchCriteria.inner_diameter_mm || ''}
                  onChange={(e) => setSearchCriteria(prev => ({
                    ...prev,
                    inner_diameter_mm: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="input-business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altezza (mm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="25.0"
                  value={searchCriteria.height_mm || ''}
                  onChange={(e) => setSearchCriteria(prev => ({
                    ...prev,
                    height_mm: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="input-business"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hub">Diametro Hub (mm)</Label>
                <Input
                  id="hub"
                  type="number"
                  placeholder="20.0"
                  value={searchCriteria.hub_diameter_mm || ''}
                  onChange={(e) => setSearchCriteria(prev => ({
                    ...prev,
                    hub_diameter_mm: e.target.value ? parseFloat(e.target.value) : undefined
                  }))}
                  className="input-business"
                />
              </div>
            </div>

            {/* Additional Criteria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blades">Numero Pale</Label>
                <Input
                  id="blades"
                  type="number"
                  placeholder="6"
                  value={searchCriteria.blade_count || ''}
                  onChange={(e) => setSearchCriteria(prev => ({
                    ...prev,
                    blade_count: e.target.value ? parseInt(e.target.value) : undefined
                  }))}
                  className="input-business"
                />
              </div>
            </div>

            {/* Tolerances */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Tolleranze
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tol-od">Toll. Ø Est. (±mm)</Label>
                  <Input
                    id="tol-od"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_od_mm || ''}
                    onChange={(e) => setSearchCriteria(prev => ({
                      ...prev,
                      tolerance_od_mm: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="input-business"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol-id">Toll. Ø Int. (±mm)</Label>
                  <Input
                    id="tol-id"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_id_mm || ''}
                    onChange={(e) => setSearchCriteria(prev => ({
                      ...prev,
                      tolerance_id_mm: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="input-business"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol-height">Toll. Altezza (±mm)</Label>
                  <Input
                    id="tol-height"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_height_mm || ''}
                    onChange={(e) => setSearchCriteria(prev => ({
                      ...prev,
                      tolerance_height_mm: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="input-business"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol-hub">Toll. Hub (±mm)</Label>
                  <Input
                    id="tol-hub"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_hub_mm || ''}
                    onChange={(e) => setSearchCriteria(prev => ({
                      ...prev,
                      tolerance_hub_mm: e.target.value ? parseFloat(e.target.value) : undefined
                    }))}
                    className="input-business"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol-blades">Toll. Pale (±n)</Label>
                  <Input
                    id="tol-blades"
                    type="number"
                    value={searchCriteria.tolerance_blade_count || ''}
                    onChange={(e) => setSearchCriteria(prev => ({
                      ...prev,
                      tolerance_blade_count: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="input-business"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleSearch}
                disabled={isSearching}
                className="btn-primary"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                {isSearching ? 'Ricerca in corso...' : 'Cerca Giranti'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-lg">Risultati Ricerca</CardTitle>
              <p className="text-sm text-muted-foreground">
                Trovate {searchResults.length} girante{searchResults.length !== 1 ? 'i' : ''} corrispondente{searchResults.length !== 1 ? 'i' : ''}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((result) => (
                  <Card key={result.product_id} className="card-interactive">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="space-y-1">
                          <h3 className="font-semibold">{result.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge className={getMatchScoreColor(result.match_score)}>
                              Match: {result.match_score}%
                            </Badge>
                            <span className="text-sm font-mono text-muted-foreground">
                              {result.product_id}
                            </span>
                          </div>
                        </div>
                        <Ship className="h-5 w-5 text-muted-foreground" />
                      </div>

                      {/* Dimensional Differences */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 text-xs">
                        {result.dimensional_match.od_diff_mm !== undefined && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Diff. Ø Est.</p>
                            <p className={`font-mono ${Math.abs(result.dimensional_match.od_diff_mm) <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.dimensional_match.od_diff_mm > 0 ? '+' : ''}{result.dimensional_match.od_diff_mm}mm
                            </p>
                          </div>
                        )}
                        {result.dimensional_match.id_diff_mm !== undefined && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Diff. Ø Int.</p>
                            <p className={`font-mono ${Math.abs(result.dimensional_match.id_diff_mm) <= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.dimensional_match.id_diff_mm > 0 ? '+' : ''}{result.dimensional_match.id_diff_mm}mm
                            </p>
                          </div>
                        )}
                        {result.dimensional_match.height_diff_mm !== undefined && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Diff. Altezza</p>
                            <p className={`font-mono ${Math.abs(result.dimensional_match.height_diff_mm) <= 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.dimensional_match.height_diff_mm > 0 ? '+' : ''}{result.dimensional_match.height_diff_mm}mm
                            </p>
                          </div>
                        )}
                        {result.dimensional_match.hub_diff_mm !== undefined && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Diff. Hub</p>
                            <p className={`font-mono ${Math.abs(result.dimensional_match.hub_diff_mm) <= 0.3 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.dimensional_match.hub_diff_mm > 0 ? '+' : ''}{result.dimensional_match.hub_diff_mm}mm
                            </p>
                          </div>
                        )}
                        {result.dimensional_match.blade_count_diff !== undefined && (
                          <div className="text-center">
                            <p className="text-muted-foreground">Diff. Pale</p>
                            <p className={`font-mono ${Math.abs(result.dimensional_match.blade_count_diff) <= 1 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.dimensional_match.blade_count_diff > 0 ? '+' : ''}{result.dimensional_match.blade_count_diff}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <div className="text-sm text-muted-foreground">
                          Prezzo Lista: <span className="font-semibold">€{result.base_list_price?.toFixed(2) || 'N/D'}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Dettagli
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowLeftRight className="h-3 w-3 mr-1" />
                            Equivalenza
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}