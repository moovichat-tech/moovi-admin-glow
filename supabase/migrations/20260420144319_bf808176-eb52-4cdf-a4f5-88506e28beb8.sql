-- ============================================
-- TABELA: feedbacks_cancelamento
-- ============================================
CREATE TABLE public.feedbacks_cancelamento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  telefone text,
  nome text,
  plano text,
  motivo text NOT NULL,
  comentario text,
  origem text NOT NULL DEFAULT 'MANUAL',
  data_cancelamento timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedbacks_motivo ON public.feedbacks_cancelamento(motivo);
CREATE INDEX idx_feedbacks_data ON public.feedbacks_cancelamento(data_cancelamento);
CREATE INDEX idx_feedbacks_telefone ON public.feedbacks_cancelamento(telefone);

ALTER TABLE public.feedbacks_cancelamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view feedbacks"
  ON public.feedbacks_cancelamento FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert feedbacks"
  ON public.feedbacks_cancelamento FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update feedbacks"
  ON public.feedbacks_cancelamento FOR UPDATE
  TO authenticated USING (true);

CREATE POLICY "Authenticated can delete feedbacks"
  ON public.feedbacks_cancelamento FOR DELETE
  TO authenticated USING (true);

CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks_cancelamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- AJUSTAR RLS DE usuarios PARA BACKOFFICE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can update usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Authenticated users can delete usuarios" ON public.usuarios;

CREATE POLICY "Backoffice can view usuarios"
  ON public.usuarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Backoffice can insert usuarios"
  ON public.usuarios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Backoffice can update usuarios"
  ON public.usuarios FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Backoffice can delete usuarios"
  ON public.usuarios FOR DELETE TO authenticated USING (true);

-- ============================================
-- AJUSTAR RLS DE afiliados PARA BACKOFFICE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can view afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Authenticated users can insert afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Authenticated users can update afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Authenticated users can delete afiliados" ON public.afiliados;

CREATE POLICY "Backoffice can view afiliados"
  ON public.afiliados FOR SELECT TO authenticated USING (true);
CREATE POLICY "Backoffice can insert afiliados"
  ON public.afiliados FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Backoffice can update afiliados"
  ON public.afiliados FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Backoffice can delete afiliados"
  ON public.afiliados FOR DELETE TO authenticated USING (true);