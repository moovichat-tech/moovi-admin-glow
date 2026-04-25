import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
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

// TODO: ligar à API n8n quando endpoints estiverem prontos
const MOCK_KPIS = {
  usuarios: 1284,
  receita: 87450.0,
  comissao: 17490.0,
  cliques: 9421,
  assinantes: 612,
};

// TODO: ligar à API n8n
const MOCK_RANKING_COMISSAO = [
  { nome: 'Lucas Almeida', valor: 4280 },
  { nome: 'Mariana Costa', valor: 3890 },
  { nome: 'Pedro Henrique', valor: 3115 },
  { nome: 'Juliana Ramos', valor: 2640 },
  { nome: 'Rafael Souza', valor: 2210 },
  { nome: 'Camila Ferreira', valor: 1985 },
  { nome: 'Bruno Lima', valor: 1720 },
  { nome: 'Patrícia Oliveira', valor: 1490 },
  { nome: 'Gustavo Martins', valor: 1280 },
  { nome: 'Aline Pereira', valor: 1110 },
];

const MOCK_RANKING_VENDAS = [
  { nome: 'Mariana Costa', valor: 96 },
  { nome: 'Lucas Almeida', valor: 88 },
  { nome: 'Camila Ferreira', valor: 71 },
  { nome: 'Pedro Henrique', valor: 64 },
  { nome: 'Bruno Lima', valor: 58 },
  { nome: 'Juliana Ramos', valor: 51 },
  { nome: 'Rafael Souza', valor: 47 },
  { nome: 'Gustavo Martins', valor: 39 },
  { nome: 'Patrícia Oliveira', valor: 33 },
  { nome: 'Aline Pereira', valor: 28 },
];

// Série mensal (12 meses) — TODO: trocar por dados reais
const baseSeries = (seed: number) => {
  const now = new Date();
  return Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const valor =
      Math.round(
        (Math.sin((i + seed) * 0.7) * 0.4 + 0.6) * (seed === 0 ? 14000 : 3200) +
          (seed === 0 ? 4000 : 800),
      );
    return { date: d, mes: format(d, 'MMM/yy', { locale: ptBR }), valor };
  });
};
const MOCK_SERIES_RECEITA = baseSeries(0);
const MOCK_SERIES_COMISSAO = baseSeries(3);

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

  const range = useMemo(
    () => getRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const filterSeries = (series: typeof MOCK_SERIES_RECEITA) =>
    series.filter((s) => s.date >= range.from && s.date <= range.to);

  const receitaSeries = filterSeries(MOCK_SERIES_RECEITA);
  const comissaoSeries = filterSeries(MOCK_SERIES_COMISSAO);

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
            Métricas consolidadas — {periodoLabel.toLowerCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

      {/* 5 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Kpi title="Usuários" value={MOCK_KPIS.usuarios.toLocaleString('pt-BR')} />
        <Kpi title="Receita" value={formatBRL(MOCK_KPIS.receita)} />
        <Kpi title="Comissão de Afiliados" value={formatBRL(MOCK_KPIS.comissao)} />
        <Kpi title="Cliques" value={MOCK_KPIS.cliques.toLocaleString('pt-BR')} />
        <Kpi title="Assinantes" value={MOCK_KPIS.assinantes.toLocaleString('pt-BR')} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Receita de Afiliados"
          value={formatBRL(receitaSeries.reduce((a, b) => a + b.valor, 0))}
          data={receitaSeries}
          format={formatBRL}
        />
        <ChartCard
          title="Comissões de Afiliados"
          value={formatBRL(comissaoSeries.reduce((a, b) => a + b.valor, 0))}
          data={comissaoSeries}
          format={formatBRL}
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RankingCard
          title="Top 10 Afiliados por Comissão"
          subtitle="Maior comissão acumulada no período"
          rows={MOCK_RANKING_COMISSAO}
          formatValue={formatBRL}
        />
        <RankingCard
          title="Top 10 Afiliados por Vendas"
          subtitle="Maior número de vendas convertidas"
          rows={MOCK_RANKING_VENDAS}
          formatValue={(v) => v.toLocaleString('pt-BR')}
        />
      </div>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground mt-3 tabular-nums">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  value,
  data,
  format,
}: {
  title: string;
  value: string;
  data: { mes: string; valor: number }[];
  format: (n: number) => string;
}) {
  const isEmpty = data.length === 0 || data.every((d) => d.valor === 0);
  const id = `grad-${title.replace(/\s/g, '')}`;
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7 space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground mt-2 tabular-nums">
            {value}
          </p>
        </div>
        <div className="h-[220px] relative">
          <ResponsiveContainer width="100%" height="100%">
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
                formatter={(v: number) => [format(v), 'Valor']}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="valor"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill={`url(#${id})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {isEmpty && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground/70">
              Sem dados nesse período
            </p>
          )}
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
}: {
  title: string;
  subtitle: string;
  rows: { nome: string; valor: number }[];
  formatValue: (v: number) => string;
}) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7">
        <div className="mb-5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        </div>
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.nome}
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
      </CardContent>
    </Card>
  );
}
