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

interface Indicado {
  id: string;
  telefone: string;
  plano: string;
  status: string;
  data_renovacao: string | null;
  created_at: string;
  gateway_pagamento: string | null;
}

const formatPhone = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55'))
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  return raw;
};

export default function Indicados() {
  const [data, setData] = useState<Indicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: rows, error } = await supabase
        .from('usuarios')
        .select('id, telefone, plano, status, data_renovacao, created_at, gateway_pagamento')
        .eq('gateway_pagamento', 'cortesia_afiliado')
        .order('created_at', { ascending: false });
      if (error) toast.error('Erro ao carregar indicados.');
      else setData(rows ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Usuários Indicados</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {data.length.toLocaleString('pt-BR')} usuário(s) indicado(s) por afiliados
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Telefone</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Renovação</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-sm text-muted-foreground">
                    Nenhum usuário indicado por afiliados ainda.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{formatPhone(u.telefone)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{u.plano}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === 'Ativo' ? (
                        <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">{u.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.gateway_pagamento}
                    </TableCell>
                    <TableCell className="text-sm">
                      {u.data_renovacao ? new Date(u.data_renovacao).toLocaleDateString('pt-BR') : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
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
