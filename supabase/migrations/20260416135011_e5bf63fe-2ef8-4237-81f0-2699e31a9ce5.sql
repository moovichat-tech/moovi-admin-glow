
CREATE TABLE public.afiliados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  comissao_percentual NUMERIC NOT NULL DEFAULT 20,
  pix_chave TEXT NOT NULL,
  link_rastreio TEXT NOT NULL,
  vendas INTEGER NOT NULL DEFAULT 0,
  saldo_a_pagar NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.afiliados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view afiliados"
  ON public.afiliados FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert afiliados"
  ON public.afiliados FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update afiliados"
  ON public.afiliados FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete afiliados"
  ON public.afiliados FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_afiliados_updated_at
  BEFORE UPDATE ON public.afiliados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
