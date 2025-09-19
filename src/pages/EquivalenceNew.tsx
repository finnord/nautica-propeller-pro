import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, Save } from 'lucide-react';
import { CrossReferenceKind, useCrossMappings } from '@/hooks/useCrossMappings';

type PropellerOption = {
  id: string;
  model: string;
  description: string | null;
};

type FormState = {
  propellerId: string;
  cefCode: string;
  referenceCode: string;
  type: CrossReferenceKind;
  context: string;
  notes: string;
};

const initialFormState: FormState = {
  propellerId: '',
  cefCode: '',
  referenceCode: '',
  type: 'oem',
  context: '',
  notes: '',
};

export default function EquivalenceNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createCrossReference, isMutating } = useCrossMappings();

  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [propellers, setPropellers] = useState<PropellerOption[]>([]);
  const [propellersLoading, setPropellersLoading] = useState(false);
  const [propellersError, setPropellersError] = useState<string | null>(null);

  const loadPropellers = useCallback(async () => {
    setPropellersLoading(true);
    setPropellersError(null);

    try {
      const { data, error } = await supabase
        .from('propellers')
        .select('id, model, description')
        .order('model')
        .limit(200);

      if (error) {
        throw error;
      }

      setPropellers((data ?? []).map(item => ({
        id: item.id,
        model: item.model,
        description: item.description,
      })));
    } catch (err) {
      console.error('Error loading propellers list:', err);
      const message = err instanceof Error ? err.message : 'Impossibile caricare l\'elenco giranti';
      setPropellersError(message);
      toast({
        title: 'Errore di caricamento',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setPropellersLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPropellers();
  }, [loadPropellers]);

  const handlePropellerChange = (value: string) => {
    setFormState(prev => {
      const selected = propellers.find(propeller => propeller.id === value);
      return {
        ...prev,
        propellerId: value,
        cefCode: selected?.model ?? prev.cefCode,
      };
    });
  };

  const handleCefCodeChange = (value: string) => {
    setFormState(prev => {
      const trimmed = value.trim();
      const matched = propellers.find(propeller => propeller.model === trimmed);
      return {
        ...prev,
        cefCode: value,
        propellerId: matched?.id ?? '',
      };
    });
  };

  const handleTypeChange = (value: CrossReferenceKind) => {
    setFormState(prev => ({
      ...prev,
      type: value,
      context: '',
    }));
  };

  const handleSave = async () => {
    const trimmedReference = formState.referenceCode.trim();
    const trimmedCefCode = formState.cefCode.trim();

    if (!trimmedReference) {
      toast({
        title: 'Campo obbligatorio',
        description: 'Inserisci il codice da mappare (OEM/Supersession/Application)',
        variant: 'destructive',
      });
      return;
    }

    if (!formState.propellerId && !trimmedCefCode) {
      toast({
        title: 'Codice CEF mancante',
        description: 'Seleziona una girante CEF o inserisci manualmente il codice da collegare.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const created = await createCrossReference({
        propellerId: formState.propellerId || undefined,
        cefCode: trimmedCefCode || undefined,
        referenceCode: trimmedReference,
        type: formState.type,
        context: formState.context.trim() || undefined,
        notes: formState.notes.trim() || undefined,
      });

      toast({
        title: 'Equivalenza creata',
        description: `${created.referenceCode} aggiunto a ${created.cefCode}`,
      });

      navigate('/equivalences');
    } catch (err) {
      console.error('Error saving cross reference:', err);
      toast({
        title: 'Errore',
        description: err instanceof Error ? err.message : 'Impossibile salvare l\'equivalenza',
        variant: 'destructive',
      });
    }
  };

  const contextCopy = useMemo(() => {
    switch (formState.type) {
      case 'oem':
        return {
          label: 'OEM / Costruttore',
          placeholder: 'Es. Yamaha',
          description: 'Inserisci il brand o il costruttore OEM correlato.',
        };
      case 'supersession':
        return {
          label: 'Dettagli supersession',
          placeholder: 'Es. sostituisce P1234 dal 2023',
          description: 'Spiega in che modo il codice sostituisce o viene sostituito.',
        };
      case 'application':
        return {
          label: 'Applicazione (motore/modello)',
          placeholder: 'Es. Mercury 150 EFI',
          description: 'Specificare motore, modello o imbarcazione compatibile.',
        };
      default:
        return {
          label: 'Contesto',
          placeholder: 'Dettagli opzionali',
          description: 'Informazioni aggiuntive utili per comprendere il mapping.',
        };
    }
  }, [formState.type]);

  const isFormValid = useMemo(() => {
    return (
      formState.referenceCode.trim().length > 0 &&
      (!!formState.propellerId || formState.cefCode.trim().length > 0)
    );
  }, [formState.propellerId, formState.referenceCode, formState.cefCode]);

  return (
    <AppLayout>
      <div className="space-y-6">
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
              <p className="text-body">Collega un codice OEM, supersession o applicazione ad un codice CEF</p>
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
              disabled={isMutating || !isFormValid}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {isMutating ? 'Salvataggio...' : 'Salva'}
            </Button>
          </div>
        </div>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Dettagli equivalenza</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Girante CEF</Label>
                <Select
                  value={formState.propellerId}
                  onValueChange={handlePropellerChange}
                  disabled={propellersLoading}
                >
                  <SelectTrigger className="input-business">
                    <SelectValue placeholder="Seleziona una girante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nessuna selezione</SelectItem>
                    {propellers.map(propeller => (
                      <SelectItem key={propeller.id} value={propeller.id}>
                        <span className="font-mono">{propeller.model}</span>
                        {propeller.description ? ` — ${propeller.description}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Elenco limitato alle prime 200 giranti ordinate per codice.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={loadPropellers}
                  disabled={propellersLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${propellersLoading ? 'animate-spin' : ''}`} />
                  Aggiorna elenco
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cefCode">Codice CEF</Label>
                <Input
                  id="cefCode"
                  value={formState.cefCode}
                  onChange={event => handleCefCodeChange(event.target.value)}
                  placeholder="Es. CEF-1234"
                  className="input-business"
                />
                <p className="text-xs text-muted-foreground">
                  Se il codice corrisponde a una girante esistente, verrà selezionata automaticamente.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="referenceCode">Codice da collegare *</Label>
                <Input
                  id="referenceCode"
                  value={formState.referenceCode}
                  onChange={event => setFormState(prev => ({ ...prev, referenceCode: event.target.value }))}
                  placeholder="OEM / supersession / applicazione"
                  className="input-business"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo mapping *</Label>
                <Select
                  value={formState.type}
                  onValueChange={value => handleTypeChange(value as CrossReferenceKind)}
                >
                  <SelectTrigger className="input-business">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oem">OEM cross reference</SelectItem>
                    <SelectItem value="supersession">Supersession</SelectItem>
                    <SelectItem value="application">Application guide</SelectItem>
                    <SelectItem value="other">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="context">{contextCopy.label}</Label>
                <Input
                  id="context"
                  value={formState.context}
                  onChange={event => setFormState(prev => ({ ...prev, context: event.target.value }))}
                  placeholder={contextCopy.placeholder}
                  className="input-business"
                />
                <p className="text-xs text-muted-foreground">{contextCopy.description}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note interne</Label>
                <Textarea
                  id="notes"
                  value={formState.notes}
                  onChange={event => setFormState(prev => ({ ...prev, notes: event.target.value }))}
                  className="input-business"
                  placeholder="Annotazioni utili per il team commerciale"
                />
              </div>
            </div>

            {propellersError && (
              <Alert variant="destructive">
                <AlertDescription>{propellersError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
