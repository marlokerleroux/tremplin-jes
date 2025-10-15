-- Ajouter une contrainte unique sur user_id pour empêcher les candidatures en double
-- Un utilisateur ne peut avoir qu'une seule candidature

-- D'abord, supprimer les doublons existants (garder seulement la première candidature de chaque utilisateur)
DELETE FROM applications
WHERE id NOT IN (
  SELECT MIN(id)
  FROM applications
  GROUP BY user_id
);

-- Ajouter la contrainte unique
ALTER TABLE applications
ADD CONSTRAINT applications_user_id_unique UNIQUE (user_id);

-- Ajouter un commentaire pour documenter la contrainte
COMMENT ON CONSTRAINT applications_user_id_unique ON applications IS 
'Empêche un utilisateur de créer plusieurs candidatures';
