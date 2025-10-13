-- Créer la table pour les autorisations parentales
create table if not exists public.parental_authorizations (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.applications(id) on delete cascade not null unique,
  pdf_url text not null,
  validated boolean default false,
  validated_by uuid references public.profiles(id),
  validated_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Activer RLS
alter table public.parental_authorizations enable row level security;

-- Policy pour que les utilisateurs puissent voir leur propre autorisation parentale
create policy "Users can view their own parental authorization"
on public.parental_authorizations for select
using (
  application_id in (
    select id from public.applications where user_id = auth.uid()
  )
);

-- Policy pour que les utilisateurs puissent insérer leur propre autorisation parentale
create policy "Users can insert their own parental authorization"
on public.parental_authorizations for insert
with check (
  application_id in (
    select id from public.applications where user_id = auth.uid()
  )
);

-- Policy pour que les utilisateurs puissent mettre à jour leur propre autorisation parentale (seulement si pas validée)
create policy "Users can update their own parental authorization if not validated"
on public.parental_authorizations for update
using (
  application_id in (
    select id from public.applications where user_id = auth.uid()
  )
  and validated = false
);

-- Policy pour que les utilisateurs puissent supprimer leur propre autorisation parentale (seulement si pas validée)
create policy "Users can delete their own parental authorization if not validated"
on public.parental_authorizations for delete
using (
  application_id in (
    select id from public.applications where user_id = auth.uid()
  )
  and validated = false
);

-- Policy pour que les admins puissent tout voir
create policy "Admins can view all parental authorizations"
on public.parental_authorizations for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Policy pour que les admins puissent tout mettre à jour
create policy "Admins can update all parental authorizations"
on public.parental_authorizations for update
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- Créer un index pour améliorer les performances
create index if not exists parental_authorizations_application_id_idx on public.parental_authorizations(application_id);
