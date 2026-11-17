BEGIN;

DROP POLICY IF EXISTS "public read coffee ingredients"
  ON public.coffee_ingredients;
DROP POLICY IF EXISTS "public manage coffee ingredients"
  ON public.coffee_ingredients;
CREATE POLICY "public manage coffee ingredients"
  ON public.coffee_ingredients
  FOR ALL TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "public read coffee menus" ON public.coffee_menus;
DROP POLICY IF EXISTS "public manage coffee menus" ON public.coffee_menus;
CREATE POLICY "public manage coffee menus"
  ON public.coffee_menus
  FOR ALL TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "public read coffee menu recipes"
  ON public.coffee_menu_recipes;
DROP POLICY IF EXISTS "public manage coffee menu recipes"
  ON public.coffee_menu_recipes;
CREATE POLICY "public manage coffee menu recipes"
  ON public.coffee_menu_recipes
  FOR ALL TO anon, authenticated
  USING (TRUE)
  WITH CHECK (TRUE);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON public.coffee_ingredients,
     public.coffee_menus,
     public.coffee_menu_recipes
  TO anon, authenticated;

GRANT USAGE, SELECT ON SEQUENCE
  public.coffee_ingredients_id_seq,
  public.coffee_menus_id_seq,
  public.coffee_menu_recipes_id_seq
  TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.save_coffee_menu(
  p_menu_id BIGINT,
  p_name TEXT,
  p_is_sub_recipe BOOLEAN,
  p_recipes JSONB
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  saved_menu_id BIGINT;
BEGIN
  IF NULLIF(BTRIM(p_name), '') IS NULL
     OR p_is_sub_recipe IS NULL
     OR p_recipes IS NULL
     OR jsonb_typeof(p_recipes) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_recipes) = 0 THEN
    RAISE EXCEPTION 'Nama menu dan minimal satu resep wajib diisi.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_recipes) AS recipe(
      ingredient_id BIGINT,
      amount NUMERIC
    )
    WHERE ingredient_id IS NULL
       OR amount IS NULL
       OR amount <= 0
  ) THEN
    RAISE EXCEPTION 'Bahan dan takaran resep harus valid dan lebih dari 0.';
  END IF;

  IF (
    SELECT COUNT(*) <> COUNT(DISTINCT ingredient_id)
    FROM jsonb_to_recordset(p_recipes) AS recipe(
      ingredient_id BIGINT,
      amount NUMERIC
    )
  ) THEN
    RAISE EXCEPTION 'Bahan yang sama tidak boleh berulang dalam satu menu.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_to_recordset(p_recipes) AS recipe(
      ingredient_id BIGINT,
      amount NUMERIC
    )
    LEFT JOIN public.coffee_ingredients AS ingredient
      ON ingredient.id = recipe.ingredient_id
    WHERE ingredient.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Salah satu bahan resep tidak ditemukan.';
  END IF;

  IF p_menu_id IS NULL THEN
    INSERT INTO public.coffee_menus (name, is_sub_recipe)
    VALUES (BTRIM(p_name), p_is_sub_recipe)
    RETURNING id INTO saved_menu_id;
  ELSE
    UPDATE public.coffee_menus
    SET name = BTRIM(p_name),
        is_sub_recipe = p_is_sub_recipe
    WHERE id = p_menu_id
    RETURNING id INTO saved_menu_id;

    IF saved_menu_id IS NULL THEN
      RAISE EXCEPTION 'Menu yang akan diubah tidak ditemukan.';
    END IF;
  END IF;

  DELETE FROM public.coffee_menu_recipes
  WHERE menu_id = saved_menu_id;

  INSERT INTO public.coffee_menu_recipes (menu_id, ingredient_id, amount)
  SELECT saved_menu_id, recipe.ingredient_id, recipe.amount
  FROM jsonb_to_recordset(p_recipes) AS recipe(
    ingredient_id BIGINT,
    amount NUMERIC
  );

  RETURN saved_menu_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_coffee_menu(
  BIGINT, TEXT, BOOLEAN, JSONB
) TO anon, authenticated;

COMMIT;
