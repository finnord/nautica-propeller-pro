-- Add list_version column to price_lists table
ALTER TABLE public.price_lists 
ADD COLUMN list_version text NOT NULL DEFAULT 'v1';

-- Create unique constraint to prevent duplicate price lists
CREATE UNIQUE INDEX idx_price_lists_unique 
ON public.price_lists (customer_id, list_name, list_version);

-- Create unique constraint for price_list_items to enable upsert
CREATE UNIQUE INDEX idx_price_list_items_unique 
ON public.price_list_items (price_list_id, propeller_id);

-- Create atomic import function for price list groups
CREATE OR REPLACE FUNCTION public.import_price_list_group(
  p_customer_name text,
  p_list_name text,
  p_list_version text DEFAULT 'v1',
  p_currency text DEFAULT 'EUR',
  p_valid_from date DEFAULT CURRENT_DATE,
  p_valid_to date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_id uuid;
  v_price_list_id uuid;
  v_item jsonb;
  v_result jsonb;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_errors text[] := '{}';
  v_logs jsonb[] := '{}';
BEGIN
  -- Find or create customer
  SELECT id INTO v_customer_id 
  FROM public.customers 
  WHERE LOWER(TRIM(name)) = LOWER(TRIM(p_customer_name));
  
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name) 
    VALUES (TRIM(p_customer_name)) 
    RETURNING id INTO v_customer_id;
    
    v_logs := v_logs || jsonb_build_object(
      'action', 'customer_created',
      'customer_name', p_customer_name,
      'customer_id', v_customer_id
    );
  END IF;

  -- Find or create price list
  SELECT id INTO v_price_list_id 
  FROM public.price_lists 
  WHERE customer_id = v_customer_id 
    AND LOWER(TRIM(list_name)) = LOWER(TRIM(p_list_name))
    AND LOWER(TRIM(list_version)) = LOWER(TRIM(p_list_version));
  
  IF v_price_list_id IS NULL THEN
    INSERT INTO public.price_lists (
      customer_id, list_name, list_version, currency, 
      valid_from, valid_to, notes
    ) 
    VALUES (
      v_customer_id, TRIM(p_list_name), TRIM(p_list_version), 
      p_currency, p_valid_from, p_valid_to, p_notes
    ) 
    RETURNING id INTO v_price_list_id;
    
    v_logs := v_logs || jsonb_build_object(
      'action', 'price_list_created',
      'list_name', p_list_name,
      'list_version', p_list_version,
      'price_list_id', v_price_list_id
    );
  ELSE
    -- Update existing price list metadata
    UPDATE public.price_lists 
    SET 
      currency = p_currency,
      valid_from = p_valid_from,
      valid_to = p_valid_to,
      notes = COALESCE(p_notes, notes),
      updated_at = now()
    WHERE id = v_price_list_id;
    
    v_logs := v_logs || jsonb_build_object(
      'action', 'price_list_updated',
      'list_name', p_list_name,
      'list_version', p_list_version,
      'price_list_id', v_price_list_id
    );
  END IF;

  -- Process items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    BEGIN
      -- Upsert price list item
      INSERT INTO public.price_list_items (
        price_list_id, propeller_id, unit_price, margin_percent, 
        margin_euro, pricing_method, min_quantity, notes
      ) 
      VALUES (
        v_price_list_id,
        (v_item->>'propeller_id')::uuid,
        (v_item->>'unit_price')::numeric,
        (v_item->>'margin_percent')::numeric,
        (v_item->>'margin_euro')::numeric,
        COALESCE(v_item->>'pricing_method', 'margin_percent'),
        COALESCE((v_item->>'min_quantity')::integer, 1),
        v_item->>'notes'
      )
      ON CONFLICT (price_list_id, propeller_id) 
      DO UPDATE SET
        unit_price = EXCLUDED.unit_price,
        margin_percent = EXCLUDED.margin_percent,
        margin_euro = EXCLUDED.margin_euro,
        pricing_method = EXCLUDED.pricing_method,
        min_quantity = EXCLUDED.min_quantity,
        notes = EXCLUDED.notes,
        updated_at = now();
      
      -- Check if it was an insert or update
      GET DIAGNOSTICS v_updated = ROW_COUNT;
      IF v_updated > 0 THEN
        v_logs := v_logs || jsonb_build_object(
          'action', 'item_upserted',
          'propeller_id', v_item->>'propeller_id',
          'unit_price', v_item->>'unit_price'
        );
        v_inserted := v_inserted + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || (SQLERRM || ' - Item: ' || v_item::text);
      v_skipped := v_skipped + 1;
      
      v_logs := v_logs || jsonb_build_object(
        'action', 'item_error',
        'propeller_id', v_item->>'propeller_id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'customer_id', v_customer_id,
    'price_list_id', v_price_list_id,
    'inserted', v_inserted,
    'updated', 0, -- For now, we count upserts as inserts
    'skipped', v_skipped,
    'errors', v_errors,
    'logs', v_logs
  );

  RETURN v_result;
END;
$$;