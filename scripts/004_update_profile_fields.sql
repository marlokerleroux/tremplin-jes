-- Update profiles table to separate name and address fields
alter table public.profiles 
  drop column full_name,
  drop column address;

alter table public.profiles
  add column first_name text not null default '',
  add column last_name text not null default '',
  add column street_address text not null default '',
  add column city text not null default '',
  add column postal_code text not null default '';

-- Remove default constraints after adding columns
alter table public.profiles 
  alter column first_name drop default,
  alter column last_name drop default,
  alter column street_address drop default,
  alter column city drop default,
  alter column postal_code drop default;
