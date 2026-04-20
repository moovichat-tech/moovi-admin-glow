import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy, Check } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Area,
  AreaChart,
} from 'recharts';
import { toast } from 'sonner';

interface Afiliado {
  id: string;
  vendas: number;
  saldo_a_pagar: number;
  cliques_basico: number;
  cliques_pro: number;
  cliques_premium: number;
}

interface Pagamento {
  id: string;
  valor: number;
  data_pagamento: string | null;
  status: string;
}

interface Usuario {
  id: string;
  created_at: string;
  gateway_pagamento: string | null;
}

const PERIODOS = [
  { value: '12', label: 'Últimos 12 meses' },
  { value: '6', label: 'Últimos 6 meses' },
  { value: '3', label: 'Últimos 3 meses' },
];

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const monthLabel = (d: Date) =>
  d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [indicados, setIndicados] = useState<Usuario[]>([]);
  const [periodoReceita, setPeriodoReceita] = useState('12');
  const [periodoComissao, setPeriodoComissao] = useState('12');
  const [copied, setCopied] = useState(false);

  const portalLink = 'https://moovi.chat/?ref=parceiro';

  useEffect(() => {
    const load = async () => {
      const [a, p, u] = await Promise.all([
        supabase
          .from('afiliados')
          .select('id, vendas, saldo_a_pagar, cliques_basico, cliques_pro, cliques_premium'),
        supabase.from('pagamentos').select('id, valor, data_pagamento, status'),
        supabase
          .from('usuarios')
          .select('id, created_at, gateway_pagamento')
          .eq('gateway_pagamento', 'cortesia_afiliado'),
      ]);
      if (a.data) setAfiliados(a.data as Afiliado[]);
      if (p.data) setPagamentos(p.data as Pagamento[]);
      if (u.data) setIndicados(u.data as Usuario[]);
      setLoading(false);
    };
    load();
  }, []);

  // KPIs
  const totalReceita = useMemo(
    () =>
      pagamentos
        .filter((p) => p.status === 'CONFIRMED' || p.status === 'RECEIVED')
        .reduce((acc, p) => acc + Number(p.valor || 0), 0),
    [pagamentos],
  );

  const totalCliques = useMemo(
    () =>
      afiliados.reduce(
        (acc, a) =>
          acc + (a.cliques_basico || 0) + (a.cliques_pro || 0) + (a.cliques_premium || 0),
        0,
      ),
    [afiliados],
  );

  const totalIndicados = indicados.length;

  const totalComissoes = useMemo(
    () => afiliados.reduce((acc, a) => acc + Number(a.saldo_a_pagar || 0), 0),
    [afiliados],
  );

  // Série mensal — Receita
  const buildMonthlySeries = (months: number, valueFor: (date: Date) => number) => {
    const now = new Date();
    const series: { mes: string; valor: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      series.push({ mes: monthLabel(d), valor: valueFor(d) });
    }
    return series;
  };

  const receitaSeries = useMemo(() => {
    const months = Number(periodoReceita);
    return buildMonthlySeries(months, (d) => {
      const ano = d.getFullYear();
      const mes = d.getMonth();
      return pagamentos
        .filter((p) => {
          if (!p.data_pagamento) return false;
          if (p.status !== 'CONFIRMED' && p.status !== 'RECEIVED') return false;
          const dp = new Date(p.data_pagamento);
          return dp.getFullYear() === ano && dp.getMonth() === mes;
        })
        .reduce((acc, p) => acc + Number(p.valor || 0), 0);
    });
  }, [pagamentos, periodoReceita]);

  // Série mensal — Comissões (proxy: distribui saldo_a_pagar atual no mês corrente)
  const comissoesSeries = useMemo(() => {
    const months = Number(periodoComissao);
    const now = new Date();
    return buildMonthlySeries(months, (d) => {
      const isCurrent =
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      return isCurrent ? totalComissoes : 0;
    });
  }, [totalComissoes, periodoComissao]);

  const handleCopy = () => {
    navigator.clipboard.writeText(portalLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-semibold text-foreground tracking-tight">
          Visão Geral do Programa de Afiliados
        </h1>
        <p className="text-base text-muted-foreground mt-2">
          Aqui está o que está acontecendo com seu programa de afiliados
        </p>
      </div>

      {/* Portal de Afiliados */}
      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-8 space-y-5">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Seu Portal de Afiliados</h2>
            <p className="text-sm text-muted-foreground mt-1.5">
              Convide afiliados para se cadastrarem no seu programa usando o link abaixo
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <Input
              readOnly
              value={portalLink}
              className="bg-secondary/40 border-border/60 font-mono text-sm h-11"
            />
            <Button onClick={handleCopy} variant="secondary" className="h-11 px-6 shrink-0">
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" /> Copiado
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3 KPIs grandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <BigKpi
          title="Receita Total"
          value={loading ? '—' : formatBRL(totalReceita)}
          suffix={!loading && totalReceita === 0 ? 'BRL' : undefined}
          empty={!loading && totalReceita === 0}
          emptyHint="Aguardando pagamentos"
        />
        <BigKpi
          title="Cliques"
          value={loading ? '—' : totalCliques.toLocaleString('pt-BR')}
        />
        <BigKpi
          title="Usuários Indicados"
          value={loading ? '—' : totalIndicados.toLocaleString('pt-BR')}
        />
      </div>

      {/* 2 gráficos lado a lado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Receita de Afiliados"
          value={formatBRL(totalReceita)}
          period={periodoReceita}
          onPeriodChange={setPeriodoReceita}
          data={receitaSeries}
          color="hsl(var(--primary))"
          format={formatBRL}
        />
        <ChartCard
          title="Comissões de Afiliados"
          value={formatBRL(totalComissoes)}
          period={periodoComissao}
          onPeriodChange={setPeriodoComissao}
          data={comissoesSeries}
          color="hsl(var(--primary))"
          format={formatBRL}
        />
      </div>
    </div>
  );
}

function BigKpi({
  title,
  value,
  suffix,
  empty,
  emptyHint,
}: {
  title: string;
  value: string;
  suffix?: string;
  empty?: boolean;
  emptyHint?: string;
}) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </span>
          {suffix && <span className="text-base text-muted-foreground">{suffix}</span>}
        </div>
        {empty && emptyHint && (
          <p className="text-xs text-muted-foreground/70 mt-2">{emptyHint}</p>
        )}
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  value,
  period,
  onPeriodChange,
  data,
  color,
  format,
}: {
  title: string;
  value: string;
  period: string;
  onPeriodChange: (v: string) => void;
  data: { mes: string; valor: number }[];
  color: string;
  format: (n: number) => string;
}) {
  const isEmpty = data.every((d) => d.valor === 0);
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-7 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-semibold tracking-tight text-foreground mt-2 tabular-nums">
              {value}
            </p>
          </div>
          <Select value={period} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-44 bg-secondary/40 border-border/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
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
                stroke={color}
                strokeWidth={2}
                fill={`url(#grad-${title})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
          {isEmpty && (
            <p className="text-xs text-muted-foreground/70 text-center -mt-32">
              Sem dados nesse período
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
