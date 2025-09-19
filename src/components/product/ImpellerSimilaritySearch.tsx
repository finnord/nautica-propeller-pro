import { useState } from 'react';
import { Search, Target, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useImpellers } from '@/hooks/useImpellers';
import { ImpellerSearchCriteria, ImpellerSearchResult } from '@/types';

interface ImpellerSimilaritySearchProps {
  onResultSelect?: (impeller: ImpellerSearchResult) => void;
}

export function ImpellerSimilaritySearch({ onResultSelect }: ImpellerSimilaritySearchProps) {
  const { searchSimilarImpellers } = useImpellers();
  const [searchCriteria, setSearchCriteria] = useState<ImpellerSearchCriteria>({
    outer_diameter_mm: undefined,
    inner_diameter_mm: undefined,
    height_mm: undefined,
    hub_diameter_mm: undefined,
    blade_count: undefined,
    tolerance_od_mm: 5,
    tolerance_id_mm: 3,
    tolerance_height_mm: 3,
    tolerance_hub_mm: 2,
    tolerance_blade_count: 0,
  });
  const [results, setResults] = useState<ImpellerSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTolerances, setShowTolerances] = useState(false);

  const handleInputChange = (field: keyof ImpellerSearchCriteria, value: number | undefined) => {
    setSearchCriteria(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = async () => {
    // Verifica che almeno un criterio di ricerca sia specificato
    const hasSearchCriteria = 
      searchCriteria.outer_diameter_mm ||
      searchCriteria.inner_diameter_mm ||
      searchCriteria.height_mm ||
      searchCriteria.hub_diameter_mm ||
      searchCriteria.blade_count;

    if (!hasSearchCriteria) {
      return;
    }

    setLoading(true);
    try {
      const searchResults = await searchSimilarImpellers(searchCriteria);
      setResults(searchResults);
    } catch (error) {
      console.error('Errore nella ricerca:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Ricerca per Similarità Dimensionale
          </CardTitle>
          <CardDescription>
            Trova giranti simili basandoti su dimensioni specifiche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="outer_diameter">Ø Esterno (mm)</Label>
              <Input
                id="outer_diameter"
                type="number"
                step="0.1"
                value={searchCriteria.outer_diameter_mm || ''}
                onChange={(e) => handleInputChange('outer_diameter_mm', parseFloat(e.target.value) || undefined)}
                placeholder="es. 120.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inner_diameter">Ø Interno (mm)</Label>
              <Input
                id="inner_diameter"
                type="number"
                step="0.1"
                value={searchCriteria.inner_diameter_mm || ''}
                onChange={(e) => handleInputChange('inner_diameter_mm', parseFloat(e.target.value) || undefined)}
                placeholder="es. 30.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altezza (mm)</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                value={searchCriteria.height_mm || ''}
                onChange={(e) => handleInputChange('height_mm', parseFloat(e.target.value) || undefined)}
                placeholder="es. 45.5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hub_diameter">Ø Mozzo (mm)</Label>
              <Input
                id="hub_diameter"
                type="number"
                step="0.1"
                value={searchCriteria.hub_diameter_mm || ''}
                onChange={(e) => handleInputChange('hub_diameter_mm', parseFloat(e.target.value) || undefined)}
                placeholder="es. 25.0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blade_count">N° Alette</Label>
              <Input
                id="blade_count"
                type="number"
                value={searchCriteria.blade_count || ''}
                onChange={(e) => handleInputChange('blade_count', parseInt(e.target.value) || undefined)}
                placeholder="es. 6"
              />
            </div>
          </div>

          <Collapsible open={showTolerances} onOpenChange={setShowTolerances}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Tolleranze {showTolerances ? '▲' : '▼'}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tol_od">Tol. Ø Est. (mm)</Label>
                  <Input
                    id="tol_od"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_od_mm || ''}
                    onChange={(e) => handleInputChange('tolerance_od_mm', parseFloat(e.target.value) || 5)}
                    placeholder="5.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol_id">Tol. Ø Int. (mm)</Label>
                  <Input
                    id="tol_id"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_id_mm || ''}
                    onChange={(e) => handleInputChange('tolerance_id_mm', parseFloat(e.target.value) || 3)}
                    placeholder="3.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol_height">Tol. Altezza (mm)</Label>
                  <Input
                    id="tol_height"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_height_mm || ''}
                    onChange={(e) => handleInputChange('tolerance_height_mm', parseFloat(e.target.value) || 3)}
                    placeholder="3.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol_hub">Tol. Mozzo (mm)</Label>
                  <Input
                    id="tol_hub"
                    type="number"
                    step="0.1"
                    value={searchCriteria.tolerance_hub_mm || ''}
                    onChange={(e) => handleInputChange('tolerance_hub_mm', parseFloat(e.target.value) || 2)}
                    placeholder="2.0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tol_blades">Tol. Alette</Label>
                  <Input
                    id="tol_blades"
                    type="number"
                    value={searchCriteria.tolerance_blade_count || ''}
                    onChange={(e) => handleInputChange('tolerance_blade_count', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Button 
            onClick={handleSearch} 
            disabled={loading}
            className="gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Ricerca in corso...' : 'Cerca Giranti Simili'}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risultati Ricerca ({results.length})</CardTitle>
            <CardDescription>
              Giranti ordinate per similarità dimensionale
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result) => (
                <Card 
                  key={result.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onResultSelect?.(result)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{result.impeller_name}</h4>
                          <Badge 
                            variant="outline" 
                            className={getMatchScoreColor(result.match_score)}
                          >
                            {result.match_score.toFixed(0)}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.internal_code || 'Codice non specificato'}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Ø Esterno:</span>
                            <div className="font-medium">{result.outer_diameter_mm || 'N/A'}mm</div>
                            {result.dimensional_differences?.od_diff_mm !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Δ {result.dimensional_differences.od_diff_mm.toFixed(1)}mm
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ø Interno:</span>
                            <div className="font-medium">{result.inner_diameter_mm || 'N/A'}mm</div>
                            {result.dimensional_differences?.id_diff_mm !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Δ {result.dimensional_differences.id_diff_mm.toFixed(1)}mm
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Altezza:</span>
                            <div className="font-medium">{result.height_mm || 'N/A'}mm</div>
                            {result.dimensional_differences?.height_diff_mm !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Δ {result.dimensional_differences.height_diff_mm.toFixed(1)}mm
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Alette:</span>
                            <div className="font-medium">{result.blade_count || 'N/A'}</div>
                            {result.dimensional_differences?.blade_count_diff !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                Δ {result.dimensional_differences.blade_count_diff}
                              </div>
                            )}
                          </div>
                        </div>
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
  );
}