import { useCallback, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { BarChart3, LogOut, MousePointerClick, ReceiptText, RefreshCw, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import mooviLogo from '@/assets/moovi-logo.png';
import { AFFILIATE_ID_KEY, AFFILIATE_NAME_KEY } from './AfiliadoLogin';

const DASHBOARD_URL = 'https://n8n.fisherai.shop/webhook/dashboard-afiliado';

type ApiNumber = number | string | null | undefined;

type ApiSale = {
  id?: string | number;
  data_venda?: string | null;
  data?: string | null;
  cliente?: string | null;
  nome_cliente?: string | null;
  valor_venda?: ApiNumber;
  valor?: ApiNumber;
  comissao?: ApiNumber;
  valor_comissao?: ApiNumber;
  status?: string | null;
};

type DashboardPayload = {
  comissoes_pendentes?: ApiNumber;
  total_pendente?: ApiNumber;
  saldo_a_pagar?: ApiNumber;
  comissoes_pagas?: ApiNumber;
  total_pago?: ApiNumber;
  cliques_total?: ApiNumber;
  total_cliques?: ApiNumber;
  cliques_basico?: ApiNumber;
  cliques_pro?: ApiNumber;
  cliques_premium?: ApiNumber;
  historico_comissoes?: ApiSale[] | null;
};

type DashboardResponse = DashboardPayload & { data?: DashboardPayload };

type Sale = {
  id: string;
  date: string | null;
  customer: string;
  saleValue: number;
  commission: number;
  status: string;
};

type DashboardData = {
  pending: number;
  paid: number;
  clicks: number;
  basic: number;
  pro: number;
  premium: number;
  history: Sale[];
};

const toNumber = (value: ApiNumber) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string' || !value.trim()) return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
};

const normalizeData = (response: DashboardResponse): DashboardData => {
  const payload = response.data ?? response;
  const basic = toNumber(payload.cliques_basico);
  const pro = toNumber(payload.cliques_pro);
  const premium = toNumber(payload.cliques_premium);
  const history = Array.isArray(payload.historico_comissoes) ? payload.historico_comissoes : [];

  return {
    pending: toNumber(payload.comissoes_pendentes ?? payload.total_pendente ?? payload.saldo_a_pagar),
    paid: toNumber(payload.comissoes_pagas ?? payload.total_pago),
    clicks: toNumber(payload.total_cliques ?? payload.cliques_total) || basic + pro + premium,
    basic,
    pro,
    premium,
    history: history.map((sale, index) => ({
      id: String(sale.id ?? `${sale.data_venda ?? sale.data ?? 'venda'}-${index}`),
      date: sale.data_venda ?? sale.data ?? null,
      customer: sale.nome_cliente?.trim() || sale.cliente?.trim() || 'Cliente não informado',
      saleValue: toNumber(sale.valor_venda ?? sale.valor),
      commission: toNumber(sale.valor_comissao ?? sale.comissao),
      status: sale.status?.trim() || 'Pendente',
    })),
  };
};

function SummarySkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((item) => (
        <Card key={item} className="border-border/70 bg-card/70">
          <CardContent className="space-y-4 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const paid = status.toLowerCase() === 'pago' || status.toLowerCase() === 'paid';
  return paid ? (
    <Badge className="border-primary/25 bg-primary/15 text-primary hover:bg-primary/20">Pago</Badge>
  ) : (
    <Badge className="border-warning/25 bg-warning/15 text-warning hover:bg-warning/20">Pendente</Badge>
  );
}

export default function AfiliadoDashboard() {
  const navigate = useNavigate();
  const affiliateId = localStorage.getItem(AFFILIATE_ID_KEY);
  const affiliateName = localStorage.getItem(AFFILIATE_NAME_KEY) || 'Afiliado';
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!affiliateId) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${DASHBOARD_URL}?id=${encodeURIComponent(affiliateId)}`, { cache: 'no-store' });
      const result = (await response.json().catch(() => ({}))) as DashboardResponse & { mensagem?: string };
      if (!response.ok) throw new Error(result.mensagem ?? 'Não foi possível carregar seus dados.');
      setData(normalizeData(result));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar seus dados.');
    } finally {
      setLoading(false);
    }
  }, [affiliateId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  if (!affiliateId) return <Navigate to="/afiliado" replace />;

  const logout = () => {
    localStorage.removeItem(AFFILIATE_ID_KEY);
    localStorage.removeItem(AFFILIATE_NAME_KEY);
    navigate('/afiliado', { replace: true });
  };

  const clickSources = data
    ? [
        { label: 'Básico', value: data.basic },
        { label: 'Pro', value: data.pro },
        { label: 'Premium', value: data.premium },
      ]
    : [];
  const maxClicks = Math.max(...clickSources.map((source) => source.value), 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <img src={mooviLogo} alt="Moovi" className="h-8 w-auto" />
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground hover:text-foreground">
            <LogOut />
            Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div>
          <p className="text-sm font-medium text-primary">Portal do Afiliado</p>
          <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Olá, {affiliateName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acompanhe o desempenho das suas indicações.</p>
        </div>

        {loading ? (
          <>
            <SummarySkeleton />
            <div className="grid gap-6 lg:grid-cols-5">
              <Skeleton className="h-72 lg:col-span-2" />
              <Skeleton className="h-72 lg:col-span-3" />
            </div>
          </>
        ) : error ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-border bg-card/50 px-6 text-center">
            <RefreshCw className="mb-4 h-7 w-7 text-muted-foreground" />
            <h2 className="font-medium">Não foi possível carregar o painel</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
            <Button className="mt-5" onClick={() => void loadDashboard()}>
              <RefreshCw /> Tentar novamente
            </Button>
          </div>
        ) : data ? (
          <>
            <section className="grid gap-4 md:grid-cols-3" aria-label="Resumo">
              <Card className="border-border/70 bg-card/70">
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissões Pendentes</p>
                    <p className={`mt-3 text-2xl font-semibold tabular-nums ${data.pending > 0 ? 'text-primary' : ''}`}>
                      {formatBRL(data.pending)}
                    </p>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2.5 text-primary"><WalletCards /></div>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Comissões Pagas</p>
                    <p className="mt-3 text-2xl font-semibold tabular-nums">{formatBRL(data.paid)}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2.5 text-secondary-foreground"><ReceiptText /></div>
                </CardContent>
              </Card>
              <Card className="border-border/70 bg-card/70">
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Cliques</p>
                    <p className="mt-3 text-2xl font-semibold tabular-nums">{Math.trunc(data.clicks).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="rounded-md bg-secondary p-2.5 text-secondary-foreground"><MousePointerClick /></div>
                </CardContent>
              </Card>
            </section>

            <section className="grid items-start gap-6 lg:grid-cols-5">
              <Card className="border-border/70 bg-card/70 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" />Distribuição de Cliques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {clickSources.map((source) => (
                    <div key={source.label} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{source.label}</span>
                        <span className="font-medium tabular-nums">{Math.trunc(source.value).toLocaleString('pt-BR')}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${(source.value / maxClicks) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card/70 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Vendas</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {data.history.length === 0 ? (
                    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
                      <div className="mb-4 rounded-lg bg-secondary p-3 text-muted-foreground"><ReceiptText className="h-6 w-6" /></div>
                      <p className="font-medium">Nenhuma venda registrada</p>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">Suas próximas vendas e comissões aparecerão aqui.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data da Venda</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Valor da Venda</TableHead>
                          <TableHead className="text-right">Comissão</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.history.map((sale) => (
                          <TableRow key={sale.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(sale.date)}</TableCell>
                            <TableCell className="min-w-40 font-medium">{sale.customer}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatBRL(sale.saleValue)}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatBRL(sale.commission)}</TableCell>
                            <TableCell><StatusBadge status={sale.status} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}