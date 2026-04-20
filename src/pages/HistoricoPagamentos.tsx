import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Pagamento {
  id: string;
  asaas_payment_id: string;
  valor: number;
  valor_liquido: number | null;
  status: string;
  metodo: string | null;
  data_pagamento: string | null;
  data_vencimento: string | null;
  telefone: string | null;
}

const formatBRL = (v: number | null | undefined) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const statusBadge = (s: string) => {
  if (s === 'CONFIRMED' || s === 'RECEIVED')
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Pago</Badge>;
  if (s === 'PENDING') return <Badge variant="secondary">Pendente</Badge>;
  if (s === 'OVERDUE') return <Badge variant="destructive">Vencido</Badge>;
  if (s === 'REFUNDED') return <Badge variant="outline">Reembolsado</Badge>;
  return <Badge variant="outline">{s}</Badge>;
};

export default function HistoricoPagamentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('pagamentos')
        .select(
          'id, asaas_payment_id, valor, valor_liquido, status, metodo, data_pagamento, data_vencimento, telefone',
        )
        .order('data_pagamento', { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) toast.error('Erro ao carregar histórico.');
      else setPagamentos(data ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Histórico de Pagamentos</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {pagamentos.length.toLocaleString('pt-BR')} transação(ões) registrada(s)
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Líquido</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : pagamentos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-sm text-muted-foreground">
                    Nenhum pagamento registrado ainda. Conecte o gateway para popular esta tabela.
                  </TableCell>
                </TableRow>
              ) : (
                pagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm">
                      {p.data_pagamento
                        ? new Date(p.data_pagamento).toLocaleDateString('pt-BR')
                        : p.data_vencimento
                          ? `Vence ${new Date(p.data_vencimento).toLocaleDateString('pt-BR')}`
                          : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{p.telefone || '—'}</TableCell>
                    <TableCell className="text-sm">{p.metodo || '—'}</TableCell>
                    <TableCell>{statusBadge(p.status)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBRL(p.valor)}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {p.valor_liquido != null ? formatBRL(p.valor_liquido) : '—'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
