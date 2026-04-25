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

interface Pagamento {
  id: string;
  valor: number;
  status: string;
  metodo: string | null;
  data_pagamento: string | null;
  data_vencimento: string | null;
}

interface Assinatura {
  id: string;
  plano: string | null;
  ciclo: string;
  valor: number;
  status: string;
  data_inicio: string | null;
  proximo_vencimento: string | null;
}

interface Feedback {
  id: string;
  motivo: string;
  comentario: string | null;
  data_cancelamento: string;
}

interface AfiliadoOrigem {
  nome: string;
  link_rastreio: string;
}

interface DetalhesUsuario {
  loading: boolean;
  pagamentos: Pagamento[];
  assinatura: Assinatura | null;
  feedback: Feedback | null;
  afiliado: AfiliadoOrigem | null;
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

const pagamentoBadge = (status: string) => {
  const s = (status || '').toUpperCase();
  if (s === 'CONFIRMED' || s === 'RECEIVED')
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">Pago</Badge>;
  if (s === 'PENDING') return <Badge variant="secondary">Pendente</Badge>;
  if (s === 'OVERDUE') return <Badge variant="destructive">Vencido</Badge>;
  if (s === 'REFUNDED') return <Badge variant="outline">Reembolsado</Badge>;
  return <Badge variant="outline">{status || '—'}</Badge>;
};

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

const formatBRL = (v: number) =>
  Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
  const [detalhes, setDetalhes] = useState<DetalhesUsuario>({
    loading: false,
    pagamentos: [],
    assinatura: null,
    feedback: null,
    afiliado: null,
  });

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

  // Carrega detalhes ao abrir o drawer
  useEffect(() => {
    if (!selecionado) return;
    let cancelled = false;
    const run = async () => {
      setDetalhes({
        loading: true,
        pagamentos: [],
        assinatura: null,
        feedback: null,
        afiliado: null,
      });

      const tel = selecionado.telefone;

      const [pagRes, assRes, fbRes, afilRes] = await Promise.all([
        supabase
          .from('pagamentos')
          .select('id, valor, status, metodo, data_pagamento, data_vencimento')
          .eq('telefone', tel)
          .order('data_pagamento', { ascending: false, nullsFirst: false })
          .limit(10),
        supabase
          .from('assinaturas')
          .select('id, plano, ciclo, valor, status, data_inicio, proximo_vencimento')
          .eq('telefone', tel)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('feedbacks_cancelamento')
          .select('id, motivo, comentario, data_cancelamento')
          .eq('telefone', tel)
          .order('data_cancelamento', { ascending: false })
          .limit(1)
          .maybeSingle(),
        // Heurística: se gateway indica afiliado, busca o afiliado mais recente como origem.
        // TODO: substituir por relação real (campo afiliado_id em usuarios).
        selecionado.gateway_pagamento === 'cortesia_afiliado'
          ? supabase
              .from('afiliados')
              .select('nome, link_rastreio')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
      ]);

      if (cancelled) return;
      setDetalhes({
        loading: false,
        pagamentos: (pagRes.data as Pagamento[]) ?? [],
        assinatura: (assRes.data as Assinatura | null) ?? null,
        feedback: (fbRes.data as Feedback | null) ?? null,
        afiliado: (afilRes.data as AfiliadoOrigem | null) ?? null,
      });
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selecionado]);

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

      {/* Drawer de detalhes enriquecido */}
      <Sheet open={!!selecionado} onOpenChange={(open) => !open && setSelecionado(null)}>
        <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalhes do Usuário</SheetTitle>
            <SheetDescription>
              {selecionado && formatPhoneDisplay(selecionado.telefone)}
            </SheetDescription>
          </SheetHeader>

          {selecionado && (
            <div className="mt-6 space-y-7">
              {/* Dados do cliente */}
              <Section title="Dados do Cliente">
                <DetailRow label="Telefone" value={formatPhoneDisplay(selecionado.telefone)} />
                <DetailRow label="Plano" value={selecionado.plano} />
                <DetailRow label="Status" value={selecionado.status} />
                <DetailRow label="Gateway de pagamento" value={selecionado.gateway_pagamento || '—'} />
                <DetailRow label="Próxima renovação" value={formatDate(selecionado.data_renovacao)} />
                <DetailRow label="Cadastrado em" value={formatDate(selecionado.created_at)} />
                <DetailRow label="Atualizado em" value={formatDate(selecionado.updated_at)} />
                <DetailRow label="ID interno" value={selecionado.id} mono />
                <DetailRow label="User ID (auth)" value={selecionado.user_id} mono />
              </Section>

              {/* Origem */}
              <Section title="Origem">
                {detalhes.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : detalhes.afiliado ? (
                  <>
                    <DetailRow label="Indicado por" value={detalhes.afiliado.nome} />
                    <DetailRow label="Link de rastreio" value={detalhes.afiliado.link_rastreio} mono />
                  </>
                ) : selecionado.gateway_pagamento === 'cortesia_afiliado' ? (
                  <p className="text-sm text-muted-foreground">
                    Cortesia de afiliado — afiliado de origem não encontrado.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Cadastro direto / orgânico.</p>
                )}
              </Section>

              {/* Assinatura ativa */}
              <Section title="Assinatura Ativa">
                {detalhes.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : detalhes.assinatura ? (
                  <>
                    <DetailRow label="Plano" value={detalhes.assinatura.plano || '—'} />
                    <DetailRow label="Ciclo" value={detalhes.assinatura.ciclo} />
                    <DetailRow label="Valor" value={formatBRL(detalhes.assinatura.valor)} />
                    <DetailRow label="Status" value={detalhes.assinatura.status} />
                    <DetailRow label="Início" value={formatDate(detalhes.assinatura.data_inicio)} />
                    <DetailRow
                      label="Próximo vencimento"
                      value={formatDate(detalhes.assinatura.proximo_vencimento)}
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem assinatura registrada.</p>
                )}
              </Section>

              {/* Histórico de pagamentos */}
              <Section title="Histórico de Pagamentos">
                {detalhes.loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : detalhes.pagamentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum pagamento encontrado.</p>
                ) : (
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-9">Data</TableHead>
                          <TableHead className="h-9">Valor</TableHead>
                          <TableHead className="h-9">Status</TableHead>
                          <TableHead className="h-9">Método</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detalhes.pagamentos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="text-xs py-2">
                              {formatDate(p.data_pagamento ?? p.data_vencimento)}
                            </TableCell>
                            <TableCell className="text-xs py-2 tabular-nums">
                              {formatBRL(p.valor)}
                            </TableCell>
                            <TableCell className="py-2">{pagamentoBadge(p.status)}</TableCell>
                            <TableCell className="text-xs py-2 text-muted-foreground">
                              {p.metodo || '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Section>

              {/* Feedback de cancelamento (condicional) */}
              {detalhes.feedback && (
                <Section title="Feedback de Cancelamento">
                  <DetailRow label="Motivo" value={detalhes.feedback.motivo} />
                  {detalhes.feedback.comentario && (
                    <DetailRow label="Comentário" value={detalhes.feedback.comentario} />
                  )}
                  <DetailRow
                    label="Data do cancelamento"
                    value={formatDate(detalhes.feedback.data_cancelamento)}
                  />
                </Section>
              )}
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 pb-3 border-b border-border last:border-0">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs break-all' : 'text-sm text-foreground break-words'}>
        {value}
      </span>
    </div>
  );
}
