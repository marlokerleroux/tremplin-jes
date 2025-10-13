-- Create SMTP configuration table
create table if not exists public.smtp_config (
  id uuid primary key default gen_random_uuid(),
  smtp_host text not null,
  smtp_port integer not null default 587,
  smtp_username text not null,
  smtp_password text not null,
  smtp_from_email text not null,
  smtp_from_name text not null,
  smtp_secure boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.smtp_config enable row level security;

-- Only admins can view and manage SMTP config
create policy "Admins can view SMTP config"
on public.smtp_config for select
using (is_admin());

create policy "Admins can update SMTP config"
on public.smtp_config for update
using (is_admin());

create policy "Admins can insert SMTP config"
on public.smtp_config for insert
with check (is_admin());

-- Insert default SMTP config (empty values to be filled by admin)
insert into public.smtp_config (smtp_host, smtp_port, smtp_username, smtp_password, smtp_from_email, smtp_from_name, smtp_secure)
values ('', 587, '', '', '', 'Tremplin Musical Breton', true)
on conflict do nothing;
