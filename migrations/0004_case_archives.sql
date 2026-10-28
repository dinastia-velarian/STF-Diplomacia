CREATE TABLE IF NOT EXISTS case_archives (
 case_id TEXT PRIMARY KEY REFERENCES cases(id),
 archived_by TEXT NOT NULL REFERENCES users(id),
 archived_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 previous_status TEXT NOT NULL,
 reason TEXT NOT NULL
);
