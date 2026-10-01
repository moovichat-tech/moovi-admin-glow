import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Area,
  AreaChart,
} from 'recharts';

const OVERVIEW_URL = 'https://n8n.fisherai.shop/webhook/visao-geral-programa';

type ApiNumber = number | string | null | undefined;
type OverviewPayload = {
  total_usuarios_pagantes?: ApiNumber;
  total_cliques?: ApiNumber;
  receita_afiliados?: ApiNumber;
  comissao_afiliados?: ApiNumber;
  top_comissoes?: { nome?: string | null; total_comissao?: ApiNumber }[] | null;
  top_vendas?: { nome?: string | null; total_vendas?: ApiNumber }[] | null;
  historico_grafico?: { mes?: string | null; receita?: ApiNumber; comissao?: ApiNumber }[] | null;
};
type MonthlyHistory = { mes: string; receita: number; comissao: number };
type OverviewData = {
  users: number;
  clicks: number;
  revenue: number;
  commission: number;
  topCommissions: { nome: string; valor: number }[];
  topSales: { nome: string; valor: number }[];
  history: MonthlyHistory[];
};

const EMPTY_OVERVIEW: OverviewData = {
  users: 0,
  clicks: 0,
  revenue: 0,
  commission: 0,
  topCommissions: [],
  topSales: [],
  history: [],
};

const toNumber = (value: ApiNumber) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string' || !value.trim()) return 0;
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.') : value;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeOverview = (payload?: OverviewPayload): OverviewData => {
  if (!payload) return EMPTY_OVERVIEW;
  return {
    users: toNumber(payload.total_usuarios_pagantes),
    clicks: toNumber(payload.total_cliques),
    revenue: toNumber(payload.receita_afiliados),
    commission: toNumber(payload.comissao_afiliados),
    topCommissions: (Array.isArray(payload.top_comissoes) ? payload.top_comissoes : []).slice(0, 10).map((item) => ({
      nome: item.nome?.trim() || 'Afiliado não informado',
      valor: toNumber(item.total_comissao),
    })),
    topSales: (Array.isArray(payload.top_vendas) ? payload.top_vendas : []).slice(0, 10).map((item) => ({
      nome: item.nome?.trim() || 'Afiliado não informado',
      valor: Math.trunc(toNumber(item.total_vendas)),
    })),
    history: (Array.isArray(payload.historico_grafico) ? payload.historico_grafico : [])
      .filter((item): item is typeof item & { mes: string } => typeof item.mes === 'string' && isValidMonth(item.mes))
      .map((item) => ({ mes: item.mes, receita: toNumber(item.receita), comissao: toNumber(item.comissao) }))
      .sort((a, b) => a.mes.localeCompare(b.mes)),
  };
};

const isValidMonth = (month: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

const formatMonth = (month: string) => {
  const [year, monthNumber] = month.split('-').map(Number);
  const label = format(new Date(year, monthNumber - 1, 1), 'MMM/yy', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

type PeriodPreset = 'mes' | '3m' | '6m' | '12m' | 'ano' | 'custom';

const PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: 'mes', label: 'Este mês' },
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: 'ano', label: 'Este ano' },
  { value: 'custom', label: 'Personalizado' },
];

const getRange = (preset: PeriodPreset, from?: Date, to?: Date) => {
  const now = new Date();
  if (preset === 'custom' && from && to) return { from, to };
  if (preset === 'mes')
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: now };
  if (preset === 'ano') return { from: new Date(now.getFullYear(), 0, 1), to: now };
  const months = preset === '3m' ? 3 : preset === '6m' ? 6 : 12;
  return { from: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1), to: now };
};

export default function Home() {
  const [preset, setPreset] = useState<PeriodPreset>('12m');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [overview, setOverview] = useState<OverviewData>(EMPTY_OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOverview = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(OVERVIEW_URL, { cache: 'no-store' });
      const json = (await response.json().catch(() => null)) as OverviewPayload[] | OverviewPayload | null;
      if (!response.ok) throw new Error('Não foi possível carregar as métricas do programa.');
      if (!json || typeof json !== 'object') throw new Error('A resposta das métricas está em um formato inválido.');
      const data = Array.isArray(json) ? json[0] : json;
      setOverview(normalizeOverview(data));
    } catch (caught) {
      setOverview(EMPTY_OVERVIEW);
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar as métricas do programa.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const range = useMemo(
    () => getRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const history = overview.history.filter((item) => {
    const month = item.mes;
    const fromMonth = format(range.from, 'yyyy-MM');
    const toMonth = format(range.to, 'yyyy-MM');
    return month >= fromMonth && month <= toMonth;
  });

  const periodoLabel =
    preset === 'custom' && customFrom && customTo
      ? `${format(customFrom, 'dd/MM/yy')} → ${format(customTo, 'dd/MM/yy')}`
      : PRESETS.find((p) => p.value === preset)?.label ?? '';

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header com filtro */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">
            Visão Geral do Programa
          </h1>
          <p className="text-base text-muted-foreground mt-2">
            Métricas consolidadas do programa
          </p>
        </div>

        <div className="flex items-center gap-2" aria-label="Período dos gráficos">
          <Select value={preset} onValueChange={(v) => setPreset(v as PeriodPreset)}>
            <SelectTrigger className="w-52 bg-secondary/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {preset === 'custom' && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !customFrom && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customFrom && customTo
                    ? `${format(customFrom, 'dd/MM/yy')} - ${format(customTo, 'dd/MM/yy')}`
                    : 'Escolher datas'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <div className="flex flex-col sm:flex-row">
                  <div className="border-r border-border">
                    <div className="px-3 pt-3 text-xs uppercase text-muted-foreground">
                      Início
                    </div>
                    <Calendar
                      mode="single"
                      selected={customFrom}
                      onSelect={setCustomFrom}
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </div>
                  <div>
                    <div className="px-3 pt-3 text-xs uppercase text-muted-foreground">
                      Fim
                    </div>
                    <Calendar
                      mode="single"
                      selected={customTo}
                      onSelect={setCustomTo}
                      className={cn('p-3 pointer-events-auto')}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 p-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCustomFrom(undefined);
                      setCustomTo(undefined);
                    }}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    disabled={!customFrom || !customTo}
                    onClick={() => setPopoverOpen(false)}
                  >
                    Aplicar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button variant="outline" size="sm" onClick={() => void loadOverview()}>
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </Button>
        </div>
      )}

      {/* Métricas consolidadas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi title="Usuários / Assinantes" value={overview.users.toLocaleString('pt-BR')} isLoading={isLoading} />
        <Kpi title="Receita" value={formatBRL(overview.revenue)} isLoading={isLoading} />
        <Kpi title="Comissão de Afiliados" value={formatBRL(overview.commission)} isLoading={isLoading} />
        <Kpi title="Cliques" value={Math.trunc(overview.clicks).toLocaleString('pt-BR')} isLoading={isLoading} />
      </div>

      {/* O período filtra apenas o histórico mensal; cards e rankings são totais da API. */}
      <p className="text-xs text-muted-foreground">Histórico mensal — {periodoLabel.toLowerCase()}</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Receita de Afiliados"
          value={formatBRL(overview.revenue)}
          data={history}
          dataKey="receita"
          isLoading={isLoading}
        />
        <ChartCard
          title="Comissões de Afiliados"
          value={formatBRL(overview.commission)}
          data={history}
          dataKey="comissao"
          isLoading={isLoading}
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RankingCard
          title="Top 10 Afiliados por Comissão"
          subtitle="Maior comissão acumulada"
          rows={overview.topCommissions}
          formatValue={formatBRL}
          isLoading={isLoading}
        />
        <RankingCard
          title="Top 10 Afiliados por Vendas"
          subtitle="Maior número de vendas convertidas"
          rows={overview.topSales}
          formatValue={(v) => v.toLocaleString('pt-BR')}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function Kpi({ title, value, isLoading }: { title: string; value: string; isLoading: boolean }) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        {isLoading ? (
          <Skeleton className="mt-3 h-8 w-3/4" />
        ) : (
          <p className="text-2xl font-semibold tracking-tight text-foreground mt-3 tabular-nums">
            {value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  value,
  data,
  dataKey,
  isLoading,
}: {
  title: string;
  value: string;
  data: MonthlyHistory[];
  dataKey: 'receita' | 'comissao';
  isLoading: boolean;
}) {
  const id = `grad-${dataKey}`;
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7 space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {isLoading ? <Skeleton className="mt-2 h-9 w-40" /> : (
            <p className="text-3xl font-semibold tracking-tight text-foreground mt-2 tabular-nums">{value}</p>
          )}
        </div>
        <div className="h-[220px] relative">
          {isLoading ? <Skeleton className="h-full w-full" /> : data.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem dados nesse período</p>
          ) : <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={formatMonth}
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [formatBRL(Number(v)), dataKey === 'receita' ? 'Receita' : 'Comissão']}
                labelFormatter={(label) => formatMonth(String(label))}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#${id})`}
                dot={data.length === 1 ? { r: 4 } : false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>}
        </div>
      </CardContent>
    </Card>
  );
}

function medalClass(pos: number) {
  if (pos === 1) return 'bg-primary/20 text-primary border-primary/30';
  if (pos === 2) return 'bg-secondary text-foreground border-border';
  if (pos === 3) return 'bg-accent/40 text-foreground border-border';
  return 'bg-muted text-muted-foreground border-border';
}

function RankingCard({
  title,
  subtitle,
  rows,
  formatValue,
  isLoading,
}: {
  title: string;
  subtitle: string;
  rows: { nome: string; valor: number }[];
  formatValue: (v: number) => string;
  isLoading: boolean;
}) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7">
        <div className="mb-5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        </div>
        {isLoading ? (
          <div className="space-y-3" aria-label="Carregando ranking">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">Nenhum dado registrado no período</p>
          </div>
        ) : (
          <ul className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={`${r.nome}-${i}`}
              className="flex items-center justify-between gap-3 p-2.5 rounded-md hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs font-semibold tabular-nums',
                    medalClass(i + 1),
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-foreground truncate">{r.nome}</span>
              </div>
              <span className="text-sm font-medium tabular-nums text-foreground shrink-0">
                {formatValue(r.valor)}
              </span>
            </li>
          ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
