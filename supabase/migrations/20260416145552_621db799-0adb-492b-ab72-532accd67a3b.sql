
-- Add vencimento_acesso to afiliados
ALTER TABLE public.afiliados ADD COLUMN IF NOT EXISTS vencimento_acesso timestamptz DEFAULT NULL;

-- Create usuarios table
CREATE TABLE public.usuarios (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  telefone text NOT NULL UNIQUE,
  plano text NOT NULL DEFAULT 'FREE',
  status text NOT NULL DEFAULT 'Inativo',
  data_renovacao timestamptz,
  gateway_pagamento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view usuarios" ON public.usuarios FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert usuarios" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authenticated users can update usuarios" ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can delete usuarios" ON public.usuarios FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON public.usuarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
