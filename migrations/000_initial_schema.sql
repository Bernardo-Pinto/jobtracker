-- Initial schema for applications table
CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT,
    applied_on TEXT NOT NULL,
    salary_min INTEGER,
    salary_max INTEGER,
    status TEXT NOT NULL,
    last_step TEXT NOT NULL,
    last_updated TEXT NOT NULL,
    notes TEXT
);
