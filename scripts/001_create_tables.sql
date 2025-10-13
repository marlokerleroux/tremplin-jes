-- Create profiles table for candidate information
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  address text not null,
  phone text not null,
  created_at timestamptz default now()
);

-- Create applications table for candidatures
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Type de candidature
  application_type text not null check (application_type in ('solo', 'group')),
  stage_name text not null,
  
  -- Composition du groupe (JSON array pour les membres)
  group_members jsonb,
  
  -- Informations artistiques
  biography text not null,
  musical_style text not null,
  has_original_composition boolean not null default false,
  is_sacem_registered boolean,
  allows_broadcast boolean not null default false,
  has_stage_experience boolean not null default false,
  stage_experience_details text,
  
  -- Date de préférence pour audition
  preferred_audition_date date,
  
  -- Statut de la candidature
  status text not null default 'pending' check (status in ('pending', 'validated', 'rejected')),
  
  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create technical_sheets table
create table if not exists public.technical_sheets (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null unique,
  
  -- Configuration scénique
  number_of_performers integer not null,
  stage_setup_time integer, -- en minutes
  
  -- Besoins techniques audio
  microphones_needed integer default 0,
  microphone_types text,
  di_boxes_needed integer default 0,
  monitors_needed integer default 0,
  
  -- Instruments et amplification
  instruments text,
  brings_own_amplification boolean default false,
  amplification_details text,
  
  -- Besoins électriques
  power_outlets_needed integer default 0,
  
  -- Éclairage
  lighting_requirements text,
  
  -- Autres besoins
  additional_requirements text,
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.technical_sheets enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Applications policies
create policy "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  using (auth.uid() = user_id);

-- Technical sheets policies
create policy "Users can view their own technical sheets"
  on public.technical_sheets for select
  using (
    exists (
      select 1 from public.applications
      where applications.id = technical_sheets.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can insert their own technical sheets"
  on public.technical_sheets for insert
  with check (
    exists (
      select 1 from public.applications
      where applications.id = technical_sheets.application_id
      and applications.user_id = auth.uid()
    )
  );

create policy "Users can update their own technical sheets"
  on public.technical_sheets for update
  using (
    exists (
      select 1 from public.applications
      where applications.id = technical_sheets.application_id
      and applications.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Create triggers for updated_at
create trigger applications_updated_at
  before update on public.applications
  for each row
  execute function public.handle_updated_at();

create trigger technical_sheets_updated_at
  before update on public.technical_sheets
  for each row
  execute function public.handle_updated_at();
