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
  FileText,
  Plus,
  Trash2
} from 'lucide-react';
import { RFQStatus } from '@/types';

interface RFQLine {
  id: string;
  product_id: string;
  quantity: number;
  notes?: string;
}

export default function RFQNew() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);

  const [rfqData, setRfqData] = useState({
    customer_id: '',
    rfq_date: new Date().toISOString().split('T')[0],
    status: 'open' as RFQStatus,
    notes: ''
  });

  const [rfqLines, setRfqLines] = useState<RFQLine[]>([
    { id: '1', product_id: '', quantity: 1, notes: '' }
  ]);

  const addLine = () => {
    const newLine: RFQLine = {
      id: Date.now().toString(),
      product_id: '',
      quantity: 1,
      notes: ''
    };
    setRfqLines([...rfqLines, newLine]);
  };

  const removeLine = (id: string) => {
    setRfqLines(rfqLines.filter(line => line.id !== id));
  };

  const updateLine = (id: string, field: keyof RFQLine, value: any) => {
    setRfqLines(rfqLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const fullData = {
      ...rfqData,
      lines: rfqLines.filter(line => line.product_id.trim() !== '')
    };
    console.log('Saving RFQ:', fullData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      navigate('/rfq');
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
              onClick={() => navigate('/rfq')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">Nuova RFQ</h1>
              <p className="text-body">Crea una nuova richiesta di quotazione</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/rfq')}
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

        {/* RFQ Header Info */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informazioni RFQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="customer_id">Cliente *</Label>
                <Input
                  id="customer_id"
                  value={rfqData.customer_id}
                  onChange={(e) => setRfqData(prev => ({ ...prev, customer_id: e.target.value }))}
                  placeholder="C-001"
                  className="input-business"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rfq_date">Data RFQ *</Label>
                <Input
                  id="rfq_date"
                  type="date"
                  value={rfqData.rfq_date}
                  onChange={(e) => setRfqData(prev => ({ ...prev, rfq_date: e.target.value }))}
                  className="input-business"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Stato</Label>
                <Select 
                  value={rfqData.status} 
                  onValueChange={(value: RFQStatus) => setRfqData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="input-business">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aperto</SelectItem>
                    <SelectItem value="quoted">Quotato</SelectItem>
                    <SelectItem value="won">Vinto</SelectItem>
                    <SelectItem value="lost">Perso</SelectItem>
                    <SelectItem value="on_hold">In Sospeso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={rfqData.notes}
                onChange={(e) => setRfqData(prev => ({ ...prev, notes: e.target.value }))}
                className="input-business min-h-[100px]"
                placeholder="Note sulla richiesta..."
              />
            </div>
          </CardContent>
        </Card>

        {/* RFQ Lines */}
        <Card className="card-elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Righe RFQ</CardTitle>
              <Button onClick={addLine} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Aggiungi Riga
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rfqLines.map((line, index) => (
              <div key={line.id} className="p-4 border border-border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Riga {index + 1}</h4>
                  {rfqLines.length > 1 && (
                    <Button 
                      onClick={() => removeLine(line.id)}
                      size="sm" 
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`product_id_${line.id}`}>Codice Prodotto *</Label>
                    <Input
                      id={`product_id_${line.id}`}
                      value={line.product_id}
                      onChange={(e) => updateLine(line.id, 'product_id', e.target.value)}
                      placeholder="G-2847"
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`quantity_${line.id}`}>Quantità *</Label>
                    <Input
                      id={`quantity_${line.id}`}
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => updateLine(line.id, 'quantity', parseInt(e.target.value) || 1)}
                      className="input-business"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`notes_${line.id}`}>Note Riga</Label>
                    <Input
                      id={`notes_${line.id}`}
                      value={line.notes || ''}
                      onChange={(e) => updateLine(line.id, 'notes', e.target.value)}
                      placeholder="Note specifiche..."
                      className="input-business"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}