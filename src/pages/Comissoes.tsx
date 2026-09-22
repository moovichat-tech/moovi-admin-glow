import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowRight, Loader2, ReceiptText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API_BASE = 'https://n8n.fisherai.shop/webhook';
const RESUMO_URL = `${API_BASE}/resumo-comissoes`;
const DETALHES_URL = `${API_BASE}/detalhes-comissao`;
const PAGAR_URL = `${API_BASE}/pagar-comissao`;

type NumericValue = number | string | null | undefined;

interface ResumoComissaoApi {
  id?: string;
  afiliado_id?: string;
  nome?: string | null;
  afiliado?: string | null;
  comissao_percentual?: NumericValue;
  comissao?: NumericValue;
  vendas_geradas?: NumericValue;
  vendas_realizadas?: NumericValue;
  vendas?: NumericValue;
  saldo_a_pagar?: NumericValue;
  saldo_comissao?: NumericValue;
  pix_chave?: string | null;
  pix?: string | null;
}

interface ResumoComissao {
  id: string;
  nome: string;
  comissaoPercentual: number;
  vendasGeradas: number;
  saldoAPagar: number;
  pixChave: string;
}

interface TransacaoComissaoApi {
  id?: string;
  comissao_id?: string;
  nome_cliente?: string | null;
  cliente?: string | null;
  data_venda?: string | null;
  created_at?: string | null;
  valor_venda?: NumericValue;
  valor?: NumericValue;
  valor_comissao?: NumericValue;
  comissao?: NumericValue;
  status?: string | null;
}

interface TransacaoComissao {
  id: string;
  nomeCliente: string;
  dataVenda: string | null;
  valorVenda: number;
  valorComissao: number;
  status: 'Pendente' | 'Pago';
}

const toNumber = (value: NumericValue): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const raw = value.trim();
  if (!raw) return 0;
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number.parseFloat(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatBRL = (value: NumericValue) =>
  toNumber(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (value: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const extractArray = <T,>(payload: unknown, keys: string[]): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== 'object') return [];

  const record = payload as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[];
  }

  if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
    const nested = record.data as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(nested[key])) return nested[key] as T[];
    }
  }

  return [];
};

const normalizeResumo = (item: ResumoComissaoApi, index: number): ResumoComissao => ({
  id: String(item.id ?? item.afiliado_id ?? `afiliado-${index}`),
  nome: String(item.nome ?? item.afiliado ?? 'Afiliado sem nome'),
  comissaoPercentual: toNumber(item.comissao_percentual ?? item.comissao),
  vendasGeradas: toNumber(item.vendas_geradas ?? item.vendas_realizadas ?? item.vendas),
  saldoAPagar: toNumber(item.saldo_a_pagar ?? item.saldo_comissao),
  pixChave: String(item.pix_chave ?? item.pix ?? ''),
});

const normalizeTransacao = (item: TransacaoComissaoApi, index: number): TransacaoComissao => {
  const status = String(item.status ?? '').trim().toLowerCase();
  return {
    id: String(item.id ?? item.comissao_id ?? `comissao-${index}`),
    nomeCliente: String(item.nome_cliente ?? item.cliente ?? 'Cliente não informado'),
    dataVenda: item.data_venda ?? item.created_at ?? null,
    valorVenda: toNumber(item.valor_venda ?? item.valor),
    valorComissao: toNumber(item.valor_comissao ?? item.comissao),
    status: status === 'pago' || status === 'paid' ? 'Pago' : 'Pendente',
  };
};

export default function Comissoes() {
  const [resumo, setResumo] = useState<ResumoComissao[]>([]);
  const [loadingResumo, setLoadingResumo] = useState(true);
  const [erroResumo, setErroResumo] = useState(false);
  const [selecionado, setSelecionado] = useState<ResumoComissao | null>(null);
  const [transacoes, setTransacoes] = useState<TransacaoComissao[]>([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState(false);
  const [pagandoId, setPagandoId] = useState<string | null>(null);

  const fetchResumo = useCallback(async (silencioso = false) => {
    if (!silencioso) setLoadingResumo(true);
    setErroResumo(false);

    try {
      const url = new URL(RESUMO_URL);
      url.searchParams.set('_atualizado_em', Date.now().toString());
      const response = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const items = extractArray<ResumoComissaoApi>(payload, ['data', 'afiliados', 'resumo']);
      const normalized = items.map(normalizeResumo);
      setResumo(normalized);
      setSelecionado((current) => {
        if (!current) return null;
        return normalized.find((item) => item.id === current.id) ?? current;
      });
    } catch (error) {
      console.error('Erro ao carregar resumo de comissões:', error);
      if (!silencioso) {
        setErroResumo(true);
        setResumo([]);
        toast.error('Não foi possível carregar as comissões.');
      }
    } finally {
      if (!silencioso) setLoadingResumo(false);
    }
  }, []);

  const fetchDetalhes = useCallback(async (afiliadoId: string, signal?: AbortSignal) => {
    setLoadingDetalhes(true);
    setErroDetalhes(false);
    setTransacoes([]);

    try {
      const url = new URL(DETALHES_URL);
      url.searchParams.set('afiliado_id', afiliadoId);
      url.searchParams.set('_atualizado_em', Date.now().toString());
      const response = await fetch(url, { method: 'GET', cache: 'no-store', signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const payload: unknown = await response.json();
      const items = extractArray<TransacaoComissaoApi>(payload, ['data', 'transacoes', 'comissoes']);
      setTransacoes(items.map(normalizeTransacao));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Erro ao carregar detalhes da comissão:', error);
      setErroDetalhes(true);
      toast.error('Não foi possível carregar o histórico deste afiliado.');
    } finally {
      if (!signal?.aborted) setLoadingDetalhes(false);
    }
  }, []);

  useEffect(() => {
    void fetchResumo();
  }, [fetchResumo]);

  useEffect(() => {
    if (!selecionado) return;
    const controller = new AbortController();
    void fetchDetalhes(selecionado.id, controller.signal);
    return () => controller.abort();
  }, [selecionado?.id, fetchDetalhes]);

  const totais = useMemo(
    () => ({
      saldo: resumo.reduce((total, item) => total + item.saldoAPagar, 0),
      vendas: resumo.reduce((total, item) => total + item.vendasGeradas, 0),
      afiliados: resumo.length,
    }),
    [resumo],
  );

  const handlePagar = async (transacao: TransacaoComissao) => {
    if (pagandoId) return;
    setPagandoId(transacao.id);

    try {
      const response = await fetch(PAGAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comissao_id: transacao.id }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const text = await response.text();
      if (text) {
        const payload = JSON.parse(text) as { status?: string; mensagem?: string; message?: string };
        const status = payload.status?.toLowerCase();
        if (status && !['sucesso', 'success', 'ok', 'pago'].includes(status)) {
          throw new Error(payload.mensagem ?? payload.message ?? 'A baixa não foi confirmada.');
        }
      }

      setTransacoes((current) =>
        current.map((item) => (item.id === transacao.id ? { ...item, status: 'Pago' } : item)),
      );
      toast.success('Comissão marcada como paga.');
      void fetchResumo(true);
    } catch (error) {
      console.error('Erro ao dar baixa na comissão:', error);
      toast.error(error instanceof Error ? error.message : 'Não foi possível dar baixa na comissão.');
    } finally {
      setPagandoId(null);
    }
  };

  return (
    <div className="max-w-[1400px] space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Comissões</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Acompanhe valores pendentes e dê baixa nas comissões pagas.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard title="Total a Pagar" value={formatBRL(totais.saldo)} loading={loadingResumo} highlight />
        <StatCard title="Vendas Geradas" value={totais.vendas.toLocaleString('pt-BR')} loading={loadingResumo} />
        <StatCard title="Afiliados Ativos" value={totais.afiliados.toLocaleString('pt-BR')} loading={loadingResumo} />
      </div>

      <Card className="border-border/60 bg-card/40">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Afiliado</TableHead>
                  <TableHead className="text-center">Comissão</TableHead>
                  <TableHead className="text-center">Vendas Geradas</TableHead>
                  <TableHead className="text-right">Saldo a Pagar</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead className="w-10"><span className="sr-only">Abrir detalhes</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingResumo ? (
                  <ResumoSkeleton />
                ) : erroResumo ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-52 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <p className="text-sm text-muted-foreground">Não foi possível carregar as comissões.</p>
                        <Button variant="outline" size="sm" onClick={() => void fetchResumo()}>
                          <RefreshCw /> Tentar novamente
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : resumo.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-52 text-center">
                      <ReceiptText className="mx-auto mb-3 h-7 w-7 text-muted-foreground" />
                      <p className="text-sm font-medium">Nenhuma comissão encontrada</p>
                      <p className="mt-1 text-xs text-muted-foreground">Os afiliados com vendas aparecerão aqui.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  resumo.map((item) => (
                    <TableRow
                      key={item.id}
                      tabIndex={0}
                      role="button"
                      aria-label={`Ver comissões de ${item.nome}`}
                      className="cursor-pointer focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                      onClick={() => setSelecionado(item)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelecionado(item);
                        }
                      }}
                    >
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{item.comissaoPercentual.toLocaleString('pt-BR')}%</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">{item.vendasGeradas.toLocaleString('pt-BR')}</TableCell>
                      <TableCell className={`text-right font-semibold tabular-nums ${item.saldoAPagar > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {formatBRL(item.saldoAPagar)}
                      </TableCell>
                      <TableCell className="max-w-56 truncate text-xs text-muted-foreground" title={item.pixChave || undefined}>
                        {item.pixChave || '—'}
                      </TableCell>
                      <TableCell><ArrowRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={Boolean(selecionado)} onOpenChange={(open) => !open && setSelecionado(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-3xl">
          <SheetHeader className="pr-8">
            <SheetTitle>Histórico de comissões</SheetTitle>
            <SheetDescription>
              {selecionado ? `${selecionado.nome} · ${formatBRL(selecionado.saldoAPagar)} a pagar` : 'Detalhes do afiliado'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-7">
            {loadingDetalhes ? (
              <DetalhesSkeleton />
            ) : erroDetalhes ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-md border border-border">
                <p className="text-sm text-muted-foreground">Não foi possível carregar este histórico.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selecionado && void fetchDetalhes(selecionado.id)}
                >
                  <RefreshCw /> Tentar novamente
                </Button>
              </div>
            ) : transacoes.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-md border border-dashed border-border text-center">
                <ReceiptText className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Nenhuma venda encontrada</p>
                <p className="mt-1 text-xs text-muted-foreground">Este afiliado ainda não possui comissões registradas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Venda</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transacoes.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell className="min-w-36 font-medium">{transacao.nomeCliente}</TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{formatDate(transacao.dataVenda)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right text-xs tabular-nums">{formatBRL(transacao.valorVenda)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right text-xs font-medium tabular-nums">{formatBRL(transacao.valorComissao)}</TableCell>
                        <TableCell><StatusBadge status={transacao.status} /></TableCell>
                        <TableCell className="text-right">
                          {transacao.status === 'Pendente' ? (
                            <Button
                              size="sm"
                              disabled={pagandoId !== null}
                              onClick={() => void handlePagar(transacao)}
                            >
                              {pagandoId === transacao.id && <Loader2 className="animate-spin" />}
                              Dar Baixa
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">Concluído</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ title, value, loading, highlight = false }: { title: string; value: string; loading: boolean; highlight?: boolean }) {
  return (
    <Card className="border-border/60 bg-card/40">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        {loading ? (
          <Skeleton className="mt-3 h-9 w-32" />
        ) : (
          <p className={`mt-2 text-3xl font-semibold tabular-nums ${highlight ? 'text-primary' : ''}`}>{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: TransacaoComissao['status'] }) {
  return status === 'Pago' ? (
    <Badge className="border-primary/30 bg-primary/15 text-primary hover:bg-primary/20">Pago</Badge>
  ) : (
    <Badge className="border-warning/30 bg-warning/15 text-warning hover:bg-warning/20">Pendente</Badge>
  );
}

function ResumoSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }, (_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton className="h-5 w-36" /></TableCell>
          <TableCell><Skeleton className="mx-auto h-5 w-14" /></TableCell>
          <TableCell><Skeleton className="mx-auto h-5 w-12" /></TableCell>
          <TableCell><Skeleton className="ml-auto h-5 w-24" /></TableCell>
          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
          <TableCell><Skeleton className="h-5 w-5" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

function DetalhesSkeleton() {
  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="grid grid-cols-6 items-center gap-4 py-2">
          <Skeleton className="col-span-2 h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-5" />
          <Skeleton className="h-8" />
        </div>
      ))}
    </div>
  );
}