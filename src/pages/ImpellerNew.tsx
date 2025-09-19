import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/AppLayout';
import { useImpellers } from '@/hooks/useImpellers';
import { useRubberCompounds } from '@/hooks/useRubberCompounds';
import { useBushings } from '@/hooks/useBushings';
import { Impeller } from '@/types';

export default function ImpellerNew() {
  const navigate = useNavigate();
  const { createImpeller } = useImpellers();
  const { compounds } = useRubberCompounds();
  const { bushings } = useBushings();
  
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Impeller>>({
    impeller_name: '',
    internal_code: '',
    product_type: 'impeller',
    status: 'active',
    height_mm: undefined,
    outer_diameter_mm: undefined,
    inner_diameter_mm: undefined,
    hub_diameter_mm: undefined,
    blade_count: undefined,
    blade_thickness_base_mm: undefined,
    rubber_volume_cm3: 0,
    rubber_compound_id: undefined,
    bushing_id: undefined,
    base_cost: 0,
    gross_margin_pct: undefined,
    base_list_price: undefined,
    drawing_link_url: '',
    notes: '',
  });

  const handleInputChange = (field: keyof Impeller, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.impeller_name || !formData.rubber_volume_cm3) {
      return;
    }

    setIsSaving(true);
    try {
      await createImpeller(formData);
      navigate('/products');
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/products')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna ai Prodotti
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nuova Girante</h1>
            <p className="text-muted-foreground">Crea una nuova girante con specifiche dimensionali</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/products')}
            className="gap-2"
          >
            <X className="w-4 h-4" />
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !formData.impeller_name || !formData.rubber_volume_cm3}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informazioni Generali</CardTitle>
            <CardDescription>
              Dati base della girante
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impeller_name">Nome Girante *</Label>
                <Input
                  id="impeller_name"
                  value={formData.impeller_name || ''}
                  onChange={(e) => handleInputChange('impeller_name', e.target.value)}
                  placeholder="es. IMP-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="internal_code">Codice Interno</Label>
                <Input
                  id="internal_code"
                  value={formData.internal_code || ''}
                  onChange={(e) => handleInputChange('internal_code', e.target.value)}
                  placeholder="es. G-12345"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Stato</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Attivo</SelectItem>
                  <SelectItem value="inactive">Inattivo</SelectItem>
                  <SelectItem value="obsolete">Obsoleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Specifiche Dimensionali</CardTitle>
            <CardDescription>
              Dimensioni precise della girante per l'analisi di similarità
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height_mm">Altezza (mm)</Label>
                <Input
                  id="height_mm"
                  type="number"
                  step="0.1"
                  value={formData.height_mm || ''}
                  onChange={(e) => handleInputChange('height_mm', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 45.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outer_diameter_mm">Diametro Esterno (mm)</Label>
                <Input
                  id="outer_diameter_mm"
                  type="number"
                  step="0.1"
                  value={formData.outer_diameter_mm || ''}
                  onChange={(e) => handleInputChange('outer_diameter_mm', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 120.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inner_diameter_mm">Diametro Interno (mm)</Label>
                <Input
                  id="inner_diameter_mm"
                  type="number"
                  step="0.1"
                  value={formData.inner_diameter_mm || ''}
                  onChange={(e) => handleInputChange('inner_diameter_mm', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 30.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hub_diameter_mm">Diametro Mozzo (mm)</Label>
                <Input
                  id="hub_diameter_mm"
                  type="number"
                  step="0.1"
                  value={formData.hub_diameter_mm || ''}
                  onChange={(e) => handleInputChange('hub_diameter_mm', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 25.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blade_count">Numero Alette</Label>
                <Input
                  id="blade_count"
                  type="number"
                  value={formData.blade_count || ''}
                  onChange={(e) => handleInputChange('blade_count', parseInt(e.target.value) || undefined)}
                  placeholder="es. 6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="blade_thickness_base_mm">Spessore Alette Base (mm)</Label>
                <Input
                  id="blade_thickness_base_mm"
                  type="number"
                  step="0.1"
                  value={formData.blade_thickness_base_mm || ''}
                  onChange={(e) => handleInputChange('blade_thickness_base_mm', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 3.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Materiali e Volume</CardTitle>
            <CardDescription>
              Selezione mescola gomma, bussola e volume
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rubber_volume_cm3">Volume Gomma (cm³) *</Label>
                <Input
                  id="rubber_volume_cm3"
                  type="number"
                  step="0.1"
                  value={formData.rubber_volume_cm3 || ''}
                  onChange={(e) => handleInputChange('rubber_volume_cm3', parseFloat(e.target.value) || 0)}
                  placeholder="es. 125.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rubber_compound_id">Mescola Gomma</Label>
                <Select
                  value={formData.rubber_compound_id || ''}
                  onValueChange={(value) => handleInputChange('rubber_compound_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona mescola" />
                  </SelectTrigger>
                  <SelectContent>
                    {compounds.map((compound) => (
                      <SelectItem key={compound.id} value={compound.id}>
                        {compound.compound_code} - {compound.compound_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bushing_id">Bussola</Label>
                <Select
                  value={formData.bushing_id || ''}
                  onValueChange={(value) => handleInputChange('bushing_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona bussola" />
                  </SelectTrigger>
                  <SelectContent>
                    {bushings.map((bushing) => (
                      <SelectItem key={bushing.id} value={bushing.id}>
                        {bushing.bushing_code} - {bushing.material}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Costi e Pricing</CardTitle>
            <CardDescription>
              Informazioni sui costi industriali e margini
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_cost">Costo Base (€)</Label>
                <Input
                  id="base_cost"
                  type="number"
                  step="0.01"
                  value={formData.base_cost || ''}
                  onChange={(e) => handleInputChange('base_cost', parseFloat(e.target.value) || 0)}
                  placeholder="es. 125.50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gross_margin_pct">Margine Lordo (%)</Label>
                <Input
                  id="gross_margin_pct"
                  type="number"
                  step="0.1"
                  value={formData.gross_margin_pct || ''}
                  onChange={(e) => handleInputChange('gross_margin_pct', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 35.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base_list_price">Prezzo Listino Base (€)</Label>
                <Input
                  id="base_list_price"
                  type="number"
                  step="0.01"
                  value={formData.base_list_price || ''}
                  onChange={(e) => handleInputChange('base_list_price', parseFloat(e.target.value) || undefined)}
                  placeholder="es. 195.75"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dettagli Aggiuntivi</CardTitle>
            <CardDescription>
              Link disegni e note
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drawing_link_url">Link Disegno</Label>
              <Input
                id="drawing_link_url"
                type="url"
                value={formData.drawing_link_url || ''}
                onChange={(e) => handleInputChange('drawing_link_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Note tecniche o osservazioni..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}