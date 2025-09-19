import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Customer {
  id: string;
  name: string;
}

interface NewPriceListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSuccess: () => void;
}

export const NewPriceListDialog = ({ open, onOpenChange, customers, onSuccess }: NewPriceListDialogProps) => {
  const [formData, setFormData] = useState({
    list_name: '',
    customer_id: '',
    currency: 'EUR',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      list_name: '',
      customer_id: '',
      currency: 'EUR',
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.list_name.trim() || !formData.customer_id) {
      toast({
        title: "Errore",
        description: "Nome listino e cliente sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('price_lists')
        .insert([{
          list_name: formData.list_name.trim(),
          customer_id: formData.customer_id,
          currency: formData.currency,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to || null,
          notes: formData.notes || null
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Listino creato con successo"
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('Error creating price list:', error);
      toast({
        title: "Errore",
        description: "Errore durante la creazione del listino",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuovo listino prezzi</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="list_name">Nome listino *</Label>
            <Input
              id="list_name"
              value={formData.list_name}
              onChange={(e) => setFormData(prev => ({ ...prev, list_name: e.target.value }))}
              placeholder="es. Listino 2024 Q1"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="customer_id">Cliente *</Label>
            <Select 
              value={formData.customer_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona cliente" />
              </SelectTrigger>
              <SelectContent>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="currency">Valuta</Label>
              <Select 
                value={formData.currency} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid_from">Valido da</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData(prev => ({ ...prev, valid_from: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valid_to">Valido fino a (opzionale)</Label>
            <Input
              id="valid_to"
              type="date"
              value={formData.valid_to}
              onChange={(e) => setFormData(prev => ({ ...prev, valid_to: e.target.value }))}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Note aggiuntive..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Annulla
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Creazione...' : 'Crea listino'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};