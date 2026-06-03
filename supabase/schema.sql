create extension if not exists "pgcrypto";

do $$ begin
  create type card_status as enum ('owned', 'for_trade', 'wishlist', 'locked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'wallet_verified', 'disputed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type trade_status as enum ('draft', 'sent', 'countered', 'accepted', 'verification_pending', 'completed', 'cancelled', 'disputed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type trade_side as enum ('proposer', 'receiver');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type proof_type as enum ('self_reported', 'screenshot', 'receipt_import', 'peer_confirmed_trade', 'admin_verified', 'wallet_signature', 'onchain_receipt');
exception when duplicate_object then null;
end $$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  avatar_url text,
  wallet_address text,
  reputation_score integer not null default 0 check (reputation_score >= 0),
  collector_level integer not null default 1 check (collector_level >= 1),
  favorite_type text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  set_name text not null,
  card_number text not null,
  rarity text not null,
  type text not null,
  generation text,
  image_url text,
  official_metadata_source text,
  created_at timestamptz not null default now(),
  unique (name, set_name, card_number)
);

create table if not exists public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  condition text default 'Near Mint',
  language text default 'English',
  edition text,
  is_holo boolean not null default false,
  status card_status not null default 'owned',
  verification_status verification_status not null default 'unverified',
  proof_url text,
  estimated_value numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_cards_user_id_idx on public.user_cards(user_id);
create index if not exists user_cards_card_id_idx on public.user_cards(card_id);
create index if not exists user_cards_status_idx on public.user_cards(status);
create index if not exists user_cards_verification_idx on public.user_cards(verification_status);
create index if not exists user_cards_user_status_idx on public.user_cards(user_id, status);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  status trade_status not null default 'draft',
  proposer_confirmed boolean not null default false,
  receiver_confirmed boolean not null default false,
  fairness_score numeric(5, 2),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists trades_proposer_id_idx on public.trades(proposer_id);
create index if not exists trades_receiver_id_idx on public.trades(receiver_id);
create index if not exists trades_status_idx on public.trades(status);
create index if not exists trades_participants_idx on public.trades(proposer_id, receiver_id);

create table if not exists public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  user_card_id uuid not null references public.user_cards(id) on delete cascade,
  side trade_side not null,
  unique (trade_id, user_card_id)
);

create index if not exists trade_items_trade_id_idx on public.trade_items(trade_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index if not exists messages_trade_id_created_at_idx on public.messages(trade_id, created_at);

create table if not exists public.verification_proofs (
  id uuid primary key default gen_random_uuid(),
  user_card_id uuid not null references public.user_cards(id) on delete cascade,
  type proof_type not null,
  proof_url text,
  status verification_status not null default 'pending',
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists verification_proofs_user_card_id_idx on public.verification_proofs(user_card_id);
create index if not exists verification_proofs_status_idx on public.verification_proofs(status);

create table if not exists public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists reputation_events_user_id_created_at_idx on public.reputation_events(user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_user_cards_updated_at on public.user_cards;
create trigger set_user_cards_updated_at
before update on public.user_cards
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
begin
  base_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1),
    'collector'
  );

  insert into public.users (id, username, email)
  values (
    new.id,
    regexp_replace(base_username, '[^a-zA-Z0-9_]', '', 'g') || '-' || substr(new.id::text, 1, 6),
    coalesce(new.email, new.id::text || '@rareroom.local')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.messages enable row level security;
alter table public.verification_proofs enable row level security;
alter table public.reputation_events enable row level security;

drop policy if exists "Profiles are readable" on public.users;
create policy "Profiles are readable" on public.users
for select using (true);

drop policy if exists "Users update own profile" on public.users;
create policy "Users update own profile" on public.users
for update using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Public cards are readable" on public.cards;
create policy "Public cards are readable" on public.cards
for select using (true);

drop policy if exists "Authenticated users can insert catalog cards" on public.cards;
create policy "Authenticated users can insert catalog cards" on public.cards
for insert to authenticated
with check (true);

drop policy if exists "Public for-trade and wishlist cards are readable" on public.user_cards;
create policy "Public for-trade and wishlist cards are readable" on public.user_cards
for select using (
  auth.uid() = user_id
  or status in ('for_trade', 'wishlist')
);

drop policy if exists "Users manage own cards" on public.user_cards;
create policy "Users manage own cards" on public.user_cards
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Trade participants read trades" on public.trades;
create policy "Trade participants read trades" on public.trades
for select using (auth.uid() in (proposer_id, receiver_id));

drop policy if exists "Users create proposed trades" on public.trades;
create policy "Users create proposed trades" on public.trades
for insert with check (auth.uid() = proposer_id);

drop policy if exists "Trade participants update trades" on public.trades;
create policy "Trade participants update trades" on public.trades
for update using (auth.uid() in (proposer_id, receiver_id))
with check (auth.uid() in (proposer_id, receiver_id));

drop policy if exists "Trade participants read trade items" on public.trade_items;
create policy "Trade participants read trade items" on public.trade_items
for select using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Trade participants manage trade items" on public.trade_items;
create policy "Trade participants manage trade items" on public.trade_items
for all using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
)
with check (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Participants read trade messages" on public.messages;
create policy "Participants read trade messages" on public.messages
for select using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Participants send trade messages" on public.messages;
create policy "Participants send trade messages" on public.messages
for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Users read own verification proofs" on public.verification_proofs;
create policy "Users read own verification proofs" on public.verification_proofs
for select using (
  exists (
    select 1 from public.user_cards uc
    where uc.id = user_card_id and uc.user_id = auth.uid()
  )
);

drop policy if exists "Users create own verification proofs" on public.verification_proofs;
create policy "Users create own verification proofs" on public.verification_proofs
for insert with check (
  exists (
    select 1 from public.user_cards uc
    where uc.id = user_card_id and uc.user_id = auth.uid()
  )
);

drop policy if exists "Reputation events are readable" on public.reputation_events;
create policy "Reputation events are readable" on public.reputation_events
for select using (true);
