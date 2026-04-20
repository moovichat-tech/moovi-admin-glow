import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Circle, Lock } from 'lucide-react';

interface Step {
  title: string;
  description: string;
  status: 'done' | 'todo' | 'locked';
}

const steps: Step[] = [
  {
    title: 'Backend e banco de dados',
    description: 'Tabelas de afiliados, usuários, assinaturas e pagamentos configuradas',
    status: 'done',
  },
  {
    title: 'Cadastro de afiliados',
    description: 'CRUD completo na página Afiliados',
    status: 'done',
  },
  {
    title: 'Tracking de cliques e vendas',
    description: 'Endpoint público para registrar clique e atribuir venda ao afiliado',
    status: 'todo',
  },
  {
    title: 'Integração com gateway de pagamento (Asaas)',
    description: 'Webhook para sincronizar assinaturas e pagamentos automaticamente',
    status: 'locked',
  },
  {
    title: 'Pagamento automático aos afiliados',
    description: 'Geração de transferência PIX a partir do lote selecionado',
    status: 'locked',
  },
  {
    title: 'Portal de cadastro público',
    description: 'Página externa onde novos afiliados podem se inscrever sozinhos',
    status: 'todo',
  },
];

export default function Setup() {
  const concluidos = steps.filter((s) => s.status === 'done').length;
  const total = steps.length;
  const pct = Math.round((concluidos / total) * 100);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Setup</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Passos para deixar seu programa de afiliados 100% automatizado
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Progresso da configuração</p>
            <span className="text-sm text-muted-foreground tabular-nums">
              {concluidos} de {total} ({pct}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <Card
            key={i}
            className={
              s.status === 'done'
                ? 'bg-card/40 border-primary/30'
                : 'bg-card/40 border-border/60'
            }
          >
            <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-5">
              <div className="mt-0.5">
                {s.status === 'done' ? (
                  <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                ) : s.status === 'locked' ? (
                  <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <Lock className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <div className="h-7 w-7 rounded-full border-2 border-border flex items-center justify-center">
                    <Circle className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base font-semibold">{s.title}</CardTitle>
                  {s.status === 'done' && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30 text-xs">
                      Concluído
                    </Badge>
                  )}
                  {s.status === 'locked' && (
                    <Badge variant="outline" className="text-xs">
                      Aguardando integração
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-1">{s.description}</CardDescription>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
