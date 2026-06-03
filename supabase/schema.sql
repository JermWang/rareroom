create extension if not exists "pgcrypto";

create type card_status as enum ('owned', 'for_trade', 'wishlist', 'locked');
create type verification_status as enum ('unverified', 'pending', 'verified', 'wallet_verified', 'disputed');
create type trade_status as enum ('draft', 'sent', 'countered', 'accepted', 'verification_pending', 'completed', 'cancelled', 'disputed');
create type trade_side as enum ('proposer', 'receiver');
create type proof_type as enum ('self_reported', 'screenshot', 'receipt_import', 'peer_confirmed_trade', 'admin_verified', 'wallet_signature', 'onchain_receipt');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  avatar_url text,
  wallet_address text,
  reputation_score integer not null default 0 check (reputation_score >= 0),
  collector_level integer not null default 1 check (collector_level >= 1),
  favorite_type text,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  set_name text not null,
  card_number text not null,
  rarity text not null,
  type text not null,
  generation text,
  image_url text,
  official_metadata_source text,
  created_at timestamptz not null default now()
);

create table public.user_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  condition text,
  language text default 'English',
  edition text,
  is_holo boolean not null default false,
  status card_status not null default 'owned',
  verification_status verification_status not null default 'unverified',
  proof_url text,
  estimated_value numeric(12, 2),
  created_at timestamptz not null default now()
);

create index user_cards_user_id_idx on public.user_cards(user_id);
create index user_cards_card_id_idx on public.user_cards(card_id);
create index user_cards_status_idx on public.user_cards(status);
create index user_cards_verification_idx on public.user_cards(verification_status);

create table public.trades (
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

create index trades_proposer_id_idx on public.trades(proposer_id);
create index trades_receiver_id_idx on public.trades(receiver_id);
create index trades_status_idx on public.trades(status);

create table public.trade_items (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  user_card_id uuid not null references public.user_cards(id) on delete cascade,
  side trade_side not null
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  body text not null check (char_length(body) <= 4000),
  created_at timestamptz not null default now()
);

create index messages_trade_id_created_at_idx on public.messages(trade_id, created_at);

create table public.verification_proofs (
  id uuid primary key default gen_random_uuid(),
  user_card_id uuid not null references public.user_cards(id) on delete cascade,
  type proof_type not null,
  proof_url text,
  status verification_status not null default 'pending',
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table public.reputation_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.user_cards enable row level security;
alter table public.trades enable row level security;
alter table public.trade_items enable row level security;
alter table public.messages enable row level security;
alter table public.verification_proofs enable row level security;
alter table public.reputation_events enable row level security;

create policy "Public cards are readable" on public.cards for select using (true);
create policy "Profiles are readable" on public.users for select using (true);
create policy "Users update own profile" on public.users for update using (auth.uid() = id);

create policy "Public user cards are readable" on public.user_cards for select using (true);
create policy "Users manage own cards" on public.user_cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Trade participants read trades" on public.trades for select using (auth.uid() in (proposer_id, receiver_id));
create policy "Users create proposed trades" on public.trades for insert with check (auth.uid() = proposer_id);
create policy "Trade participants update trades" on public.trades for update using (auth.uid() in (proposer_id, receiver_id));

create policy "Participants read trade messages" on public.messages for select using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);
create policy "Participants send trade messages" on public.messages for insert with check (
  auth.uid() = sender_id and exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);
