import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Save,
  Package
} from 'lucide-react';
import { Product, ProductType, UnitOfMeasure } from '@/types';

export default function ProductNew() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Partial<Product>>({
    product_type: 'impeller',
    uom: 'pcs',
    gross_margin_pct: 35
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      navigate('/products');
    }, 1000);
  };

  const handleInputChange = (field: keyof Product, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculate list price from cost and margin
  const calculateListPrice = () => {
    if (formData.base_cost && formData.gross_margin_pct) {
      const margin = formData.gross_margin_pct / 100;
      const listPrice = formData.base_cost / (1 - margin);
      setFormData(prev => ({ ...prev, base_list_price: listPrice }));
    }
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
              onClick={() => navigate('/products')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">Nuovo Prodotto</h1>
              <p className="text-body">Crea un nuovo prodotto</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/products')}
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

        {/* Create Form */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informazioni Prodotto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="product_id">Codice Prodotto *</Label>
                <Input
                  id="product_id"
                  value={formData.product_id || ''}
                  onChange={(e) => handleInputChange('product_id', e.target.value)}
                  className="input-business"
                  placeholder="G-1234"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="product_type">Tipo Prodotto *</Label>
                <Select 
                  value={formData.product_type} 
                  onValueChange={(value: ProductType) => handleInputChange('product_type', value)}
                >
                  <SelectTrigger className="input-business">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="impeller">Girante</SelectItem>
                    <SelectItem value="bushing">Bussola</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="generic">Generico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Prodotto *</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input-business"
                  placeholder="Girante Standard 85mm"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="internal_code">Codice Interno</Label>
                <Input
                  id="internal_code"
                  value={formData.internal_code || ''}
                  onChange={(e) => handleInputChange('internal_code', e.target.value)}
                  className="input-business"
                  placeholder="GS-085-NBR"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="uom">Unità di Misura *</Label>
                <Select 
                  value={formData.uom} 
                  onValueChange={(value: UnitOfMeasure) => handleInputChange('uom', value)}
                >
                  <SelectTrigger className="input-business">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pcs">Pezzi (pcs)</SelectItem>
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="kg">Chilogrammi (kg)</SelectItem>
                    <SelectItem value="m">Metri (m)</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="drawing_link_url">Link Disegno</Label>
                <Input
                  id="drawing_link_url"
                  type="url"
                  value={formData.drawing_link_url || ''}
                  onChange={(e) => handleInputChange('drawing_link_url', e.target.value)}
                  className="input-business"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base_cost">Costo Base (€) *</Label>
                  <Input
                    id="base_cost"
                    type="number"
                    step="0.01"
                    value={formData.base_cost || ''}
                    onChange={(e) => handleInputChange('base_cost', parseFloat(e.target.value) || 0)}
                    className="input-business"
                    placeholder="45.80"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gross_margin_pct">Margine Lordo (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="gross_margin_pct"
                      type="number"
                      step="0.1"
                      value={formData.gross_margin_pct || ''}
                      onChange={(e) => handleInputChange('gross_margin_pct', parseFloat(e.target.value) || 0)}
                      className="input-business"
                      placeholder="35"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={calculateListPrice}
                    >
                      Calcola
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="base_list_price">Prezzo Lista Base (€)</Label>
                  <Input
                    id="base_list_price"
                    type="number"
                    step="0.01"
                    value={formData.base_list_price || ''}
                    onChange={(e) => handleInputChange('base_list_price', parseFloat(e.target.value) || 0)}
                    className="input-business"
                  />
                </div>
              </div>
            </div>

            {/* Components Section */}
            {(formData.product_type === 'impeller' || formData.product_type === 'kit') && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Componenti</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="rubber_mix">Mescola Gomma</Label>
                    <Select>
                      <SelectTrigger className="input-business">
                        <SelectValue placeholder="Seleziona mescola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NBR-85">NBR-85 (Nero Standard)</SelectItem>
                        <SelectItem value="EPDM-70">EPDM-70 (Bianco Marine)</SelectItem>
                        <SelectItem value="CR-75">CR-75 (Nero Resistente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bushing_code">Codice Bussola</Label>
                    <Select>
                      <SelectTrigger className="input-business">
                        <SelectValue placeholder="Seleziona bussola" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BO-012">BO-012 (Ottone 12mm)</SelectItem>
                        <SelectItem value="BO-015">BO-015 (Ottone 15mm)</SelectItem>
                        <SelectItem value="BP-012">BP-012 (Plastica 12mm)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="rubber_volume">Volume Gomma (cm³) *</Label>
                    <Input
                      id="rubber_volume"
                      type="number"
                      step="0.1"
                      placeholder="45.5"
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="blade_count">Numero Pale</Label>
                    <Input
                      id="blade_count"
                      type="number"
                      placeholder="6"
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="shaft_profile">Profilo Albero</Label>
                    <Select>
                      <SelectTrigger className="input-business">
                        <SelectValue placeholder="Tipo profilo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">Tondo</SelectItem>
                        <SelectItem value="d-shaft">D-Shaft</SelectItem>
                        <SelectItem value="spline">Scanalato</SelectItem>
                        <SelectItem value="cone">Conico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="border-t pt-6">
              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  className="input-business min-h-[100px]"
                  placeholder="Note aggiuntive sul prodotto..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}