import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Search, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Usuario {
  id: string;
  user_id: string;
  telefone: string;
  plano: string;
  status: string;
  gateway_pagamento: string | null;
  data_renovacao: string | null;
  created_at: string;
  updated_at: string;
}

const PAGE_SIZE = 20;

const statusBadge = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'ativo') return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Ativo</Badge>;
  if (s === 'inativo') return <Badge variant="secondary">Inativo</Badge>;
  if (s.includes('cancel')) return <Badge variant="destructive">Cancelado</Badge>;
  return <Badge variant="outline">{status || '—'}</Badge>;
};

const planoBadge = (plano: string) => {
  const p = (plano || '').toUpperCase();
  if (p === 'PREMIUM') return <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Premium</Badge>;
  if (p === 'PRO') return <Badge className="bg-accent text-accent-foreground hover:bg-accent/80">Pro</Badge>;
  if (p === 'BASICO' || p === 'BÁSICO') return <Badge variant="outline">Básico</Badge>;
  if (p === 'FREE') return <Badge variant="outline" className="text-muted-foreground">Free</Badge>;
  return <Badge variant="outline">{plano || '—'}</Badge>;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

const formatPhoneDisplay = (raw: string) => {
  const d = (raw || '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('55')) {
    return `+55 (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
  }
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return raw;
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroPlano, setFiltroPlano] = useState<string>('all');
  const [filtroStatus, setFiltroStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selecionado, setSelecionado] = useState<Usuario | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Usuario | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar usuários.');
    } else {
      setUsuarios(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroPlano !== 'all' && (u.plano || '').toUpperCase() !== filtroPlano) return false;
      if (filtroStatus !== 'all' && (u.status || '').toLowerCase() !== filtroStatus.toLowerCase())
        return false;
      if (busca) {
        const q = busca.toLowerCase().replace(/\D/g, '');
        const tel = (u.telefone || '').replace(/\D/g, '');
        const matchTel = q && tel.includes(q);
        const matchTexto = u.telefone?.toLowerCase().includes(busca.toLowerCase());
        if (!matchTel && !matchTexto) return false;
      }
      return true;
    });
  }, [usuarios, busca, filtroPlano, filtroStatus]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const paginaAtual = Math.min(page, totalPages);
  const inicio = (paginaAtual - 1) * PAGE_SIZE;
  const visiveis = filtrados.slice(inicio, inicio + PAGE_SIZE);

  const handleDelete = async () => {
    if (!paraExcluir) return;
    const { error } = await supabase.from('usuarios').delete().eq('id', paraExcluir.id);
    if (error) {
      toast.error('Erro ao excluir usuário.');
    } else {
      toast.success('Usuário removido.');
      setUsuarios((prev) => prev.filter((u) => u.id !== paraExcluir.id));
    }
    setParaExcluir(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Gestão de Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {filtrados.length.toLocaleString('pt-BR')} usuário(s) encontrado(s)
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por telefone..."
                value={busca}
                onChange={(e) => {
                  setBusca(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={filtroPlano}
              onValueChange={(v) => {
                setFiltroPlano(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="BASICO">Básico</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="PREMIUM">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filtroStatus}
              onValueChange={(v) => {
                setFiltroStatus(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Renovação</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-24 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : visiveis.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-sm">
                      Nenhum usuário encontrado com esses filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  visiveis.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{formatPhoneDisplay(u.telefone)}</TableCell>
                      <TableCell>{planoBadge(u.plano)}</TableCell>
                      <TableCell>{statusBadge(u.status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.gateway_pagamento || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(u.data_renovacao)}</TableCell>
                      <TableCell className="text-sm">{formatDate(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setSelecionado(u)}
                            className="p-1.5 text-muted-foreground hover:text-foreground"
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setParaExcluir(u)}
                            className="p-1.5 text-muted-foreground hover:text-destructive"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filtrados.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {paginaAtual} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={paginaAtual === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drawer de detalhes */}
      <Sheet open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Detalhes do Usuário</SheetTitle>
            <SheetDescription>
              {selecionado && formatPhoneDisplay(selecionado.telefone)}
            </SheetDescription>
          </SheetHeader>
          {selecionado && (
            <div className="mt-6 space-y-4 text-sm">
              <DetailRow label="ID interno" value={selecionado.id} mono />
              <DetailRow label="User ID (auth)" value={selecionado.user_id} mono />
              <DetailRow label="Telefone" value={formatPhoneDisplay(selecionado.telefone)} />
              <DetailRow label="Plano" value={selecionado.plano} />
              <DetailRow label="Status" value={selecionado.status} />
              <DetailRow label="Gateway de pagamento" value={selecionado.gateway_pagamento || '—'} />
              <DetailRow label="Próxima renovação" value={formatDate(selecionado.data_renovacao)} />
              <DetailRow label="Cadastrado em" value={formatDate(selecionado.created_at)} />
              <DetailRow label="Atualizado em" value={formatDate(selecionado.updated_at)} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o registro de{' '}
              <span className="font-medium text-foreground">
                {paraExcluir && formatPhoneDisplay(paraExcluir.telefone)}
              </span>{' '}
              da tabela de usuários. Não desfaz pagamentos nem cancela assinaturas no gateway.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-border last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs break-all' : 'text-foreground'}>{value}</span>
    </div>
  );
}
