-- FASE 1: Ristrutturazione Schema Database per Impellers

-- Creare tabella rubber_compounds (mescole gomma)
CREATE TABLE public.rubber_compounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  compound_code TEXT NOT NULL UNIQUE,
  compound_name TEXT NOT NULL,
  base_polymer TEXT NOT NULL, -- NBR, EPDM, CR, etc.
  density_g_cm3 NUMERIC NOT NULL CHECK (density_g_cm3 > 0),
  material_cost_per_kg NUMERIC CHECK (material_cost_per_kg >= 0),
  supplier_name TEXT,
  cef_internal_code TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creare tabella bushings (bussole)
CREATE TABLE public.bushings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bushing_code TEXT NOT NULL UNIQUE,
  material TEXT NOT NULL, -- acciaio, termoplastico, termoindurente
  shaft_profile TEXT, -- D-shaft, cone, spline, etc.
  inner_diameter_mm NUMERIC CHECK (inner_diameter_mm > 0),
  outer_diameter_mm NUMERIC CHECK (outer_diameter_mm > 0),
  length_mm NUMERIC CHECK (length_mm > 0),
  indicative_cost NUMERIC CHECK (indicative_cost >= 0),
  drawing_link_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creare tabella impellers (giranti)
CREATE TABLE public.impellers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  impeller_name TEXT NOT NULL,
  internal_code TEXT UNIQUE,
  product_type TEXT NOT NULL DEFAULT 'impeller',
  
  -- Dimensioni specifiche impeller
  height_mm NUMERIC CHECK (height_mm > 0),
  outer_diameter_mm NUMERIC CHECK (outer_diameter_mm > 0),
  inner_diameter_mm NUMERIC CHECK (inner_diameter_mm > 0),
  hub_diameter_mm NUMERIC CHECK (hub_diameter_mm > 0),
  blade_count INTEGER CHECK (blade_count > 0),
  blade_thickness_base_mm NUMERIC CHECK (blade_thickness_base_mm > 0),
  
  -- Volume e materiali
  rubber_volume_cm3 NUMERIC NOT NULL CHECK (rubber_volume_cm3 > 0),
  rubber_compound_id UUID REFERENCES public.rubber_compounds(id),
  bushing_id UUID REFERENCES public.bushings(id),
  
  -- Costi e pricing
  base_cost NUMERIC DEFAULT 0 CHECK (base_cost >= 0),
  gross_margin_pct NUMERIC CHECK (gross_margin_pct >= 0 AND gross_margin_pct <= 100),
  base_list_price NUMERIC CHECK (base_list_price >= 0),
  
  -- Altri dettagli
  drawing_link_url TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'obsolete')),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS per tutte le tabelle
ALTER TABLE public.rubber_compounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bushings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impellers ENABLE ROW LEVEL SECURITY;

-- Policies per rubber_compounds
CREATE POLICY "Users can manage rubber_compounds" ON public.rubber_compounds FOR ALL USING (true);

-- Policies per bushings
CREATE POLICY "Users can manage bushings" ON public.bushings FOR ALL USING (true);

-- Policies per impellers
CREATE POLICY "Users can manage impellers" ON public.impellers FOR ALL USING (true);

-- FASE 2: Funzioni di Calcolo Automatico

-- Funzione per calcolare il peso della gomma
CREATE OR REPLACE FUNCTION public.calculate_rubber_weight(
  volume_cm3 NUMERIC,
  density_g_cm3 NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  IF volume_cm3 IS NULL OR density_g_cm3 IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN volume_cm3 * density_g_cm3; -- peso in grammi
END;
$$ LANGUAGE plpgsql;

-- Funzione per calcolare il costo del materiale
CREATE OR REPLACE FUNCTION public.calculate_material_cost(
  volume_cm3 NUMERIC,
  density_g_cm3 NUMERIC,
  cost_per_kg NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  weight_g NUMERIC;
  weight_kg NUMERIC;
BEGIN
  IF volume_cm3 IS NULL OR density_g_cm3 IS NULL OR cost_per_kg IS NULL THEN
    RETURN NULL;
  END IF;
  
  weight_g := volume_cm3 * density_g_cm3;
  weight_kg := weight_g / 1000.0;
  
  RETURN weight_kg * cost_per_kg;
END;
$$ LANGUAGE plpgsql;

-- FASE 3: Funzione per Ricerca Similarità

-- Funzione per calcolare il match score tra impellers
CREATE OR REPLACE FUNCTION public.calculate_impeller_match_score(
  target_outer_diameter NUMERIC,
  target_inner_diameter NUMERIC,
  target_height NUMERIC,
  target_hub_diameter NUMERIC,
  target_blade_count INTEGER,
  
  compare_outer_diameter NUMERIC,
  compare_inner_diameter NUMERIC,
  compare_height NUMERIC,
  compare_hub_diameter NUMERIC,
  compare_blade_count INTEGER,
  
  tolerance_od_mm NUMERIC DEFAULT 5,
  tolerance_id_mm NUMERIC DEFAULT 3,
  tolerance_height_mm NUMERIC DEFAULT 3,
  tolerance_hub_mm NUMERIC DEFAULT 2,
  tolerance_blade_count INTEGER DEFAULT 0
) RETURNS NUMERIC AS $$
DECLARE
  score NUMERIC := 0;
  max_score NUMERIC := 5; -- 5 criteri di matching
  od_diff NUMERIC;
  id_diff NUMERIC;
  height_diff NUMERIC;
  hub_diff NUMERIC;
BEGIN
  -- Verifica diametro esterno
  od_diff := ABS(target_outer_diameter - compare_outer_diameter);
  IF od_diff <= tolerance_od_mm THEN
    score := score + 1;
  END IF;
  
  -- Verifica diametro interno
  id_diff := ABS(target_inner_diameter - compare_inner_diameter);
  IF id_diff <= tolerance_id_mm THEN
    score := score + 1;
  END IF;
  
  -- Verifica altezza
  height_diff := ABS(target_height - compare_height);
  IF height_diff <= tolerance_height_mm THEN
    score := score + 1;
  END IF;
  
  -- Verifica diametro mozzo
  hub_diff := ABS(target_hub_diameter - compare_hub_diameter);
  IF hub_diff <= tolerance_hub_mm THEN
    score := score + 1;
  END IF;
  
  -- Verifica numero alette
  IF ABS(target_blade_count - compare_blade_count) <= tolerance_blade_count THEN
    score := score + 1;
  END IF;
  
  -- Ritorna score percentuale (0-100)
  RETURN (score / max_score) * 100;
END;
$$ LANGUAGE plpgsql;

-- Indici per ottimizzare le ricerche dimensionali
CREATE INDEX idx_impellers_outer_diameter ON public.impellers(outer_diameter_mm);
CREATE INDEX idx_impellers_inner_diameter ON public.impellers(inner_diameter_mm);
CREATE INDEX idx_impellers_height ON public.impellers(height_mm);
CREATE INDEX idx_impellers_hub_diameter ON public.impellers(hub_diameter_mm);
CREATE INDEX idx_impellers_blade_count ON public.impellers(blade_count);
CREATE INDEX idx_impellers_status ON public.impellers(status);

-- Trigger per aggiornare timestamp
CREATE TRIGGER update_rubber_compounds_updated_at
  BEFORE UPDATE ON public.rubber_compounds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bushings_updated_at
  BEFORE UPDATE ON public.bushings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_impellers_updated_at
  BEFORE UPDATE ON public.impellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- FASE 4: Dati di esempio per testing

-- Inserire alcuni rubber compounds di esempio
INSERT INTO public.rubber_compounds (compound_code, compound_name, base_polymer, density_g_cm3, material_cost_per_kg, cef_internal_code) VALUES
('NBR-70', 'Nitrile 70 Shore A', 'NBR', 1.25, 8.50, 'CEF-001'),
('EPDM-65', 'EPDM 65 Shore A', 'EPDM', 1.15, 9.20, 'CEF-002'),
('CR-75', 'Chloroprene 75 Shore A', 'CR', 1.35, 12.80, 'CEF-003');

-- Inserire alcuni bushings di esempio  
INSERT INTO public.bushings (bushing_code, material, shaft_profile, inner_diameter_mm, outer_diameter_mm, length_mm, indicative_cost) VALUES
('BSH-001', 'acciaio', 'D-shaft', 25, 35, 40, 15.50),
('BSH-002', 'termoplastico', 'spline', 30, 40, 45, 8.20),
('BSH-003', 'termoindurente', 'cone', 20, 30, 35, 12.30);