-- Supprimer la contrainte unique sur application_id pour permettre plusieurs autorisations par candidature
alter table public.parental_authorizations drop constraint if exists parental_authorizations_application_id_key;

-- Ajouter des colonnes pour identifier le membre concerné
alter table public.parental_authorizations 
  add column if not exists member_index integer,
  add column if not exists member_name text;

-- Créer un index composite pour éviter les doublons (même candidature + même membre)
create unique index if not exists parental_authorizations_application_member_idx 
  on public.parental_authorizations(application_id, member_index);

-- Mettre à jour les autorisations existantes pour les artistes solo (member_index = 0)
update public.parental_authorizations
set member_index = 0
where member_index is null;
