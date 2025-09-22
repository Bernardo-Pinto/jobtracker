-- 003_field_values_and_fk.sql
-- Migrate string picklists (status/last_step/modality) to normalized lookup table with FKs

PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

-- 1) Create field_values table
CREATE TABLE IF NOT EXISTS field_values (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('status','last_step','modality')),
  key TEXT NOT NULL,
  label TEXT NOT NULL,
  color TEXT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  priority_group TEXT NULL CHECK(priority_group IN ('needs_action','waiting','other')),
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(type, key),
  UNIQUE(type, label)
);

-- 2) Seed values from existing data
-- 2a) Seed default canonical options (idempotent)
INSERT OR IGNORE INTO field_values(type, key, label, color, sort_order, priority_group, is_active)
VALUES  
  -- Statuses
  ('status','needs_action','Needs Action','#2979FF',10,'needs_action',1),
  ('status','waiting','Waiting','#FFD600',20,'waiting',1),
  ('status','rejected','Rejected','#FF1744',30,'other',1);

-- Last steps (no color/group)
INSERT OR IGNORE INTO field_values(type, key, label, sort_order, is_active)
VALUES
  ('last_step','applied','Applied',10,1),
  ('last_step','phone_call','Phone Call',20,1),
  ('last_step','hr_interview','HR Interview',30,1),
  ('last_step','technical_interview','Technical Interview',40,1),
  ('last_step','practical_interview','Practical Interview',50,1),
  ('last_step','hiring_manager_interview','Hiring Manager Interview',60,1);

-- Modalities
INSERT OR IGNORE INTO field_values(type, key, label, sort_order, is_active)
VALUES
  ('modality','remote','Remote',10,1),
  ('modality','on_site','On-site',20,1),
  ('modality','hybrid_1_day','Hybrid - Office 1 day/week',30,1),
  ('modality','hybrid_2_days','Hybrid - Office 2 days/week',40,1),
  ('modality','hybrid_3_days','Hybrid - Office 3 days/week',50,1),
  ('modality','hybrid_4_days','Hybrid - Office 4 days/week',60,1);
-- Status
INSERT OR IGNORE INTO field_values(type, key, label, color, sort_order, priority_group, is_active)
SELECT 'status' AS type,
       lower(replace(trim(status), ' ', '_')) AS key,
       status AS label,
       NULL AS color,
       0 AS sort_order,
       CASE lower(trim(status))
          WHEN 'needs action' THEN 'needs_action'
          WHEN 'needs_action' THEN 'needs_action' // extra?
          WHEN 'waiting' THEN 'waiting'
          ELSE 'other'
       END AS priority_group,
       1 AS is_active
FROM (
  SELECT DISTINCT status FROM applications WHERE status IS NOT NULL AND status <> ''
);

-- Last step
INSERT OR IGNORE INTO field_values(type, key, label, color, sort_order, priority_group, is_active)
SELECT 'last_step', lower(replace(trim(last_step), ' ', '_')), last_step, NULL, 0, NULL, 1
FROM (
  SELECT DISTINCT last_step FROM applications WHERE last_step IS NOT NULL AND last_step <> ''
);

-- Modality (nullable)
INSERT OR IGNORE INTO field_values(type, key, label, color, sort_order, priority_group, is_active)
SELECT 'modality', lower(replace(trim(modality), ' ', '_')), modality, NULL, 0, NULL, 1
FROM (
  SELECT DISTINCT modality FROM applications WHERE modality IS NOT NULL AND modality <> ''
);

-- 3) Create new applications table with *_id FKs
CREATE TABLE applications_new (
    id INTEGER PRIMARY KEY,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    applied_on TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    modality_id INTEGER,
    status_id INTEGER NOT NULL,
    last_step_id INTEGER NOT NULL,
    last_updated TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (modality_id) REFERENCES field_values(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES field_values(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (last_step_id) REFERENCES field_values(id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 4) Backfill data by mapping labels to IDs
INSERT INTO applications_new (
  id, company, title, link, applied_on, salary_min, salary_max, modality_id, status_id, last_step_id, last_updated, notes
)
SELECT a.id,
       a.company,
       a.title,
       a.link,
       a.applied_on,
       a.salary_min,
       a.salary_max,
       mv.id AS modality_id,
       sv.id AS status_id,
       lv.id AS last_step_id,
       a.last_updated,
       a.notes
FROM applications a
LEFT JOIN field_values mv ON mv.type = 'modality' AND mv.label = a.modality
JOIN field_values sv ON sv.type = 'status' AND sv.label = a.status
JOIN field_values lv ON lv.type = 'last_step' AND lv.label = a.last_step;

-- 5) Swap tables
DROP TABLE applications;
ALTER TABLE applications_new RENAME TO applications;

-- 6) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_field_values_type_label ON field_values(type, label);
CREATE INDEX IF NOT EXISTS idx_field_values_type_sort ON field_values(type, sort_order);
CREATE INDEX IF NOT EXISTS idx_applications_status_id ON applications(status_id);
CREATE INDEX IF NOT EXISTS idx_applications_last_step_id ON applications(last_step_id);
CREATE INDEX IF NOT EXISTS idx_applications_modality_id ON applications(modality_id);

COMMIT;
PRAGMA foreign_keys=ON;
