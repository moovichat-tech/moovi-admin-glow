ALTER TABLE public.afiliados
ADD COLUMN cliques_basico integer NOT NULL DEFAULT 0,
ADD COLUMN cliques_pro integer NOT NULL DEFAULT 0,
ADD COLUMN cliques_premium integer NOT NULL DEFAULT 0;