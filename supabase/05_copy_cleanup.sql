-- ─────────────────────────────────────────────────────────────
--  Dorika — copy cleanup (run once in the Supabase SQL editor)
--
--  Why this is SQL and not code: these strings live in the database,
--  not in the repo. The homepage hero and the product names are stored
--  in `settings` and `products`, so editing the source files alone
--  cannot change what visitors see.
--
--  Safe to run more than once. Run the two SELECTs at the end first if
--  you want to see what will change.
-- ─────────────────────────────────────────────────────────────

-- 1. Homepage hero — remove the vague headline and the "heart of Nepal" tagline.
--    `address` rides along because it prints on every invoice and still
--    read "Khairenitar, Tanahun, Nepal".
update public.settings
set hero_headline = 'Your photo, made into string art.',
    hero_tagline  = 'Made by hand in Pokhara, Nepal. Delivered anywhere in the country.',
    address       = 'Pokhara, Nepal';

-- 2. Product names — em dash becomes a comma: "Custom String Face Art, 45cm"
update public.products
set name = replace(name, ' — ', ', ')
where name like '%—%';

-- 3. Product descriptions — the same substitution, only where a dash exists
update public.products
set description = replace(description, ' — ', '. ')
where description like '%—%';

-- 4. Anything still holding an em dash (should return zero rows afterwards)
select 'product'  as table_name, slug as ref, name        as value from public.products where name        like '%—%'
union all
select 'product'  as table_name, slug as ref, description as value from public.products where description like '%—%'
union all
select 'settings' as table_name, 'hero' as ref, hero_headline as value from public.settings where hero_headline like '%—%'
union all
select 'settings' as table_name, 'hero' as ref, hero_tagline  as value from public.settings where hero_tagline  like '%—%';
