-- Storage buckets for curriculum artwork.
--
-- Both buckets are public-read: the images are classroom illustrations, and a
-- public URL means the Letter Page needs no signed-URL round trip on a tablet.
-- Uploading and deleting stays restricted to admins.

insert into storage.buckets (id, name, public)
values
  ('illustrations', 'illustrations', true),
  ('examples', 'examples', true)
on conflict (id) do update set public = excluded.public;

-- Note: if your Supabase project restricts DDL on storage.objects, these
-- policies can fail to apply. In that case create the equivalent policies from
-- Dashboard > Storage > Policies; see README ("Storage policies") for details.

create policy "Curriculum images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id in ('illustrations', 'examples'));

create policy "Admins can upload curriculum images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('illustrations', 'examples') and public.is_admin());

create policy "Admins can update curriculum images"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('illustrations', 'examples') and public.is_admin())
  with check (bucket_id in ('illustrations', 'examples') and public.is_admin());

create policy "Admins can delete curriculum images"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('illustrations', 'examples') and public.is_admin());
