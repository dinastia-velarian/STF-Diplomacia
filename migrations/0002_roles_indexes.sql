-- STF Diplomacia: funções oficiais de acesso.
-- Não concede privilégios automaticamente a nenhum usuário.
INSERT OR IGNORE INTO roles (id, name, scope) VALUES
 ('role_citizen', 'citizen', 'public'),
 ('role_lawyer', 'lawyer', 'public'),
 ('role_minister', 'minister', 'judicial'),
 ('role_president', 'president', 'judicial'),
 ('role_court_clerk', 'court_clerk', 'judicial'),
 ('role_technical_admin', 'technical_admin', 'technical');
CREATE INDEX IF NOT EXISTS idx_cases_queue ON cases(status, visibility, created_at);
CREATE INDEX IF NOT EXISTS idx_cases_judge ON cases(assigned_judge, status);
CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events(case_id, created_at);
CREATE INDEX IF NOT EXISTS idx_decisions_public ON decisions(status, published_at);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(user_id, revoked_at);
