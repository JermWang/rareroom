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

alter type proof_type add value if not exists 'official_metadata_match';
alter type proof_type add value if not exists 'platform_connection';
alter type proof_type add value if not exists 'marketplace_inventory';
alter type proof_type add value if not exists 'partner_api_attestation';
alter type proof_type add value if not exists 'admin_review';

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  avatar_url text,
  wallet_address text,
  wallet_chain text,
  reputation_score integer not null default 0 check (reputation_score >= 0),
  collector_level integer not null default 1 check (collector_level >= 1),
  favorite_type text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.users add column if not exists wallet_chain text;

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
  validation_source_provider text,
  validation_external_reference text,
  validation_checked_at timestamptz,
  trade_eligible boolean not null default false,
  estimated_value numeric(12, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_cards add column if not exists validation_source_provider text;
alter table public.user_cards add column if not exists validation_external_reference text;
alter table public.user_cards add column if not exists validation_checked_at timestamptz;
alter table public.user_cards add column if not exists trade_eligible boolean not null default false;

create index if not exists user_cards_user_id_idx on public.user_cards(user_id);
create index if not exists user_cards_card_id_idx on public.user_cards(card_id);
create index if not exists user_cards_status_idx on public.user_cards(status);
create index if not exists user_cards_verification_idx on public.user_cards(verification_status);
create index if not exists user_cards_user_status_idx on public.user_cards(user_id, status);
create index if not exists user_cards_trade_eligible_idx on public.user_cards(trade_eligible);

create table if not exists public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  external_account_id text,
  status text not null default 'pending' check (status in ('pending', 'verified', 'revoked', 'error')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  scopes text[] not null default '{}',
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create index if not exists provider_connections_user_provider_idx on public.provider_connections(user_id, provider);

create table if not exists public.wallet_link_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  wallet_address text not null,
  wallet_chain text not null check (wallet_chain in ('evm', 'solana')),
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wallet_link_challenges_user_id_idx on public.wallet_link_challenges(user_id);
create index if not exists wallet_link_challenges_expires_at_idx on public.wallet_link_challenges(expires_at);
create unique index if not exists users_wallet_chain_address_unique
on public.users(wallet_chain, wallet_address)
where wallet_address is not null;

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
  source_provider text,
  external_reference text,
  verification_payload jsonb not null default '{}'::jsonb,
  confidence_score numeric(5, 2),
  is_trade_grade boolean not null default false,
  verified_at timestamptz,
  expires_at timestamptz,
  reviewed_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

alter table public.verification_proofs add column if not exists source_provider text;
alter table public.verification_proofs add column if not exists external_reference text;
alter table public.verification_proofs add column if not exists verification_payload jsonb not null default '{}'::jsonb;
alter table public.verification_proofs add column if not exists confidence_score numeric(5, 2);
alter table public.verification_proofs add column if not exists is_trade_grade boolean not null default false;
alter table public.verification_proofs add column if not exists verified_at timestamptz;
alter table public.verification_proofs add column if not exists expires_at timestamptz;

create index if not exists verification_proofs_user_card_id_idx on public.verification_proofs(user_card_id);
create index if not exists verification_proofs_status_idx on public.verification_proofs(status);
create index if not exists verification_proofs_trade_grade_idx on public.verification_proofs(user_card_id, is_trade_grade, status);

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

drop trigger if exists set_provider_connections_updated_at on public.provider_connections;
create trigger set_provider_connections_updated_at
before update on public.provider_connections
for each row execute function public.set_updated_at();

create or replace function public.sync_user_card_trade_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user_card_id uuid;
  has_wallet_proof boolean;
  has_trade_grade_proof boolean;
  has_pending_proof boolean;
  latest_proof_url text;
  latest_source text;
  latest_reference text;
begin
  target_user_card_id := coalesce(new.user_card_id, old.user_card_id);

  select exists (
    select 1 from public.verification_proofs vp
    where vp.user_card_id = target_user_card_id
      and vp.status in ('verified', 'wallet_verified')
      and vp.is_trade_grade = true
      and vp.type::text in ('wallet_signature', 'onchain_receipt')
  ) into has_wallet_proof;

  select exists (
    select 1 from public.verification_proofs vp
    where vp.user_card_id = target_user_card_id
      and vp.status in ('verified', 'wallet_verified')
      and vp.is_trade_grade = true
      and vp.type::text in ('platform_connection', 'marketplace_inventory', 'partner_api_attestation', 'wallet_signature', 'onchain_receipt')
      and (vp.expires_at is null or vp.expires_at > now())
  ) into has_trade_grade_proof;

  select exists (
    select 1 from public.verification_proofs vp
    where vp.user_card_id = target_user_card_id
      and vp.status = 'pending'
  ) into has_pending_proof;

  select vp.proof_url, vp.source_provider, vp.external_reference
  into latest_proof_url, latest_source, latest_reference
  from public.verification_proofs vp
  where vp.user_card_id = target_user_card_id
    and vp.status in ('verified', 'wallet_verified')
    and vp.is_trade_grade = true
  order by vp.verified_at desc nulls last, vp.created_at desc
  limit 1;

  update public.user_cards
  set
    trade_eligible = has_trade_grade_proof,
    verification_status = case
      when has_wallet_proof then 'wallet_verified'::verification_status
      when has_trade_grade_proof then 'verified'::verification_status
      when has_pending_proof then 'pending'::verification_status
      else 'unverified'::verification_status
    end,
    proof_url = latest_proof_url,
    validation_source_provider = latest_source,
    validation_external_reference = latest_reference,
    validation_checked_at = case when has_trade_grade_proof then now() else validation_checked_at end
  where id = target_user_card_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_user_card_trade_eligibility_insert on public.verification_proofs;
create trigger sync_user_card_trade_eligibility_insert
after insert or update on public.verification_proofs
for each row execute function public.sync_user_card_trade_eligibility();

drop trigger if exists sync_user_card_trade_eligibility_delete on public.verification_proofs;
create trigger sync_user_card_trade_eligibility_delete
after delete on public.verification_proofs
for each row execute function public.sync_user_card_trade_eligibility();

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
alter table public.provider_connections enable row level security;
alter table public.wallet_link_challenges enable row level security;
alter table public.reputation_events enable row level security;

revoke select on public.users from anon, authenticated;
grant select (id, username, avatar_url, reputation_score, collector_level, favorite_type, created_at)
on public.users to anon, authenticated;

revoke update on public.users from authenticated;
grant update (username, avatar_url, favorite_type)
on public.users to authenticated;

revoke insert, update, delete on public.cards from anon, authenticated;
revoke insert, update, delete on public.user_cards from anon, authenticated;
revoke insert, update, delete on public.provider_connections from anon, authenticated;
revoke insert, update, delete on public.wallet_link_challenges from anon, authenticated;
revoke insert, update, delete on public.trades from anon, authenticated;
revoke insert, update, delete on public.trade_items from anon, authenticated;
revoke insert, update, delete on public.messages from anon, authenticated;
revoke insert, update, delete on public.verification_proofs from anon, authenticated;
revoke insert, update, delete on public.reputation_events from anon, authenticated;

revoke select on public.provider_connections from anon, authenticated;
grant select (id, user_id, provider, external_account_id, status, scopes, last_verified_at, created_at, updated_at)
on public.provider_connections to authenticated;

revoke select on public.wallet_link_challenges from anon, authenticated;

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

drop policy if exists "Public for-trade and wishlist cards are readable" on public.user_cards;
create policy "Public for-trade and wishlist cards are readable" on public.user_cards
for select using (
  auth.uid() = user_id
  or status = 'wishlist'
  or (status = 'for_trade' and trade_eligible = true)
);

drop policy if exists "Users manage own cards" on public.user_cards;

drop policy if exists "Users read own provider connections" on public.provider_connections;
create policy "Users read own provider connections" on public.provider_connections
for select using (auth.uid() = user_id);

drop policy if exists "Users create own provider connections" on public.provider_connections;

drop policy if exists "Users update own provider connections" on public.provider_connections;

drop policy if exists "Trade participants read trades" on public.trades;
create policy "Trade participants read trades" on public.trades
for select using (auth.uid() in (proposer_id, receiver_id));

drop policy if exists "Users create proposed trades" on public.trades;

drop policy if exists "Trade participants update trades" on public.trades;

drop policy if exists "Trade participants read trade items" on public.trade_items;
create policy "Trade participants read trade items" on public.trade_items
for select using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Trade participants manage trade items" on public.trade_items;

drop policy if exists "Participants read trade messages" on public.messages;
create policy "Participants read trade messages" on public.messages
for select using (
  exists (
    select 1 from public.trades t
    where t.id = trade_id and auth.uid() in (t.proposer_id, t.receiver_id)
  )
);

drop policy if exists "Participants send trade messages" on public.messages;

drop policy if exists "Users read own verification proofs" on public.verification_proofs;
create policy "Users read own verification proofs" on public.verification_proofs
for select using (
  exists (
    select 1 from public.user_cards uc
    where uc.id = user_card_id and uc.user_id = auth.uid()
  )
);

drop policy if exists "Users create own verification proofs" on public.verification_proofs;

drop policy if exists "Reputation events are readable" on public.reputation_events;
create policy "Reputation events are readable" on public.reputation_events
for select using (true);

-- Admin overrides, gated by users.is_admin. Codified to match the live database
-- so rebuilds from this file are predictable.
drop policy if exists "Admins read all trades" on public.trades;
create policy "Admins read all trades" on public.trades
for select using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "Admins update all trades" on public.trades;
create policy "Admins update all trades" on public.trades
for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "Admins read all user cards" on public.user_cards;
create policy "Admins read all user cards" on public.user_cards
for select using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "Admins update user card verification" on public.user_cards;
create policy "Admins update user card verification" on public.user_cards
for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "Admins read all verification proofs" on public.verification_proofs;
create policy "Admins read all verification proofs" on public.verification_proofs
for select using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

drop policy if exists "Admins update verification proofs" on public.verification_proofs;
create policy "Admins update verification proofs" on public.verification_proofs
for update using (exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true));

-- ---------------------------------------------------------------------------
-- Atomic trade creation (trade + items + note in one transaction).
-- ---------------------------------------------------------------------------
create or replace function public.create_trade_atomic(
  p_proposer_id uuid,
  p_receiver_id uuid,
  p_proposer_card_ids uuid[],
  p_receiver_card_ids uuid[],
  p_note text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_trade_id uuid;
  v_id uuid;
begin
  if p_proposer_id = p_receiver_id then
    raise exception 'proposer and receiver must differ';
  end if;
  if coalesce(array_length(p_proposer_card_ids, 1), 0) = 0
     or coalesce(array_length(p_receiver_card_ids, 1), 0) = 0 then
    raise exception 'both sides require at least one card';
  end if;

  if exists (
    select 1 from unnest(p_proposer_card_ids) as cid
    where not exists (
      select 1 from public.user_cards uc
      where uc.id = cid and uc.user_id = p_proposer_id
        and uc.trade_eligible = true
        and uc.verification_status in ('verified', 'wallet_verified')
    )
  ) then
    raise exception 'invalid proposer card';
  end if;

  if exists (
    select 1 from unnest(p_receiver_card_ids) as cid
    where not exists (
      select 1 from public.user_cards uc
      where uc.id = cid and uc.user_id = p_receiver_id
        and uc.status = 'for_trade'
        and uc.trade_eligible = true
        and uc.verification_status in ('verified', 'wallet_verified')
    )
  ) then
    raise exception 'invalid receiver card';
  end if;

  insert into public.trades (proposer_id, receiver_id, status)
  values (p_proposer_id, p_receiver_id, 'sent')
  returning id into v_trade_id;

  foreach v_id in array p_proposer_card_ids loop
    insert into public.trade_items (trade_id, user_card_id, side) values (v_trade_id, v_id, 'proposer');
  end loop;
  foreach v_id in array p_receiver_card_ids loop
    insert into public.trade_items (trade_id, user_card_id, side) values (v_trade_id, v_id, 'receiver');
  end loop;

  if p_note is not null and length(btrim(p_note)) > 0 then
    insert into public.messages (trade_id, sender_id, body)
    values (v_trade_id, p_proposer_id, left(btrim(p_note), 4000));
  end if;

  return v_trade_id;
end;
$function$;

revoke execute on function public.create_trade_atomic(uuid, uuid, uuid[], uuid[], text) from public;
revoke execute on function public.create_trade_atomic(uuid, uuid, uuid[], uuid[], text) from anon;
revoke execute on function public.create_trade_atomic(uuid, uuid, uuid[], uuid[], text) from authenticated;

-- ---------------------------------------------------------------------------
-- Distributed fixed-window API rate limiter.
-- ---------------------------------------------------------------------------
create table if not exists public.api_rate_limits (
  bucket_key text not null,
  window_start timestamptz not null,
  hits integer not null default 0,
  primary key (bucket_key, window_start)
);

alter table public.api_rate_limits enable row level security;

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.api_rate_limits (bucket_key, window_start, hits)
  values (p_key, v_window, 1)
  on conflict (bucket_key, window_start)
  do update set hits = public.api_rate_limits.hits + 1
  returning hits into v_hits;

  if random() < 0.01 then
    delete from public.api_rate_limits where window_start < now() - interval '1 hour';
  end if;

  return v_hits <= p_limit;
end;
$function$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public;
revoke execute on function public.check_rate_limit(text, integer, integer) from anon;
revoke execute on function public.check_rate_limit(text, integer, integer) from authenticated;
