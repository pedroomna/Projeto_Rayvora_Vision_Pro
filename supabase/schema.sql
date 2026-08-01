-- RAYVORA VISION PRO: Esquema SQL corrigido para o Supabase
-- Pode rodar mesmo que você já tenha executado a versão anterior — usa
-- IF NOT EXISTS / ADD COLUMN IF NOT EXISTS em tudo, então é seguro repetir.
--
-- Corrige uma lacuna importante: a tabela cattle_records não tinha a coluna
-- do número do brinco (animal_id), que é o identificador central do app.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

--------------------------------------------------------------------------------
-- 1. Tabela de Perfis de Usuário (Veterinários)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    crmv TEXT,
    specialty TEXT,
    division TEXT,
    location TEXT,
    license TEXT,
    photo_url TEXT,
    has_seeded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

--------------------------------------------------------------------------------
-- 2. Tabela de Registros de Avaliação de Bovinos
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cattle_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.user_profiles(uid) ON DELETE CASCADE,
    animal_id TEXT,              -- número do brinco (NOVO — faltava)
    photo_url TEXT,
    date TEXT,
    lot TEXT,
    breed TEXT,
    score NUMERIC NOT NULL CHECK (score >= 1.0 AND score <= 5.0),
    weight NUMERIC NOT NULL CHECK (weight > 0),
    fat_progress NUMERIC,
    verdict TEXT NOT NULL CHECK (verdict IN ('APTO PARA ABATE', 'NÃO APTO')),
    ai_confidence NUMERIC,
    notes TEXT,
    landmark_points JSONB DEFAULT '[]'::jsonb NOT NULL,
    extraction_focus TEXT,             -- NOVO — faltava
    is_offline_pending BOOLEAN DEFAULT FALSE,  -- NOVO — faltava
    offline_stored_image TEXT,                 -- NOVO — faltava
    is_real_weight BOOLEAN DEFAULT FALSE,       -- NOVO — faltava
    email_alert JSONB,                          -- NOVO — faltava
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Caso a tabela já exista de uma execução anterior sem essas colunas,
-- estes ALTERs garantem que elas sejam adicionadas sem apagar dados.
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS animal_id TEXT;
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS extraction_focus TEXT;
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS is_offline_pending BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS offline_stored_image TEXT;
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS is_real_weight BOOLEAN DEFAULT FALSE;
ALTER TABLE public.cattle_records ADD COLUMN IF NOT EXISTS email_alert JSONB;

--------------------------------------------------------------------------------
-- 3. Índices de Desempenho
--------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_cattle_records_user_id ON public.cattle_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cattle_records_animal_id ON public.cattle_records(animal_id);
CREATE INDEX IF NOT EXISTS idx_cattle_records_lot ON public.cattle_records(lot);
CREATE INDEX IF NOT EXISTS idx_cattle_records_score ON public.cattle_records(score);

--------------------------------------------------------------------------------
-- 4. Atualização automática do campo updated_at
--------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trigger_update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_cattle_records_updated_at ON public.cattle_records;
CREATE TRIGGER trigger_update_cattle_records_updated_at
    BEFORE UPDATE ON public.cattle_records
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

--------------------------------------------------------------------------------
-- 5. Row-Level Security (permissiva — sem multiusuário real ainda, todos podem
--    ler/escrever; suficiente para a apresentação, revisar antes de produção real)
--------------------------------------------------------------------------------
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cattle_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer um pode persistir/atualizar perfil" ON public.user_profiles;
CREATE POLICY "Qualquer um pode persistir/atualizar perfil"
    ON public.user_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Qualquer um pode gerenciar seus registros de bovino" ON public.cattle_records;
CREATE POLICY "Qualquer um pode gerenciar seus registros de bovino"
    ON public.cattle_records FOR ALL
    USING (true)
    WITH CHECK (true);