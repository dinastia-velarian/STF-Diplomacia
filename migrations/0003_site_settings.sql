CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY,value TEXT NOT NULL,updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO site_settings(key,value) VALUES ('site_title','STF Diplomacia'),('announcement',''),('maintenance_notice',''),('contact_telegram','');
