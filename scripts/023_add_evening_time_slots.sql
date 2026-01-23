-- Ajouter les créneaux du soir jusqu'à 18h30 pour les deux journées d'auditions
-- Créneaux de 10 minutes de 17h00 à 18h30

-- Samedi 31 janvier 2026
INSERT INTO time_slots (date, start_time, end_time, is_available) VALUES
('2026-01-31', '17:00', '17:10', true),
('2026-01-31', '17:10', '17:20', true),
('2026-01-31', '17:20', '17:30', true),
('2026-01-31', '17:30', '17:40', true),
('2026-01-31', '17:40', '17:50', true),
('2026-01-31', '17:50', '18:00', true),
('2026-01-31', '18:00', '18:10', true),
('2026-01-31', '18:10', '18:20', true),
('2026-01-31', '18:20', '18:30', true)
ON CONFLICT DO NOTHING;

-- Dimanche 1er février 2026
INSERT INTO time_slots (date, start_time, end_time, is_available) VALUES
('2026-02-01', '17:00', '17:10', true),
('2026-02-01', '17:10', '17:20', true),
('2026-02-01', '17:20', '17:30', true),
('2026-02-01', '17:30', '17:40', true),
('2026-02-01', '17:40', '17:50', true),
('2026-02-01', '17:50', '18:00', true),
('2026-02-01', '18:00', '18:10', true),
('2026-02-01', '18:10', '18:20', true),
('2026-02-01', '18:20', '18:30', true)
ON CONFLICT DO NOTHING;
