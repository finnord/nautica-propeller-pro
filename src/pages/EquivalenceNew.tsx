import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Save,
  Ship,
  Circle
} from 'lucide-react';
import { MatchType } from '@/types';

export default function EquivalenceNew() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('impellers');
  const [isSaving, setIsSaving] = useState(false);

  // Impeller equivalence form
  const [impellerData, setImpellerData] = useState({
    source_product_id: '',
    target_product_id: '',
    match_type: 'dimensional' as MatchType,
    dimension_tolerance_mm: 0,
    material_note: '',
    bushing_note: '',
    shaft_profile_note: '',
    general_note: ''
  });

  // Bushing equivalence form
  const [bushingData, setBushingData] = useState({
    source_bushing_code: '',
    target_bushing_code: '',
    match_type: 'form-fit' as MatchType,
    shaft_profile_compatible: 'yes' as 'yes' | 'no' | 'unknown',
    material_note: '',
    general_note: ''
  });

  const handleSave = async () => {
    setIsSaving(true);
    
    const dataToSave = selectedTab === 'impellers' ? impellerData : bushingData;
    console.log('Saving equivalence:', dataToSave);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      navigate('/equivalences');
    }, 1000);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/equivalences')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">Nuova Equivalenza</h1>
              <p className="text-body">Crea una nuova equivalenza tra prodotti</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/equivalences')}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>

        {/* Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Informazioni Equivalenza</CardTitle>
          </CardHeader>
          <CardContent>
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

              <TabsContent value="impellers" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="source_product_id">Prodotto Sorgente *</Label>
                    <Input
                      id="source_product_id"
                      value={impellerData.source_product_id}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, source_product_id: e.target.value }))}
                      placeholder="G-2847"
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_product_id">Prodotto Target *</Label>
                    <Input
                      id="target_product_id"
                      value={impellerData.target_product_id}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, target_product_id: e.target.value }))}
                      placeholder="G-2901"
                      className="input-business"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="match_type">Tipo Equivalenza *</Label>
                    <Select 
                      value={impellerData.match_type} 
                      onValueChange={(value: MatchType) => setImpellerData(prev => ({ ...prev, match_type: value }))}
                    >
                      <SelectTrigger className="input-business">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Completa</SelectItem>
                        <SelectItem value="dimensional">Dimensionale</SelectItem>
                        <SelectItem value="form-fit">Forma/Funzione</SelectItem>
                        <SelectItem value="partial">Parziale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dimension_tolerance_mm">Tolleranza Dimensionale (mm)</Label>
                    <Input
                      id="dimension_tolerance_mm"
                      type="number"
                      step="0.1"
                      value={impellerData.dimension_tolerance_mm || ''}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, dimension_tolerance_mm: parseFloat(e.target.value) || 0 }))}
                      className="input-business"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="material_note">Note Materiale</Label>
                    <Textarea
                      id="material_note"
                      value={impellerData.material_note}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, material_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bushing_note">Note Bussola</Label>
                    <Textarea
                      id="bushing_note"
                      value={impellerData.bushing_note}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, bushing_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="shaft_profile_note">Note Profilo Albero</Label>
                    <Textarea
                      id="shaft_profile_note"
                      value={impellerData.shaft_profile_note}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, shaft_profile_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="general_note">Note Generali</Label>
                    <Textarea
                      id="general_note"
                      value={impellerData.general_note}
                      onChange={(e) => setImpellerData(prev => ({ ...prev, general_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bushings" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="source_bushing_code">Codice Bussola Sorgente *</Label>
                    <Input
                      id="source_bushing_code"
                      value={bushingData.source_bushing_code}
                      onChange={(e) => setBushingData(prev => ({ ...prev, source_bushing_code: e.target.value }))}
                      placeholder="BO-012"
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target_bushing_code">Codice Bussola Target *</Label>
                    <Input
                      id="target_bushing_code"
                      value={bushingData.target_bushing_code}
                      onChange={(e) => setBushingData(prev => ({ ...prev, target_bushing_code: e.target.value }))}
                      placeholder="BP-012"
                      className="input-business"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="match_type_bushing">Tipo Equivalenza *</Label>
                    <Select 
                      value={bushingData.match_type} 
                      onValueChange={(value: MatchType) => setBushingData(prev => ({ ...prev, match_type: value }))}
                    >
                      <SelectTrigger className="input-business">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Completa</SelectItem>
                        <SelectItem value="dimensional">Dimensionale</SelectItem>
                        <SelectItem value="form-fit">Forma/Funzione</SelectItem>
                        <SelectItem value="partial">Parziale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shaft_profile_compatible">Compatibilità Profilo</Label>
                    <Select 
                      value={bushingData.shaft_profile_compatible} 
                      onValueChange={(value: 'yes' | 'no' | 'unknown') => setBushingData(prev => ({ ...prev, shaft_profile_compatible: value }))}
                    >
                      <SelectTrigger className="input-business">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yes">Compatibile</SelectItem>
                        <SelectItem value="no">Non Compatibile</SelectItem>
                        <SelectItem value="unknown">Sconosciuto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="material_note_bushing">Note Materiale</Label>
                    <Textarea
                      id="material_note_bushing"
                      value={bushingData.material_note}
                      onChange={(e) => setBushingData(prev => ({ ...prev, material_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="general_note_bushing">Note Generali</Label>
                    <Textarea
                      id="general_note_bushing"
                      value={bushingData.general_note}
                      onChange={(e) => setBushingData(prev => ({ ...prev, general_note: e.target.value }))}
                      className="input-business"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}