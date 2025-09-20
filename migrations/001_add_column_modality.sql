ALTER TABLE applications ADD COLUMN modality TEXT DEFAULT NULL;
UPDATE applications SET modality = 'unknown' WHERE modality IS NULL;
