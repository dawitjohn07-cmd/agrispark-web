-- AgriSpark: create users profile row automatically when auth user is created.
-- Run this in Supabase SQL Editor.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, phone_number, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone_number', ''),
    coalesce(new.raw_user_meta_data->>'role', 'buyer')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone_number = excluded.phone_number,
        role = excluded.role;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
