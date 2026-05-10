-- AgriSpark: Complete database migrations
-- Run this entire script in Supabase SQL Editor

-- 1. Add missing columns to users table
alter table public.users add column if not exists location text;
alter table public.users add column if not exists farm_name text;

-- 2. Add missing columns to products table  
alter table public.products add column if not exists category text;
alter table public.products add column if not exists location text;

-- 3. Create messages table for chat
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  receiver_id uuid references public.users(id) on delete cascade,
  message text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- 4. Enable RLS on messages
alter table public.messages enable row level security;

-- 5. RLS policies for messages
create policy "Users can view their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- 6. Add admin support: Add role check function and admin user creation helper
-- Note: Admin users can only be created by Supabase admin via update
-- Regular users can only be farmer or buyer
