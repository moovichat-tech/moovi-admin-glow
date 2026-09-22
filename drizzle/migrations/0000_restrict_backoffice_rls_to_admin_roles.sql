CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

DROP POLICY IF EXISTS "Backoffice can delete afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Backoffice can update afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Backoffice can insert afiliados" ON public.afiliados;
DROP POLICY IF EXISTS "Backoffice can view afiliados" ON public.afiliados;
CREATE POLICY "Admins can delete afiliados" ON public.afiliados FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update afiliados" ON public.afiliados FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert afiliados" ON public.afiliados FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view afiliados" ON public.afiliados FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Backoffice can delete usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Backoffice can update usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Backoffice can insert usuarios" ON public.usuarios;
DROP POLICY IF EXISTS "Backoffice can view usuarios" ON public.usuarios;
CREATE POLICY "Admins can delete usuarios" ON public.usuarios FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update usuarios" ON public.usuarios FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert usuarios" ON public.usuarios FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view usuarios" ON public.usuarios FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view webhook events" ON public.webhook_events_asaas;
CREATE POLICY "Admins can view webhook events" ON public.webhook_events_asaas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view pagamentos" ON public.pagamentos;
CREATE POLICY "Admins can view pagamentos" ON public.pagamentos FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can view assinaturas" ON public.assinaturas;
CREATE POLICY "Admins can view assinaturas" ON public.assinaturas FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated can delete feedbacks" ON public.feedbacks_cancelamento;
DROP POLICY IF EXISTS "Authenticated can update feedbacks" ON public.feedbacks_cancelamento;
DROP POLICY IF EXISTS "Authenticated can insert feedbacks" ON public.feedbacks_cancelamento;
DROP POLICY IF EXISTS "Authenticated can view feedbacks" ON public.feedbacks_cancelamento;
CREATE POLICY "Admins can delete feedbacks" ON public.feedbacks_cancelamento FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update feedbacks" ON public.feedbacks_cancelamento FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert feedbacks" ON public.feedbacks_cancelamento FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can view feedbacks" ON public.feedbacks_cancelamento FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));