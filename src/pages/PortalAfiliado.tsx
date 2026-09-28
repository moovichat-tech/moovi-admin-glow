import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, ExternalLink, LayoutDashboard, Send, UserPlus, KeyRound, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const RESUMO_URL = 'https://n8n.fisherai.shop/webhook/resumo-comissoes';
const PORTAL_URL = 'https://backoffice.moovi.chat/afiliado';

type AfiliadoResumo = { afiliado_id?: string | number; id?: string | number; nome?: string | null };

function extractAfiliados(payload: unknown): AfiliadoResumo[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    for (const key of ['data', 'afiliados', 'resumo']) {
      if (Array.isArray(record[key])) return record[key] as AfiliadoResumo[];
    }
    if (record.data && typeof record.data === 'object') return extractAfiliados(record.data);
  }
  throw new Error('O serviço não retornou a lista de afiliados.');
}

const portalSteps = [
  {
    title: 'Cadastro',
    description: 'Você cadastra o afiliado na aba "Afiliados" informando seus dados básicos e o e-mail.',
    icon: UserPlus,
  },
  {
    title: 'Compartilhamento',
    description: 'Você envia o link do portal (acima) para o parceiro.',
    icon: Send,
  },
  {
    title: 'Acesso Simplificado',
    description:
      'O afiliado acessa a página e entra no sistema digitando apenas o seu e-mail cadastrado (autenticação segura e sem senhas complexas).',
    icon: KeyRound,
  },
  {
    title: 'Transparência',
    description:
      'Dentro do portal, o parceiro terá acesso a um dashboard exclusivo com o total de cliques, conversões, comissões pendentes e valores já pagos.',
    icon: LayoutDashboard,
  },
];

export default function PortalAfiliado() {
  const [afiliados, setAfiliados] = useState<{ id: string; nome: string }[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const portalLink = selectedId ? `${PORTAL_URL}?id=${encodeURIComponent(selectedId)}` : '';

  const loadAfiliados = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(RESUMO_URL, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error('Não foi possível carregar os afiliados.');
      const payload: unknown = await response.json();
      const items = extractAfiliados(payload)
        .map((item) => ({ id: String(item.afiliado_id ?? item.id ?? ''), nome: item.nome?.trim() || 'Afiliado sem nome' }))
        .filter((item) => item.id);
      setAfiliados(items);
      setSelectedId((current) => items.some((item) => item.id === current) ? current : '');
    } catch (caught) {
      setAfiliados([]);
      setSelectedId('');
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar os afiliados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAfiliados(); }, [loadAfiliados]);

  const copy = async () => {
    if (!portalLink) return;
    try {
      await navigator.clipboard.writeText(portalLink);
      toast.success('Copiado!');
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Portal do Afiliado</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Central de acesso e acompanhamento dos seus parceiros
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Link do Portal</CardTitle>
          <CardDescription>Envie este link para seus afiliados acessarem o painel restrito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="affiliate-select">Selecione um Afiliado</Label>
            <Select value={selectedId} onValueChange={setSelectedId} disabled={loading || afiliados.length === 0}>
              <SelectTrigger id="affiliate-select" className="w-full sm:max-w-sm">
                <SelectValue placeholder={loading ? 'Carregando afiliados...' : 'Selecione um afiliado'} />
              </SelectTrigger>
              <SelectContent>
                {afiliados.map((item) => <SelectItem key={item.id} value={item.id}>{item.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {loading && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando afiliados...</p>}
            {error && <div className="flex items-center gap-2 text-sm text-destructive" role="alert">{error}<Button variant="outline" size="sm" onClick={() => void loadAfiliados()}><RefreshCw className="h-4 w-4" />Tentar novamente</Button></div>}
            {!loading && !error && afiliados.length === 0 && <p className="text-sm text-muted-foreground">Nenhum afiliado encontrado.</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="Link do Portal" readOnly value={portalLink} placeholder="Selecione um afiliado para gerar o link" className="min-w-0 font-mono text-sm bg-secondary/40" />
            <Button variant="secondary" disabled={!portalLink} onClick={() => void copy()}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" disabled={!portalLink} onClick={() => window.open(portalLink, '_blank', 'noopener,noreferrer')}>
              <ExternalLink className="h-4 w-4" />
              Abrir em nova guia
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona o Portal do Afiliado?</CardTitle>
          <CardDescription>Do cadastro ao acompanhamento das comissões em quatro etapas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2">
            {portalSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title} className="flex gap-4 rounded-md border border-border/60 bg-secondary/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-medium text-foreground">
                      {index + 1}. {step.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
