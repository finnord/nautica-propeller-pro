import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { 
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  User
} from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';

const customerSchema = z.object({
  name: z.string().min(1, "Il nome dell'azienda è obbligatorio"),
  vat_number: z.string().optional(),
  website: z.string().url("URL non valido").optional().or(z.literal("")),
  annual_revenue_eur: z.number().positive().optional(),
  notes: z.string().optional(),
});

const contactSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  department: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;
type ContactFormData = z.infer<typeof contactSchema>;

export default function CustomerEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCustomer, updateCustomer, loading } = useCustomers();
  const [isSaving, setIsSaving] = useState(false);
  const [contacts, setContacts] = useState<ContactFormData[]>([]);

  const customer = getCustomer(id!);

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      vat_number: '',
      website: '',
      annual_revenue_eur: undefined,
      notes: '',
    },
  });

  useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || '',
        vat_number: customer.vat_number || '',
        website: customer.website || '',
        annual_revenue_eur: customer.annual_revenue_eur || undefined,
        notes: customer.notes || '',
      });

      // Parse existing contacts
      let existingContacts = [];
      if (customer.contacts) {
        try {
          existingContacts = typeof customer.contacts === 'string' 
            ? JSON.parse(customer.contacts) 
            : customer.contacts;
        } catch (e) {
          existingContacts = [];
        }
      }
      setContacts(Array.isArray(existingContacts) ? existingContacts : []);
    }
  }, [customer, form]);

  const addContact = () => {
    setContacts(prev => [...prev, { name: '', email: '', phone: '', role: '', department: '' }]);
  };

  const removeContact = (index: number) => {
    setContacts(prev => prev.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactFormData, value: string) => {
    setContacts(prev => 
      prev.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    );
  };

  const onSubmit = async (data: CustomerFormData) => {
    if (!id) return;

    setIsSaving(true);
    try {
      // Filter out empty contacts
      const validContacts = contacts.filter(contact => 
        contact.name.trim() !== '' || contact.email.trim() !== '' || contact.phone.trim() !== ''
      );

      const updateData = {
        ...data,
        contacts: validContacts.length > 0 ? validContacts : null,
      };

      await updateCustomer(id, updateData);
      navigate(`/customers/${id}`);
    } catch (error) {
      console.error('Error updating customer:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!customer) {
    return (
      <AppLayout>
        <div className="text-center py-12 animate-fade-in">
          <h1 className="text-2xl font-bold mb-4">Cliente non trovato</h1>
          <Button onClick={() => navigate('/customers')}>
            Torna ai Clienti
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/customers/${id}`)}
              className="hover-scale"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Indietro
            </Button>
            <div>
              <h1 className="text-heading">Modifica Cliente</h1>
              <p className="text-body">Aggiorna le informazioni del cliente</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate(`/customers/${id}`)}
              className="hover-scale"
            >
              Annulla
            </Button>
            <Button 
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSaving}
              className="btn-primary hover-scale"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>

        {/* Edit Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informazioni Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Azienda *</FormLabel>
                        <FormControl>
                          <Input {...field} className="input-business" />
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
                          <Input {...field} className="input-business" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sito Web</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="url" 
                            placeholder="https://..."
                            className="input-business" 
                          />
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
                            {...field}
                            type="number" 
                            min="0" 
                            step="1000"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="input-business" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Note</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="input-business min-h-[100px]"
                          placeholder="Note aggiuntive sul cliente..."
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contacts Section */}
            <Card className="card-elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Contatti</CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addContact}
                    className="hover-scale"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Contatto
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nessun contatto aggiunto. Clicca "Aggiungi Contatto" per iniziare.</p>
                  </div>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg space-y-4 animate-scale-in">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Contatto {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeContact(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nome *</Label>
                          <Input
                            value={contact.name}
                            onChange={(e) => updateContact(index, 'name', e.target.value)}
                            className="input-business"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            type="email"
                            value={contact.email}
                            onChange={(e) => updateContact(index, 'email', e.target.value)}
                            className="input-business"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Telefono</Label>
                          <Input
                            value={contact.phone}
                            onChange={(e) => updateContact(index, 'phone', e.target.value)}
                            className="input-business"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Ruolo</Label>
                          <Input
                            value={contact.role}
                            onChange={(e) => updateContact(index, 'role', e.target.value)}
                            className="input-business"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Dipartimento</Label>
                        <Input
                          value={contact.department}
                          onChange={(e) => updateContact(index, 'department', e.target.value)}
                          className="input-business"
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}