-- Create function to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Mise à jour pour utiliser les champs séparés (first_name, last_name, street_address, city, postal_code)
  insert into public.profiles (id, first_name, last_name, email, street_address, city, postal_code, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'street_address', ''),
    coalesce(new.raw_user_meta_data ->> 'city', ''),
    coalesce(new.raw_user_meta_data ->> 'postal_code', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
