-- Run this in the Supabase SQL Editor after creating your project.
-- Go to: supabase.com → your project → SQL Editor → New Query → paste this → Run

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text not null,
  full_name           text,
  role                text not null default 'volunteer' check (role in ('organizer', 'volunteer')),
  must_change_password boolean not null default false,
  created_at          timestamptz default now()
);

-- Auto-create a profile row whenever a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- EVENTS
-- ============================================================
create table events (
  id            uuid primary key default gen_random_uuid(),
  organizer_id  uuid not null references profiles(id) on delete cascade,
  title         text not null,
  description   text,
  location      text,
  event_date    date not null,
  is_published  boolean not null default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ============================================================
-- SLOTS (time blocks within an event)
-- ============================================================
create table slots (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  title         text not null,
  description   text,
  start_time    timestamptz not null,
  end_time      timestamptz not null,
  max_capacity  int not null default 1 check (max_capacity > 0),
  created_at    timestamptz default now()
);

-- ============================================================
-- SIGNUPS
-- ============================================================
create table signups (
  id              uuid primary key default gen_random_uuid(),
  slot_id         uuid not null references slots(id) on delete cascade,
  volunteer_id    uuid references profiles(id) on delete cascade,
  email           text,
  phone           text,
  notes           text,
  status          text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  signed_up_at    timestamptz default now(),
  cancelled_at    timestamptz,
  unique (slot_id, volunteer_id)
);

-- Prevent same email from signing up for the same slot twice
create unique index signups_slot_email_unique
  on signups (slot_id, lower(email)) where email is not null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table events   enable row level security;
alter table slots    enable row level security;
alter table signups  enable row level security;

-- profiles: anyone logged in can read; users can only update their own
create policy "profiles_read"   on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- events: anyone can read published events; organizer can do everything to their own
create policy "events_read_published" on events for select
  using (is_published = true or auth.uid() = organizer_id);
create policy "events_insert" on events for insert
  with check (auth.uid() = organizer_id);
create policy "events_update" on events for update
  using (auth.uid() = organizer_id);
create policy "events_delete" on events for delete
  using (auth.uid() = organizer_id);

-- slots: readable by anyone (public); writable only by the event's organizer
create policy "slots_read" on slots for select using (true);
create policy "slots_insert" on slots for insert
  with check (
    auth.uid() = (select organizer_id from events where id = event_id)
  );
create policy "slots_update" on slots for update
  using (
    auth.uid() = (select organizer_id from events where id = event_id)
  );
create policy "slots_delete" on slots for delete
  using (
    auth.uid() = (select organizer_id from events where id = event_id)
  );

-- signups: anyone can read (for capacity display); anonymous volunteers can insert; organizer can update
create policy "signups_read" on signups for select using (true);
create policy "signups_insert" on signups for insert
  with check (volunteer_id is null or auth.uid() = volunteer_id);
create policy "signups_update" on signups for update
  using (
    auth.uid() = volunteer_id
    or auth.uid() = (
      select organizer_id from events e
      join slots s on s.event_id = e.id
      where s.id = slot_id
    )
  );

-- ============================================================
-- MIGRATION: Run this if upgrading an existing database
-- ============================================================
-- alter table signups add column if not exists email text;
-- alter table signups add column if not exists phone text;
-- alter table signups alter column volunteer_id drop not null;
-- create unique index if not exists signups_slot_email_unique
--   on signups (slot_id, lower(email)) where email is not null;
-- drop policy if exists "signups_read" on signups;
-- create policy "signups_read" on signups for select using (true);
-- drop policy if exists "signups_insert" on signups;
-- create policy "signups_insert" on signups for insert
--   with check (volunteer_id is null or auth.uid() = volunteer_id);
-- drop policy if exists "signups_update" on signups;
-- create policy "signups_update" on signups for update
--   using (
--     auth.uid() = volunteer_id
--     or auth.uid() = (
--       select organizer_id from events e
--       join slots s on s.event_id = e.id
--       where s.id = slot_id
--     )
--   );
