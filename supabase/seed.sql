-- Seed data for Unit 1 — The Alphabet.
--
-- Safe to re-run: if a unit with slug 'unit-1' already exists the whole block
-- is skipped, so this will never clobber content you have edited in /admin.
--
-- Images are intentionally left null. The Letter Page renders a coloured
-- letter tile when an illustration is missing, so the app is demoable before
-- any artwork has been uploaded. Add real images from /admin.

do $$
declare
  v_unit_id uuid;
  v_item_id uuid;
  v_letter  record;
  v_i       int;
begin
  if exists (select 1 from public.units where slug = 'unit-1') then
    raise notice 'Unit "unit-1" already exists — skipping seed.';
    return;
  end if;

  insert into public.units (title, slug, kind, description, order_index, is_published)
  values (
    'Unit 1 · Letters',
    'unit-1',
    'letters',
    'Letter recognition, letter sounds, and three example words for every letter.',
    1,
    true
  )
  returning id into v_unit_id;

  for v_letter in
    select * from (values
      ( 1, 'A', 'a', array['Apple', 'Ant', 'Alligator']),
      ( 2, 'B', 'b', array['Ball', 'Bear', 'Banana']),
      ( 3, 'C', 'c', array['Cat', 'Car', 'Cake']),
      ( 4, 'D', 'd', array['Dog', 'Duck', 'Drum']),
      ( 5, 'E', 'e', array['Egg', 'Elephant', 'Envelope']),
      ( 6, 'F', 'f', array['Fish', 'Frog', 'Flower']),
      ( 7, 'G', 'g', array['Goat', 'Grapes', 'Guitar']),
      ( 8, 'H', 'h', array['Hat', 'Horse', 'House']),
      ( 9, 'I', 'i', array['Igloo', 'Insect', 'Ink']),
      (10, 'J', 'j', array['Jam', 'Jug', 'Jellyfish']),
      (11, 'K', 'k', array['Kite', 'Key', 'Kangaroo']),
      (12, 'L', 'l', array['Lion', 'Leaf', 'Lamp']),
      (13, 'M', 'm', array['Moon', 'Mouse', 'Milk']),
      (14, 'N', 'n', array['Nest', 'Nose', 'Net']),
      (15, 'O', 'o', array['Octopus', 'Orange', 'Ostrich']),
      (16, 'P', 'p', array['Pig', 'Pencil', 'Panda']),
      (17, 'Q', 'q', array['Queen', 'Quilt', 'Question']),
      (18, 'R', 'r', array['Rabbit', 'Rainbow', 'Ring']),
      (19, 'S', 's', array['Sun', 'Star', 'Snake']),
      (20, 'T', 't', array['Tree', 'Tiger', 'Train']),
      (21, 'U', 'u', array['Umbrella', 'Uniform', 'Up']),
      (22, 'V', 'v', array['Van', 'Violin', 'Volcano']),
      (23, 'W', 'w', array['Watch', 'Whale', 'Window']),
      (24, 'X', 'x', array['Xylophone', 'X-ray', 'Fox']),
      (25, 'Y', 'y', array['Yak', 'Yo-yo', 'Yellow']),
      (26, 'Z', 'z', array['Zebra', 'Zip', 'Zoo'])
    ) as t(idx, upper_label, lower_label, examples)
  loop
    insert into public.content_items (unit_id, primary_label, secondary_label, order_index)
    values (v_unit_id, v_letter.upper_label, v_letter.lower_label, v_letter.idx)
    returning id into v_item_id;

    for v_i in 1 .. array_length(v_letter.examples, 1) loop
      insert into public.content_examples (item_id, label, order_index)
      values (v_item_id, v_letter.examples[v_i], v_i);
    end loop;
  end loop;

  raise notice 'Seeded Unit 1 with 26 letters and 78 example words.';
end
$$;
