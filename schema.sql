-- Creazione tabella Servizi
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(10),
    color_from VARCHAR(20),
    color_to VARCHAR(20),
    free_days INTEGER NOT NULL DEFAULT 30,
    pro_days INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creazione tabella Account
CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(50) PRIMARY KEY,
    service_id VARCHAR(50) REFERENCES services(id) ON DELETE CASCADE,
    plan VARCHAR(50) DEFAULT 'free',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    notes TEXT,
    cycle_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    quota_status VARCHAR(50) DEFAULT 'available',
    quota_percent INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserimento servizi base
INSERT INTO services (id, name, icon, color_from, color_to, free_days, pro_days)
VALUES 
    ('ag', 'Antigravity', '⚡', '#6c63ff', '#a78bfa', 7, 7),
    ('cx', 'Codex', '🤖', '#06b6d4', '#22d3ee', 30, 30)
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) - Permettiamo lettura/scrittura pubblica per ora 
-- (essendo un progetto privato protetto a monte dall'app)
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON services FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all for all users" ON accounts FOR ALL USING (true) WITH CHECK (true);
