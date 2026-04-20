import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Users,
  UserCheck,
  UserX,
  Handshake,
  MousePointerClick,
  ShoppingCart,
  Wallet,
  TrendingUp,
  Lock,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';

interface Usuario {
  id: string;
  plano: string;
  status: string;
}

interface Afiliado {
  id: string;
  nome: string;
  vendas: number;
  saldo_a_pagar: number;
  cliques_basico: number;
  cliques_pro: number;
  cliques_premium: number;
}

const PIE_COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);

  useEffect(() => {
    const load = async () => {
      const [u, a] = await Promise.all([
        supabase.from('usuarios').select('id, plano, status'),
        supabase.from('afiliados').select('id, nome, vendas, saldo_a_pagar, cliques_basico, cliques_pro, cliques_premium'),
      ]);
      if (u.data) setUsuarios(u.data as Usuario[]);
      if (a.data) setAfiliados(a.data as Afiliado[]);
      setLoading(false);
    };
    load();
  }, []);

  // Cálculos de KPIs
  const totalUsuarios = usuarios.length;
  const usuariosAtivos = usuarios.filter((u) => u.status === 'Ativo').length;
  const usuariosInativos = usuarios.filter((u) => u.status !== 'Ativo').length;
  const totalAfiliados = afiliados.length;

  const totalCliques = afiliados.reduce(
    (acc, a) => acc + (a.cliques_basico || 0) + (a.cliques_pro || 0) + (a.cliques_premium || 0),
    0,
  );
  const totalVendas = afiliados.reduce((acc, a) => acc + (a.vendas || 0), 0);
  const totalComissoes = afiliados.reduce((acc, a) => acc + Number(a.saldo_a_pagar || 0), 0);
  const taxaConversao = totalCliques > 0 ? (totalVendas / totalCliques) * 100 : 0;

  // Distribuição por plano
  const planosMap = usuarios.reduce<Record<string, number>>((acc, u) => {
    const plano = u.plano || 'INDEFINIDO';
    acc[plano] = (acc[plano] || 0) + 1;
    return acc;
  }, {});
  const planosData = Object.entries(planosMap).map(([name, value]) => ({ name, value }));

  // Distribuição por status
  const statusMap = usuarios.reduce<Record<string, number>>((acc, u) => {
    const s = u.status || 'INDEFINIDO';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const statusData = Object.entries(statusMap).map(([name, total]) => ({ name, total }));

  // Top 5 afiliados por vendas
  const topVendas = [...afiliados]
    .sort((a, b) => (b.vendas || 0) - (a.vendas || 0))
    .slice(0, 5)
    .map((a) => ({ nome: a.nome, vendas: a.vendas || 0 }));

  // Top 5 afiliados por cliques
  const topCliques = [...afiliados]
    .map((a) => ({
      nome: a.nome,
      cliques: (a.cliques_basico || 0) + (a.cliques_pro || 0) + (a.cliques_premium || 0),
    }))
    .sort((a, b) => b.cliques - a.cliques)
    .slice(0, 5);

  const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Visão Geral</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Métricas em tempo real do seu negócio
          </p>
        </div>

        {/* KPIs reais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total de Usuários"
            value={loading ? '—' : totalUsuarios.toLocaleString('pt-BR')}
            icon={Users}
            iconColor="text-primary"
          />
          <KpiCard
            title="Usuários Ativos"
            value={loading ? '—' : usuariosAtivos.toLocaleString('pt-BR')}
            icon={UserCheck}
            iconColor="text-emerald-500"
          />
          <KpiCard
            title="Usuários Inativos"
            value={loading ? '—' : usuariosInativos.toLocaleString('pt-BR')}
            icon={UserX}
            iconColor="text-rose-500"
          />
          <KpiCard
            title="Total de Afiliados"
            value={loading ? '—' : totalAfiliados.toLocaleString('pt-BR')}
            icon={Handshake}
            iconColor="text-primary"
          />
          <KpiCard
            title="Cliques Totais"
            value={loading ? '—' : totalCliques.toLocaleString('pt-BR')}
            icon={MousePointerClick}
            iconColor="text-sky-500"
          />
          <KpiCard
            title="Vendas via Afiliados"
            value={loading ? '—' : totalVendas.toLocaleString('pt-BR')}
            icon={ShoppingCart}
            iconColor="text-emerald-500"
          />
          <KpiCard
            title="Comissões a Pagar"
            value={loading ? '—' : formatBRL(totalComissoes)}
            icon={Wallet}
            iconColor="text-amber-500"
          />
          <KpiCard
            title="Taxa de Conversão"
            value={loading ? '—' : `${taxaConversao.toFixed(2)}%`}
            icon={TrendingUp}
            iconColor="text-emerald-500"
          />
        </div>

        {/* Placeholders honestos */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Métricas Financeiras</h2>
            <Badge variant="outline" className="text-xs">
              Aguardando integração com gateway
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlaceholderKpi label="MRR" description="Receita recorrente mensal" />
            <PlaceholderKpi label="ARR" description="Receita recorrente anual" />
            <PlaceholderKpi label="Churn Rate" description="Taxa de cancelamento mensal" />
            <PlaceholderKpi label="LTV" description="Lifetime Value médio" />
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Plano</CardTitle>
              <CardDescription>Usuários agrupados pelo plano contratado</CardDescription>
            </CardHeader>
            <CardContent>
              {planosData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={planosData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                    >
                      {planosData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Distribuição por Status</CardTitle>
              <CardDescription>Quantos usuários estão ativos x inativos</CardDescription>
            </CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Afiliados por Vendas</CardTitle>
              <CardDescription>Quem mais converteu vendas até agora</CardDescription>
            </CardHeader>
            <CardContent>
              {topVendas.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topVendas} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 5 Afiliados por Cliques</CardTitle>
              <CardDescription>Quem mais traz tráfego para a plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {topCliques.length === 0 ? (
                <EmptyChart />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={topCliques} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="nome" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Bar dataKey="cliques" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-semibold text-foreground mt-2">{value}</p>
          </div>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function PlaceholderKpi({ label, description }: { label: string; description: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card className="border-dashed opacity-70 cursor-help">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
                  <Info className="h-3 w-3 text-slate-400" />
                </div>
                <p className="text-2xl font-semibold text-muted-foreground mt-2">—</p>
              </div>
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Disponível após integrar o gateway de pagamento</p>
      </TooltipContent>
    </Tooltip>
  );
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
      Sem dados ainda
    </div>
  );
}
