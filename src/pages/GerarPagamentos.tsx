import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface Afiliado {
  id: string;
  nome: string;
  saldo_a_pagar: number;
  pix_chave: string;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function GerarPagamentos() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [minimo, setMinimo] = useState(50);
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('afiliados')
        .select('id, nome, saldo_a_pagar, pix_chave')
        .gt('saldo_a_pagar', 0)
        .order('saldo_a_pagar', { ascending: false });
      if (error) toast.error('Erro ao carregar.');
      else setAfiliados(data ?? []);
      setLoading(false);
    })();
  }, []);

  const elegiveis = useMemo(
    () => afiliados.filter((a) => Number(a.saldo_a_pagar) >= minimo),
    [afiliados, minimo],
  );

  const totalSelecionado = useMemo(
    () =>
      elegiveis
        .filter((a) => selecionados[a.id])
        .reduce((acc, a) => acc + Number(a.saldo_a_pagar), 0),
    [elegiveis, selecionados],
  );
  const qtdSelecionados = elegiveis.filter((a) => selecionados[a.id]).length;

  const toggleAll = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    if (checked) elegiveis.forEach((a) => (next[a.id] = true));
    setSelecionados(next);
  };

  const exportarCSV = () => {
    const linhas = elegiveis.filter((a) => selecionados[a.id]);
    if (linhas.length === 0) {
      toast.error('Nenhum afiliado selecionado.');
      return;
    }
    const csv = [
      ['Nome', 'Chave PIX', 'Valor (BRL)'].join(';'),
      ...linhas.map((a) =>
        [a.nome, a.pix_chave, Number(a.saldo_a_pagar).toFixed(2)].join(';'),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pagamentos-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${linhas.length} pagamento(s) exportado(s).`);
  };

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Gerar Pagamentos</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Selecione afiliados elegíveis e exporte o lote para pagar via PIX
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
          <CardDescription>Defina o saldo mínimo para incluir um afiliado no lote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3 max-w-md">
            <div className="space-y-2 flex-1">
              <Label htmlFor="min">Saldo mínimo (R$)</Label>
              <Input
                id="min"
                type="number"
                value={minimo}
                onChange={(e) => setMinimo(Number(e.target.value || 0))}
              />
            </div>
            <Badge variant="outline">{elegiveis.length} elegível(eis)</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={qtdSelecionados > 0 && qtdSelecionados === elegiveis.length}
                    onCheckedChange={(c) => toggleAll(!!c)}
                  />
                </TableHead>
                <TableHead>Afiliado</TableHead>
                <TableHead>Chave PIX</TableHead>
                <TableHead className="text-right">Saldo a Pagar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : elegiveis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-16 text-sm text-muted-foreground">
                    Nenhum afiliado elegível com esse saldo mínimo.
                  </TableCell>
                </TableRow>
              ) : (
                elegiveis.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Checkbox
                        checked={!!selecionados[a.id]}
                        onCheckedChange={(c) =>
                          setSelecionados((prev) => ({ ...prev, [a.id]: !!c }))
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">{a.nome}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.pix_chave}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatBRL(Number(a.saldo_a_pagar))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-5">
        <div>
          <p className="text-sm text-muted-foreground">Total selecionado</p>
          <p className="text-2xl font-semibold tabular-nums">
            {formatBRL(totalSelecionado)}{' '}
            <span className="text-sm text-muted-foreground font-normal">
              ({qtdSelecionados} afiliado{qtdSelecionados === 1 ? '' : 's'})
            </span>
          </p>
        </div>
        <Button onClick={exportarCSV} disabled={qtdSelecionados === 0}>
          <FileDown className="mr-2 h-4 w-4" /> Exportar CSV
        </Button>
      </div>
    </div>
  );
}
