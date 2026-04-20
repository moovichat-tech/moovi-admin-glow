-- ============================================
-- ASSINATURAS (uma linha por assinatura)
-- ============================================
CREATE TABLE public.assinaturas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asaas_subscription_id text NOT NULL UNIQUE,
  asaas_customer_id text NOT NULL,
  telefone text,
  email text,
  nome text,
  plano text,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  ciclo text NOT NULL DEFAULT 'MONTHLY', -- MONTHLY | YEARLY | WEEKLY | etc
  status text NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | INACTIVE | EXPIRED | OVERDUE
  data_inicio timestamptz,
  data_cancelamento timestamptz,
  proximo_vencimento timestamptz,
  motivo_cancelamento text,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_assinaturas_status ON public.assinaturas(status);
CREATE INDEX idx_assinaturas_telefone ON public.assinaturas(telefone);
CREATE INDEX idx_assinaturas_data_cancelamento ON public.assinaturas(data_cancelamento);
CREATE INDEX idx_assinaturas_data_inicio ON public.assinaturas(data_inicio);

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view assinaturas"
  ON public.assinaturas FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_assinaturas_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- PAGAMENTOS (uma linha por cobrança)
-- ============================================
CREATE TABLE public.pagamentos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asaas_payment_id text NOT NULL UNIQUE,
  asaas_subscription_id text,
  asaas_customer_id text,
  telefone text,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  valor_liquido numeric(10,2),
  status text NOT NULL DEFAULT 'PENDING', -- PENDING | CONFIRMED | RECEIVED | OVERDUE | REFUNDED | CHARGEBACK
  metodo text, -- PIX | CREDIT_CARD | BOLETO | UNDEFINED
  data_vencimento timestamptz,
  data_pagamento timestamptz,
  data_criacao timestamptz,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pagamentos_status ON public.pagamentos(status);
CREATE INDEX idx_pagamentos_subscription ON public.pagamentos(asaas_subscription_id);
CREATE INDEX idx_pagamentos_telefone ON public.pagamentos(telefone);
CREATE INDEX idx_pagamentos_data_pagamento ON public.pagamentos(data_pagamento);

ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view pagamentos"
  ON public.pagamentos FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER update_pagamentos_updated_at
  BEFORE UPDATE ON public.pagamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- WEBHOOK EVENTS (auditoria + idempotência)
-- ============================================
CREATE TABLE public.webhook_events_asaas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_events_type ON public.webhook_events_asaas(event_type);
CREATE INDEX idx_webhook_events_created ON public.webhook_events_asaas(created_at);

ALTER TABLE public.webhook_events_asaas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view webhook events"
  ON public.webhook_events_asaas FOR SELECT
  TO authenticated
  USING (true);