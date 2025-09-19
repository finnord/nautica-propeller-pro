// Core domain types for Nautical BU Management System

export type ProductType = 'impeller' | 'bushing' | 'kit' | 'generic';
export type UnitOfMeasure = 'pcs' | 'set' | 'kg' | 'm' | 'other';
export type Currency = 'EUR' | 'USD';
export type MatchType = 'full' | 'dimensional' | 'form-fit' | 'partial';
export type RFQStatus = 'open' | 'quoted' | 'won' | 'lost' | 'on_hold';
export type PricingMethod = 'margin_percent' | 'margin_euro' | 'target_price';

// Core Product Entity
export interface Product {
  product_id: string;
  product_type: ProductType;
  name: string;
  internal_code?: string;
  uom: UnitOfMeasure;
  base_cost: number; // Industrial cost + overhead
  gross_margin_pct?: number;
  base_list_price?: number;
  drawing_link_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Impeller-specific dimensions
export interface ImpellerDims {
  product_id: string; // FK to Product
  height_mm?: number;
  outer_diameter_mm?: number;
  inner_diameter_mm?: number;
  hub_diameter_mm?: number;
  blade_count?: number;
  blade_thickness_base_mm?: number;
  bushing_code?: string; // FK to Bushing
  rubber_mix_code?: string; // FK to RubberMix
  rubber_volume_cm3: number; // REQUIRED
  shaft_profile_key?: string; // D-shaft, cone, spline, etc.
  drawing_link_url?: string;
}

// Rubber compound specifications
export interface RubberMix {
  mix_code: string; // PK
  base_polymer: string; // NBR, EPDM, CR, etc.
  density_g_cm3: number;
  material_price_per_kg?: number;
  supplier_name?: string;
  notes?: string;
}

// Bushing specifications
export interface Bushing {
  bushing_code: string; // PK
  material: string; // brass, plastic, steel, etc.
  indicative_cost?: number; // Never used in pricing
  shaft_profile_key?: string;
  drawing_link_url?: string;
  notes?: string;
}

// Customer information
export interface Customer {
  id: string;
  name: string;
  contacts: string | null; // Max 3 contacts as JSON string
  website?: string | null;
  vat_number?: string | null;
  annual_revenue_eur?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Price list management
export interface PriceList {
  price_list_id: string;
  customer_id: string; // FK to Customer
  valid_from: string; // ISO date
  valid_to?: string; // ISO date, null = unlimited
  currency: Currency;
  created_at: string;
  updated_at: string;
}

export interface PriceListItem {
  price_list_id: string; // FK to PriceList
  product_id: string; // FK to Product
  unit_price: number;
  currency: Currency;
}

// RFQ (Request for Quote) management
export interface RFQ {
  rfq_id: string;
  customer_id: string; // FK to Customer
  rfq_date: string; // ISO date
  status: RFQStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RFQLine {
  rfq_id: string; // FK to RFQ
  line_no: number;
  product_id?: string; // FK to Product
  external_code?: string; // Alternative to product_id
  qty: number;
  target_price?: number;
  quoted_price?: number;
  notes?: string;
}

// Equivalence relationships
export interface EquivalentImpeller {
  source_product_id: string; // FK to Product
  target_product_id: string; // FK to Product
  match_type: MatchType;
  dimension_tolerance_mm?: number;
  material_note?: string;
  bushing_note?: string;
  shaft_profile_note?: string;
  general_note?: string;
}

export interface EquivalentBushing {
  source_bushing_code: string; // FK to Bushing
  target_bushing_code: string; // FK to Bushing
  match_type: MatchType;
  shaft_profile_compatible: 'yes' | 'no' | 'unknown';
  material_note?: string;
  general_note?: string;
}

// Business calculation helpers
export interface PricingCalculation {
  base_cost: number;
  pricing_method: PricingMethod;
  margin_percent?: number;
  margin_euro?: number;
  target_price?: number;
  calculated_price: number;
  calculated_margin_pct: number;
  calculated_margin_euro: number;
}

export interface RubberCalculation {
  volume_cm3: number;
  density_g_cm3: number;
  mass_g: number;
  mass_kg: number;
  material_price_per_kg?: number;
  indicative_cost?: number;
}

// Search and filtering
export interface ImpellerSearchCriteria {
  outer_diameter_mm?: number;
  inner_diameter_mm?: number;
  height_mm?: number;
  hub_diameter_mm?: number;
  blade_count?: number;
  tolerance_od_mm?: number;
  tolerance_id_mm?: number;
  tolerance_height_mm?: number;
  tolerance_hub_mm?: number;
  tolerance_blade_count?: number;
}

export interface ImpellerSearchResult extends Product {
  impeller_dims?: ImpellerDims;
  rubber_mix?: RubberMix;
  bushing?: Bushing;
  dimensional_match: {
    od_diff_mm?: number;
    id_diff_mm?: number;
    height_diff_mm?: number;
    hub_diff_mm?: number;
    blade_count_diff?: number;
  };
  match_score: number; // 0-100
}