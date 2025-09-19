import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

const customerSchema = z.object({
  name: z.string().min(1, 'Nome cliente obbligatorio'),
  website: z.string().url('URL non valido').optional().or(z.literal('')),
  vat_number: z.string().optional(),
  annual_revenue_eur: z.number().min(0, 'Il fatturato deve essere positivo').optional(),
  notes: z.string().optional()
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface NewCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerCreated?: () => void;
}

export const NewCustomerDialog = ({ open, onOpenChange, onCustomerCreated }: NewCustomerDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      website: '',
      vat_number: '',
      annual_revenue_eur: undefined,
      notes: ''
    }
  });

  const [contacts, setContacts] = useState([{ name: '', email: '', phone: '' }]);

  const addContact = () => {
    setContacts([...contacts, { name: '', email: '', phone: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(contacts.filter((_, i) => i !== index));
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const onSubmit = async (data: CustomerFormData) => {
    setIsLoading(true);
    
    try {
      // Filter out empty contacts
      const validContacts = contacts.filter(contact => contact.name && contact.email);
      
      const customerData = {
        name: data.name,
        website: data.website || null,
        vat_number: data.vat_number || null,
        annual_revenue_eur: data.annual_revenue_eur || null,
        notes: data.notes || null,
        contacts: validContacts.length > 0 ? validContacts : null
      };

      const { error } = await supabase
        .from('customers')
        .insert([customerData]);

      if (error) {
        throw error;
      }

      toast({
        title: 'Cliente creato',
        description: 'Il cliente è stato creato con successo'
      });

      form.reset();
      setContacts([{ name: '', email: '', phone: '' }]);
      onOpenChange(false);
      onCustomerCreated?.();
      
    } catch (error) {
      console.error('Errore nella creazione del cliente:', error);
      toast({
        title: 'Errore',
        description: 'Errore nella creazione del cliente',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuovo Cliente</DialogTitle>
          <DialogDescription>
            Aggiungi un nuovo cliente al sistema
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={(e) => { console.log('Submit clicked'); form.handleSubmit(onSubmit)(e); }} className="space-y-6">
            {/* Customer Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Cliente *</FormLabel>
                    <FormControl>
                      <Input placeholder="Es. Marina di Capri S.r.l." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vat_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Partita IVA</FormLabel>
                    <FormControl>
                      <Input placeholder="IT12345678901" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sito Web</FormLabel>
                    <FormControl>
                      <Input placeholder="https://esempio.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="annual_revenue_eur"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fatturato Annuo (€)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2500000" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contacts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Contatti</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addContact}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Aggiungi Contatto
                </Button>
              </div>
              
              {contacts.map((contact, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg">
                  <div className="md:col-span-3 flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Contatto {index + 1}</span>
                    {contacts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    placeholder="Nome"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(index, 'email', e.target.value)}
                  />
                  <Input
                    placeholder="Telefono"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Note aggiuntive sul cliente..." 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Informazioni aggiuntive e note sul cliente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creazione...' : 'Crea Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};