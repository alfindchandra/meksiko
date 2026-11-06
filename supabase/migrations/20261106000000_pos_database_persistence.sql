BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT 'BTL',
  ADD COLUMN IF NOT EXISTS emoji TEXT NOT NULL DEFAULT '🍾';

CREATE TABLE IF NOT EXISTS public.sales_transactions (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  outlet_name TEXT NOT NULL,
  amount_received BIGINT CHECK (amount_received IS NULL OR amount_received >= 0),
  transfer_amount BIGINT CHECK (transfer_amount IS NULL OR transfer_amount >= 0),
  admin_amount BIGINT CHECK (admin_amount IS NULL OR admin_amount >= 0),
  lines JSONB NOT NULL CHECK (jsonb_typeof(lines) = 'array')
);

CREATE INDEX IF NOT EXISTS idx_sales_transactions_created_at
  ON public.sales_transactions (created_at);

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname = 'laris-delete-expired-sales';
SELECT cron.schedule(
  'laris-delete-expired-sales',
  '*/15 * * * *',
  $$DELETE FROM public.sales_transactions
    WHERE created_at < NOW() - INTERVAL '3 days'$$
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rukos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public app access products" ON public.products;
CREATE POLICY "public app access products" ON public.products
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public app access price tiers" ON public.price_tiers;
CREATE POLICY "public app access price tiers" ON public.price_tiers
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public app access rukos" ON public.rukos;
CREATE POLICY "public app access rukos" ON public.rukos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public app access sales transactions" ON public.sales_transactions;
CREATE POLICY "public app access sales transactions" ON public.sales_transactions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.products, public.price_tiers, public.rukos, public.sales_transactions
  TO anon, authenticated;

DO $$
DECLARE
  sequence_name TEXT;
BEGIN
  FOREACH sequence_name IN ARRAY ARRAY[
    pg_get_serial_sequence('public.products', 'id'),
    pg_get_serial_sequence('public.price_tiers', 'id'),
    pg_get_serial_sequence('public.rukos', 'id')
  ]
  LOOP
    IF sequence_name IS NOT NULL THEN
      EXECUTE format(
        'GRANT USAGE, SELECT ON SEQUENCE %s TO anon, authenticated',
        sequence_name
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_product_with_tiers(
  p_product_id BIGINT,
  p_sku TEXT,
  p_category TEXT,
  p_name TEXT,
  p_unit TEXT,
  p_emoji TEXT,
  p_tiers JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  saved_product_id BIGINT;
BEGIN
  IF NULLIF(BTRIM(p_name), '') IS NULL
     OR NULLIF(BTRIM(p_category), '') IS NULL
     OR NULLIF(BTRIM(p_unit), '') IS NULL
     OR p_tiers IS NULL
     OR jsonb_typeof(p_tiers) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_tiers) = 0 THEN
    RAISE EXCEPTION 'Data barang atau tier harga tidak valid.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_tiers) AS tier(
      tier_code TEXT,
      tier_name TEXT,
      price_idr BIGINT
    )
    WHERE NULLIF(BTRIM(tier_code), '') IS NULL
       OR NULLIF(BTRIM(tier_name), '') IS NULL
       OR price_idr IS NULL
       OR price_idr < 0
  ) THEN
    RAISE EXCEPTION 'Nama dan harga setiap tier harus valid.';
  END IF;

  IF p_product_id IS NULL THEN
    INSERT INTO public.products (sku, category, name, unit, emoji)
    VALUES (p_sku, BTRIM(p_category), BTRIM(p_name), BTRIM(p_unit), COALESCE(NULLIF(BTRIM(p_emoji), ''), '🍾'))
    RETURNING id INTO saved_product_id;
  ELSE
    UPDATE public.products
    SET category = BTRIM(p_category),
        name = BTRIM(p_name),
        unit = BTRIM(p_unit),
        emoji = COALESCE(NULLIF(BTRIM(p_emoji), ''), '🍾'),
        updated_at = NOW()
    WHERE id = p_product_id
    RETURNING id INTO saved_product_id;

    IF saved_product_id IS NULL THEN
      RAISE EXCEPTION 'Barang yang akan diubah tidak ditemukan.';
    END IF;
  END IF;

  DELETE FROM public.price_tiers WHERE product_id = saved_product_id;

  INSERT INTO public.price_tiers (product_id, tier_code, tier_name, price_idr)
  SELECT saved_product_id, tier_code, tier_name, price_idr
  FROM jsonb_to_recordset(p_tiers) AS tier(
    tier_code TEXT,
    tier_name TEXT,
    price_idr BIGINT
  );

  RETURN saved_product_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_with_tiers(
  BIGINT, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) TO anon, authenticated;

COMMIT;
