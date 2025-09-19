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
import { ProductType, UnitOfMeasure } from '@/types';
import { useProducts } from '@/hooks/useProducts';

export default function ProductNew() {
  const navigate = useNavigate();
  const { createProduct } = useProducts();
  
  const [formData, setFormData] = useState({
    model: '',
    description: '',
    diameter: 0,
    pitch: 0,
    blades: 3,
    material_type: '',
    base_cost: 0,
    status: 'active'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!formData.model.trim()) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      await createProduct(formData);
      navigate('/products');
    } catch (error) {
      console.error('Error creating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
                <Label htmlFor="model">Modello Prodotto *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                  className="input-business"
                  placeholder="G-1234"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="material_type">Tipo Materiale</Label>
                <Input
                  id="material_type"
                  value={formData.material_type}
                  onChange={(e) => handleInputChange('material_type', e.target.value)}
                  className="input-business"
                  placeholder="Bronze, Stainless Steel, ecc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="input-business"
                placeholder="Descrizione del prodotto..."
              />
            </div>

            {/* Specifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Specifiche Tecniche</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="diameter">Diametro (mm)</Label>
                  <Input
                    id="diameter"
                    type="number"
                    step="0.1"
                    value={formData.diameter || ''}
                    onChange={(e) => handleInputChange('diameter', parseFloat(e.target.value) || 0)}
                    className="input-business"
                    placeholder="85"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pitch">Passo (mm)</Label>
                  <Input
                    id="pitch"
                    type="number"
                    step="0.1"
                    value={formData.pitch || ''}
                    onChange={(e) => handleInputChange('pitch', parseFloat(e.target.value) || 0)}
                    className="input-business"
                    placeholder="75"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="blades">Numero Pale</Label>
                  <Input
                    id="blades"
                    type="number"
                    value={formData.blades || ''}
                    onChange={(e) => handleInputChange('blades', parseInt(e.target.value) || 3)}
                    className="input-business"
                    placeholder="3"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="base_cost">Costo Base (€)</Label>
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
                  <Label htmlFor="status">Stato</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="input-business">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Attivo</SelectItem>
                      <SelectItem value="inactive">Inattivo</SelectItem>
                      <SelectItem value="discontinued">Dismesso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}