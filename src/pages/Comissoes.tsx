import { useEffect, useMemo, useState } from 'react';
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

interface Afiliado {
  id: string;
  nome: string;
  vendas: number;
  saldo_a_pagar: number;
  comissao_percentual: number;
  pix_chave: string;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Comissoes() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('afiliados')
        .select('id, nome, vendas, saldo_a_pagar, comissao_percentual, pix_chave')
        .order('saldo_a_pagar', { ascending: false });
      if (error) toast.error('Erro ao carregar comissões.');
      else setAfiliados(data ?? []);
      setLoading(false);
    })();
  }, []);

  const totalAPagar = useMemo(
    () => afiliados.reduce((acc, a) => acc + Number(a.saldo_a_pagar || 0), 0),
    [afiliados],
  );
  const totalVendas = useMemo(() => afiliados.reduce((acc, a) => acc + (a.vendas || 0), 0), [afiliados]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Comissões</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Acompanhe o saldo a pagar de cada afiliado
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <SmallStat title="Total a Pagar" value={formatBRL(totalAPagar)} />
        <SmallStat title="Vendas Geradas" value={totalVendas.toLocaleString('pt-BR')} />
        <SmallStat title="Afiliados Ativos" value={afiliados.length.toLocaleString('pt-BR')} />
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Afiliado</TableHead>
                <TableHead className="text-center">Comissão</TableHead>
                <TableHead className="text-center">Vendas</TableHead>
                <TableHead className="text-right">Saldo a Pagar</TableHead>
                <TableHead>Chave PIX</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : afiliados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16 text-sm text-muted-foreground">
                    Nenhum afiliado com comissão.
                  </TableCell>
                </TableRow>
              ) : (
                afiliados.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{a.comissao_percentual}%</Badge>
                    </TableCell>
                    <TableCell className="text-center">{a.vendas}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatBRL(Number(a.saldo_a_pagar))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.pix_chave}</TableCell>
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

function SmallStat({ title, value }: { title: string; value: string }) {
  return (
    <Card className="bg-card/40 border-border/60">
      <CardContent className="p-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-3xl font-semibold tracking-tight mt-2 tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
