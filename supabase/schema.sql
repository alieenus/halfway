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
