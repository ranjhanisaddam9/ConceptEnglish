-- Concept English — core curriculum schema.
--
-- Design note: content is modelled generically so that future units (numbers,
-- sight words, phonics blends, ...) reuse the same two tables instead of each
-- getting its own. A `unit.kind` tells the app which renderer to use, and the
-- generic labels carry the unit-specific meaning:
--
--   kind          primary_label   secondary_label
--   ------------  --------------  ---------------
--   letters       "A"             "a"
--   numbers       "1"             "one"
--   sight_words   "the"           (null)
--   phonics       "ch"            (null)

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- admin_users — allow-list of Supabase Auth users who may edit curriculum.
-- ---------------------------------------------------------------------------

create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Auth users permitted to use /admin. Add a row after creating the user in Supabase Auth.';

-- security definer so the policies below can read this table without
-- recursing through its own RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- units
-- ---------------------------------------------------------------------------

create table public.units (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  kind         text not null default 'letters',
  description  text,
  order_index  integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint units_kind_check
    check (kind in ('letters', 'numbers', 'sight_words', 'phonics', 'custom')),
  constraint units_slug_format_check
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index units_order_idx on public.units (order_index, created_at);

-- ---------------------------------------------------------------------------
-- content_items — one row per letter / number / sight word.
-- ---------------------------------------------------------------------------

create table public.content_items (
  id               uuid primary key default gen_random_uuid(),
  unit_id          uuid not null references public.units (id) on delete cascade,
  primary_label    text not null,
  secondary_label  text,
  illustration_url text,
  audio_url        text,
  speech_text      text,
  order_index      integer not null default 0,
  tags             text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.content_items.tags is
  'Free-form labels a unit can filter by, e.g. the writing zone of a lowercase letter (grass/sky/root).';

comment on column public.content_items.audio_url is
  'Optional pre-recorded audio. When set the app plays it instead of speaking speech_text.';
comment on column public.content_items.speech_text is
  'Optional override for text-to-speech. Defaults to primary_label.';

create index content_items_unit_order_idx
  on public.content_items (unit_id, order_index, created_at);

-- ---------------------------------------------------------------------------
-- content_examples — the example words shown under an item ("A for Apple").
-- ---------------------------------------------------------------------------

create table public.content_examples (
  id          uuid primary key default gen_random_uuid(),
  item_id     uuid not null references public.content_items (id) on delete cascade,
  label       text not null,
  image_url   text,
  audio_url   text,
  speech_text text,
  order_index integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on column public.content_examples.speech_text is
  'Optional override for text-to-speech. Defaults to "<primary_label> for <label>".';

-- Deliberately not capped at 3 in the schema — the admin UI enforces the
-- teaching guideline, the database stays flexible.
create index content_examples_item_order_idx
  on public.content_examples (item_id, order_index, created_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger units_set_updated_at
  before update on public.units
  for each row execute function public.set_updated_at();

create trigger content_items_set_updated_at
  before update on public.content_items
  for each row execute function public.set_updated_at();

create trigger content_examples_set_updated_at
  before update on public.content_examples
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
--
-- Reads: anyone (including logged-out children on a classroom tablet) may read
--        published units and their content.
-- Writes: admins only.
-- ---------------------------------------------------------------------------

alter table public.admin_users      enable row level security;
alter table public.units            enable row level security;
alter table public.content_items    enable row level security;
alter table public.content_examples enable row level security;

create policy "Admins can read the admin list"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

create policy "Published units are readable by everyone"
  on public.units for select
  to anon, authenticated
  using (is_published or public.is_admin());

create policy "Admins can write units"
  on public.units for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Items in published units are readable by everyone"
  on public.content_items for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.units u
      where u.id = content_items.unit_id and u.is_published
    )
  );

create policy "Admins can write content items"
  on public.content_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Examples in published units are readable by everyone"
  on public.content_examples for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.content_items i
      join public.units u on u.id = i.unit_id
      where i.id = content_examples.item_id and u.is_published
    )
  );

create policy "Admins can write content examples"
  on public.content_examples for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
