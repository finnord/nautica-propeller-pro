-- Create customers table
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contacts JSONB, -- Array of contact objects {name, email, phone, role}
  website TEXT,
  vat_number TEXT,
  annual_revenue_eur NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_lists table
CREATE TABLE public.price_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  list_name TEXT NOT NULL,
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE, -- NULL means unlimited validity
  currency TEXT NOT NULL DEFAULT 'EUR',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create price_list_items table
CREATE TABLE public.price_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_list_id UUID NOT NULL REFERENCES public.price_lists(id) ON DELETE CASCADE,
  propeller_id UUID NOT NULL REFERENCES public.propellers(id),
  unit_price NUMERIC NOT NULL,
  margin_percent NUMERIC, -- Margin percentage over industrial cost
  margin_euro NUMERIC, -- Fixed margin in euros
  pricing_method TEXT NOT NULL DEFAULT 'margin_percent', -- 'margin_percent', 'margin_euro', 'target_price'
  min_quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(price_list_id, propeller_id)
);

-- Create rfq table
CREATE TABLE public.rfq (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  rfq_number TEXT NOT NULL UNIQUE,
  rfq_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'quoted', 'won', 'lost', 'on_hold'
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rfq_lines table
CREATE TABLE public.rfq_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rfq_id UUID NOT NULL REFERENCES public.rfq(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  propeller_id UUID REFERENCES public.propellers(id),
  external_code TEXT, -- Alternative to propeller_id for unknown products
  quantity INTEGER NOT NULL,
  target_price NUMERIC,
  quoted_price NUMERIC,
  quoted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rfq_id, line_number)
);

-- Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfq_lines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customers
CREATE POLICY "Users can manage customers" ON public.customers FOR ALL USING (true);

-- Create RLS policies for price_lists
CREATE POLICY "Users can manage price_lists" ON public.price_lists FOR ALL USING (true);

-- Create RLS policies for price_list_items
CREATE POLICY "Users can manage price_list_items" ON public.price_list_items FOR ALL USING (true);

-- Create RLS policies for rfq
CREATE POLICY "Users can manage rfq" ON public.rfq FOR ALL USING (true);

-- Create RLS policies for rfq_lines
CREATE POLICY "Users can manage rfq_lines" ON public.rfq_lines FOR ALL USING (true);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_lists_updated_at
  BEFORE UPDATE ON public.price_lists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_list_items_updated_at
  BEFORE UPDATE ON public.price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfq_updated_at
  BEFORE UPDATE ON public.rfq
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rfq_lines_updated_at
  BEFORE UPDATE ON public.rfq_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_price_lists_customer_id ON public.price_lists(customer_id);
CREATE INDEX idx_price_lists_valid_dates ON public.price_lists(valid_from, valid_to);
CREATE INDEX idx_price_list_items_propeller_id ON public.price_list_items(propeller_id);
CREATE INDEX idx_rfq_customer_id ON public.rfq(customer_id);
CREATE INDEX idx_rfq_status ON public.rfq(status);
CREATE INDEX idx_rfq_lines_propeller_id ON public.rfq_lines(propeller_id);
CREATE INDEX idx_rfq_lines_rfq_id ON public.rfq_lines(rfq_id);