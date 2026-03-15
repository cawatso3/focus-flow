
-- Fix function search_path for handle_new_user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Remove overly permissive service role policies on api_keys
drop policy if exists "Service role can read api_keys" on public.api_keys;
drop policy if exists "Service role can update api_keys" on public.api_keys;
