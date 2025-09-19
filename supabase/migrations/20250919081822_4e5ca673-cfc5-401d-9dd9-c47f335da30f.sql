-- Add base_cost column to propellers table for margin calculations
ALTER TABLE public.propellers 
ADD COLUMN base_cost numeric(10,2) DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.propellers.base_cost IS 'Base manufacturing cost for margin calculations';