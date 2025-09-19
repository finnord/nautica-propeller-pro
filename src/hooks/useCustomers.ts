import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Customer {
  id: string;
  name: string;
  vat_number?: string;
  website?: string;
  annual_revenue_eur?: number;
  notes?: string;
  contacts?: any;
  created_at: string;
  updated_at: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i clienti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCustomer = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const createCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customerData])
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => [...prev, data]);
      toast({
        title: "Cliente creato",
        description: `Cliente "${data.name}" creato con successo`
      });
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare il cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCustomers(prev => 
        prev.map(customer => 
          customer.id === id ? { ...customer, ...data } : customer
        )
      );

      toast({
        title: "Cliente aggiornato",
        description: "Le modifiche sono state salvate con successo"
      });
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare il cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCustomers(prev => prev.filter(customer => customer.id !== id));
      toast({
        title: "Cliente eliminato",
        description: "Cliente eliminato con successo"
      });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare il cliente",
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  return {
    customers,
    loading,
    loadCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
};