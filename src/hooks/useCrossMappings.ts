import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type CrossReferenceKind = 'oem' | 'supersession' | 'application' | 'other';

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

export const useCrossMappings = () => {
  const [entries, setEntries] = useState<CrossReferenceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCrossReferences = async () => {
    setIsLoading(true);
    setError(null);

    try {
      type Row = Database['public']['Tables']['cross_references']['Row'] & {
        propeller: Pick<Database['public']['Tables']['propellers']['Row'], 'id' | 'model' | 'description'> | null;
      };

      const { data, error } = await supabase
        .from('cross_references')
        .select('id, reference_code, reference_type, competitor_model, notes, created_at, propeller:propellers ( id, model, description )');

      if (error) {
        throw error;
      }

      const normalized = ((data ?? []) as Row[]).map(row => {
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
      });

      setEntries(normalized);
    } catch (err) {
      console.error('Error loading cross references:', err);
      setError('Impossibile caricare le equivalenze');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrossReferences();
  }, []);

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
      })
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
  };
};
