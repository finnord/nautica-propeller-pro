import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CrossReferenceKind = 'oem' | 'supersession' | 'application' | 'other';

type CrossReferenceRow = Database['public']['Tables']['cross_references']['Row'] & {
  propeller: Pick<Database['public']['Tables']['propellers']['Row'], 'id' | 'model' | 'description'> | null;
};

interface CrossReferenceEntry {
  id: string;
  propellerId?: string;
  cefCode: string;
  referenceCode: string;
  context?: string | null;
  notes?: string | null;
  rawType?: string | null;
  type: CrossReferenceKind;
  createdAt?: string | null;
}

interface OemManufacturerGroup {
  name: string;
  codes: string[];
  notes: string[];
}

export interface OemInterchange {
  cefCode: string;
  propellerId?: string;
  manufacturers: OemManufacturerGroup[];
}

export interface SupersessionChainEntry {
  cefCode: string;
  propellerId?: string;
  chain: Array<{ code: string; note?: string | null; createdAt?: string | null }>;
}

export interface ApplicationGuideEntry {
  cefCode: string;
  propellerId?: string;
  applications: Array<{ model: string; referenceCode: string; note?: string | null }>;
}

const mapKindToReferenceType = (value: CrossReferenceKind): string => {
  switch (value) {
    case 'oem':
      return 'OEM cross reference';
    case 'supersession':
      return 'Supersession';
    case 'application':
      return 'Application guide';
    default:
      return 'Other';
  }
};

const normalizeReferenceType = (value: string | null): CrossReferenceKind => {
  const normalized = value?.toLowerCase() ?? '';
  if (!normalized) {
    return 'other';
  }

  if (['oem', 'cross', 'interchange'].some(keyword => normalized.includes(keyword))) {
    return 'oem';
  }

  if (normalized.includes('super')) {
    return 'supersession';
  }

  if (['application', 'engine', 'model', 'guide'].some(keyword => normalized.includes(keyword))) {
    return 'application';
  }

  return 'other';
};

const mapRowToEntry = (row: CrossReferenceRow): CrossReferenceEntry => {
  const type = normalizeReferenceType(row.reference_type);
  return {
    id: row.id,
    propellerId: row.propeller?.id ?? undefined,
    cefCode: row.propeller?.model ?? row.reference_code,
    referenceCode: row.reference_code,
    context: row.competitor_model,
    notes: row.notes,
    rawType: row.reference_type,
    type,
    createdAt: row.created_at,
  } satisfies CrossReferenceEntry;
};

const sanitizeString = (value?: string | null) => {
  if (value === null || value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

interface CrossReferenceBaseInput {
  propellerId?: string | null;
  cefCode?: string;
  referenceCode: string;
  context?: string | null;
  notes?: string | null;
}

export interface CreateCrossReferenceInput extends CrossReferenceBaseInput {
  type: CrossReferenceKind;
}

export interface UpdateCrossReferenceInput extends Partial<Omit<CrossReferenceBaseInput, 'referenceCode'>> {
  id: string;
  referenceCode?: string;
  type?: CrossReferenceKind;
}

export interface BulkCrossReferenceInput extends CrossReferenceBaseInput {
  id?: string;
  type: CrossReferenceKind;
}

export const useCrossMappings = () => {
  const [entries, setEntries] = useState<CrossReferenceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  const resolvePropellerId = useCallback(
    async (
      input: Pick<CrossReferenceBaseInput, 'propellerId' | 'cefCode'>,
      options?: { strict?: boolean }
    ) => {
      if (input.propellerId === null) {
        return null;
      }

      if (input.propellerId) {
        return input.propellerId;
      }

      const cefCode = input.cefCode?.trim();
      if (!cefCode) {
        if (options?.strict) {
          throw new Error('Specificare un codice CEF valido');
        }
        return null;
      }

      const { data, error } = await supabase
        .from('propellers')
        .select('id, model')
        .eq('model', cefCode)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        if (options?.strict) {
          throw new Error(`Codice CEF "${cefCode}" non trovato`);
        }
        return null;
      }

      return data.id;
    },
    []
  );

  const fetchCrossReferences = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('cross_references')
        .select('id, reference_code, reference_type, competitor_model, notes, created_at, propeller:propellers ( id, model, description )');

      if (error) {
        throw error;
      }

      const normalized = ((data ?? []) as CrossReferenceRow[]).map(mapRowToEntry);
      setEntries(normalized);
    } catch (err) {
      console.error('Error loading cross references:', err);
      setError('Impossibile caricare le equivalenze');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCrossReference = useCallback(
    async (input: CreateCrossReferenceInput) => {
      if (!input.referenceCode?.trim()) {
        throw new Error('Il codice di riferimento è obbligatorio');
      }

      let propellerId: string | null = null;

      try {
        propellerId = await resolvePropellerId(input, { strict: true });
      } catch (err) {
        console.error('Error resolving propeller for create:', err);
        if (err instanceof Error) {
          throw err;
        }
        throw new Error('Impossibile associare il codice CEF indicato');
      }

      if (!propellerId) {
        throw new Error('Impossibile associare il codice CEF indicato');
      }

      setIsMutating(true);
      try {
        const payload: Database['public']['Tables']['cross_references']['Insert'] = {
          propeller_id: propellerId,
          reference_code: input.referenceCode.trim(),
          reference_type: mapKindToReferenceType(input.type),
          competitor_model: sanitizeString(input.context),
          notes: sanitizeString(input.notes),
        };

        const { data, error } = await supabase
          .from('cross_references')
          .insert(payload)
          .select('id, reference_code, reference_type, competitor_model, notes, created_at, propeller:propellers ( id, model, description )')
          .single();

        if (error) {
          throw error;
        }

        await fetchCrossReferences();
        return mapRowToEntry(data as CrossReferenceRow);
      } catch (err) {
        console.error('Error creating cross reference:', err);
        if (err instanceof Error) {
          throw new Error(err.message || 'Impossibile creare l\'equivalenza');
        }
        throw new Error('Impossibile creare l\'equivalenza');
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCrossReferences, resolvePropellerId]
  );

  const updateCrossReference = useCallback(
    async (input: UpdateCrossReferenceInput) => {
      if (!input.id) {
        throw new Error('Identificativo mancante per l\'aggiornamento');
      }

      const updatePayload: Database['public']['Tables']['cross_references']['Update'] = {};

      if (input.referenceCode !== undefined) {
        if (!input.referenceCode.trim()) {
          throw new Error('Il codice di riferimento non può essere vuoto');
        }
        updatePayload.reference_code = input.referenceCode.trim();
      }

      if (input.type !== undefined) {
        updatePayload.reference_type = mapKindToReferenceType(input.type);
      }

      if (input.context !== undefined) {
        updatePayload.competitor_model = sanitizeString(input.context);
      }

      if (input.notes !== undefined) {
        updatePayload.notes = sanitizeString(input.notes);
      }

      setIsMutating(true);
      try {
        if (input.propellerId !== undefined || input.cefCode !== undefined) {
          const strict = input.propellerId !== null;
          const resolvedId = await resolvePropellerId(input, { strict });
          updatePayload.propeller_id = resolvedId;
        }

        const { error } = await supabase
          .from('cross_references')
          .update(updatePayload)
          .eq('id', input.id);

        if (error) {
          throw error;
        }

        await fetchCrossReferences();
      } catch (err) {
        console.error('Error updating cross reference:', err);
        if (err instanceof Error) {
          throw new Error(err.message || 'Impossibile aggiornare l\'equivalenza');
        }
        throw new Error('Impossibile aggiornare l\'equivalenza');
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCrossReferences, resolvePropellerId]
  );

  const deleteCrossReference = useCallback(
    async (id: string) => {
      if (!id) {
        throw new Error('Identificativo mancante per l\'eliminazione');
      }

      setIsMutating(true);
      try {
        const { error } = await supabase
          .from('cross_references')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        await fetchCrossReferences();
      } catch (err) {
        console.error('Error deleting cross reference:', err);
        if (err instanceof Error) {
          throw new Error(err.message || 'Impossibile eliminare l\'equivalenza');
        }
        throw new Error('Impossibile eliminare l\'equivalenza');
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCrossReferences]
  );

  const bulkUpsertCrossReferences = useCallback(
    async (items: BulkCrossReferenceInput[]) => {
      if (!items.length) {
        return;
      }

      setIsMutating(true);
      try {
        const needsResolution = Array.from(
          new Set(
            items
              .filter(item => !item.propellerId && item.cefCode?.trim())
              .map(item => item.cefCode!.trim())
          )
        );

        const propellerLookup = new Map<string, string>();

        if (needsResolution.length > 0) {
          const { data, error } = await supabase
            .from('propellers')
            .select('id, model')
            .in('model', needsResolution);

          if (error) {
            throw error;
          }

          (data ?? []).forEach(row => {
            propellerLookup.set(row.model, row.id);
          });
        }

        const payload = items
          .filter(item => item.referenceCode.trim())
          .map(item => {
            const base: Database['public']['Tables']['cross_references']['Insert'] & { id?: string } = {
              propeller_id:
                item.propellerId === null
                  ? null
                  : item.propellerId ?? (item.cefCode ? propellerLookup.get(item.cefCode.trim()) ?? null : null),
              reference_code: item.referenceCode.trim(),
              reference_type: mapKindToReferenceType(item.type),
              competitor_model: sanitizeString(item.context),
              notes: sanitizeString(item.notes),
            };

            if (item.id) {
              base.id = item.id;
            }

            return base;
          });

        if (!payload.length) {
          return;
        }

        const { error } = await supabase
          .from('cross_references')
          .upsert(payload, { onConflict: 'id' });

        if (error) {
          throw error;
        }

        await fetchCrossReferences();
      } catch (err) {
        console.error('Error during bulk cross reference upsert:', err);
        if (err instanceof Error) {
          throw new Error(err.message || 'Impossibile salvare le equivalenze');
        }
        throw new Error('Impossibile salvare le equivalenze');
      } finally {
        setIsMutating(false);
      }
    },
    [fetchCrossReferences]
  );

  useEffect(() => {
    fetchCrossReferences();
  }, [fetchCrossReferences]);

  const oemInterchanges = useMemo<OemInterchange[]>(() => {
    const map = new Map<string, { cefCode: string; propellerId?: string; manufacturers: Map<string, OemManufacturerGroup> }>();

    entries
      .filter(entry => entry.type === 'oem')
      .forEach(entry => {
        const key = entry.propellerId ?? entry.cefCode;
        if (!map.has(key)) {
          map.set(key, {
            cefCode: entry.cefCode,
            propellerId: entry.propellerId,
            manufacturers: new Map(),
          });
        }

        const record = map.get(key)!;
        const manufacturerName = entry.context?.trim() || 'OEM';
        const manufacturer = record.manufacturers.get(manufacturerName) ?? {
          name: manufacturerName,
          codes: [],
          notes: [],
        };

        manufacturer.codes.push(entry.referenceCode);
        if (entry.notes) {
          manufacturer.notes.push(entry.notes);
        }

        record.manufacturers.set(manufacturerName, manufacturer);
      });

    return Array.from(map.values()).map(record => ({
      cefCode: record.cefCode,
      propellerId: record.propellerId,
      manufacturers: Array.from(record.manufacturers.values()),
    }));
  }, [entries]);

  const supersessions = useMemo<SupersessionChainEntry[]>(() => {
    const map = new Map<string, SupersessionChainEntry>();

    entries
      .filter(entry => entry.type === 'supersession')
      .forEach(entry => {
        const key = entry.propellerId ?? entry.cefCode;
        if (!map.has(key)) {
          map.set(key, {
            cefCode: entry.cefCode,
            propellerId: entry.propellerId,
            chain: [],
          });
        }

        map.get(key)!.chain.push({
          code: entry.referenceCode,
          note: entry.notes,
          createdAt: entry.createdAt,
        });
      });

    return Array.from(map.values()).map(chain => ({
      ...chain,
      chain: chain.chain.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        return a.code.localeCompare(b.code);
      }),
    }));
  }, [entries]);

  const applicationGuides = useMemo<ApplicationGuideEntry[]>(() => {
    const map = new Map<string, ApplicationGuideEntry>();

    entries
      .filter(entry => entry.type === 'application')
      .forEach(entry => {
        const key = entry.propellerId ?? entry.cefCode;
        if (!map.has(key)) {
          map.set(key, {
            cefCode: entry.cefCode,
            propellerId: entry.propellerId,
            applications: [],
          });
        }

        map.get(key)!.applications.push({
          model: entry.context ?? entry.referenceCode,
          referenceCode: entry.referenceCode,
          note: entry.notes,
        });
      });

    return Array.from(map.values());
  }, [entries]);

  return {
    entries,
    isLoading,
    error,
    oemInterchanges,
    supersessions,
    applicationGuides,
    refetch: fetchCrossReferences,
    isMutating,
    createCrossReference,
    updateCrossReference,
    deleteCrossReference,
    bulkUpsertCrossReferences,
  };
};
