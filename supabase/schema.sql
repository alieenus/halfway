-- HalfWay – schemat bazy (wklej całość w Supabase → SQL Editor → Run)

create table if not exists public.sports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  name        text not null,
  color       text not null,
  unit        text not null default 'powt.',
  position    int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  sport_id    uuid not null references public.sports on delete cascade,
  date        date not null,
  amount      numeric not null check (amount >= 0),
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, date);

-- Każdy widzi i zmienia tylko swoje dane
alter table public.sports  enable row level security;
alter table public.entries enable row level security;

drop policy if exists "own sports"  on public.sports;
drop policy if exists "own entries" on public.entries;

create policy "own sports" on public.sports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ===== v2: waga (raz w tygodniu) =====
create table if not exists public.weights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users on delete cascade,
  date        date not null,
  kg          numeric(5,1) not null check (kg > 0),
  created_at  timestamptz not null default now(),
  unique (user_id, date)
);
alter table public.weights enable row level security;
drop policy if exists "own weights" on public.weights;
create policy "own weights" on public.weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update, delete on public.weights to authenticated;
