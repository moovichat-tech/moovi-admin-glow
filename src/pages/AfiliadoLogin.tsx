import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import mooviLogo from '@/assets/moovi-logo.png';

const AUTH_URL = 'https://n8n.fisherai.shop/webhook/auth-afiliado';
export const AFFILIATE_ID_KEY = 'moovi_afiliado_id';
export const AFFILIATE_NAME_KEY = 'moovi_afiliado_nome';

type AuthResponse = {
  status?: string;
  afiliado_id?: string | number;
  id?: string | number;
  nome?: string;
  mensagem?: string;
  message?: string;
  data?: AuthResponse;
};

const unwrapResponse = (value: AuthResponse): AuthResponse => value.data ?? value;

export default function AfiliadoLogin() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem(AFFILIATE_ID_KEY)) {
    return <Navigate to="/afiliado/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const raw = (await response.json().catch(() => ({}))) as AuthResponse;
      const result = unwrapResponse(raw);
      const affiliateId = result.afiliado_id ?? result.id;

      if (!response.ok || result.status?.toLowerCase() === 'erro' || affiliateId == null) {
        throw new Error(result.mensagem ?? result.message ?? 'Não foi possível acessar o portal.');
      }

      localStorage.setItem(AFFILIATE_ID_KEY, String(affiliateId));
      localStorage.setItem(AFFILIATE_NAME_KEY, result.nome?.trim() || 'Afiliado');
      navigate('/afiliado/dashboard', { replace: true });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Acesso não autorizado',
        description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="absolute inset-x-0 top-0 h-px bg-primary/50" />
      <section className="relative w-full max-w-md">
        <div className="mb-10 flex flex-col items-center text-center">
          <img src={mooviLogo} alt="Moovi" className="mb-7 h-11 w-auto" />
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold">Portal do Afiliado Moovi</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Acompanhe suas vendas, cliques e comissões em um só lugar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="space-y-2">
            <Label htmlFor="affiliate-email">E-mail cadastrado</Label>
            <Input
              id="affiliate-email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={loading}
              required
              className="h-11 bg-background"
            />
          </div>
          <Button type="submit" className="h-11 w-full" disabled={loading || !email.trim()}>
            {loading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
            {loading ? 'Acessando...' : 'Acessar meu painel'}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Use o mesmo e-mail informado no seu cadastro de afiliado.
        </p>
      </section>
    </main>
  );
}