import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

interface Feedback {
  id: string;
  telefone: string | null;
  nome: string | null;
  plano: string | null;
  motivo: string;
  comentario: string | null;
  origem: string;
  data_cancelamento: string;
  created_at: string;
}

const MOTIVOS = [
  'Preço alto',
  'Não usei o suficiente',
  'Faltam funcionalidades',
  'Problemas técnicos',
  'Encontrei alternativa',
  'Atendimento ruim',
  'Outro',
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Feedback | null>(null);

  // form
  const [telefone, setTelefone] = useState('');
  const [nome, setNome] = useState('');
  const [plano, setPlano] = useState('');
  const [motivo, setMotivo] = useState('');
  const [comentario, setComentario] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedbacks_cancelamento')
      .select('*')
      .order('data_cancelamento', { ascending: false });
    if (error) toast.error('Erro ao carregar feedbacks.');
    else setFeedbacks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const motivosAgg = useMemo(() => {
    const m = feedbacks.reduce<Record<string, number>>((acc, f) => {
      acc[f.motivo] = (acc[f.motivo] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(m)
      .map(([motivo, total]) => ({ motivo, total }))
      .sort((a, b) => b.total - a.total);
  }, [feedbacks]);

  const motivoMaisComum = motivosAgg[0]?.motivo ?? '—';

  const resetForm = () => {
    setTelefone('');
    setNome('');
    setPlano('');
    setMotivo('');
    setComentario('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo) {
      toast.error('Escolha um motivo.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('feedbacks_cancelamento').insert({
      telefone: telefone.trim() || null,
      nome: nome.trim() || null,
      plano: plano || null,
      motivo,
      comentario: comentario.trim() || null,
      origem: 'MANUAL',
    });
    if (error) {
      toast.error('Erro ao salvar feedback.');
      setSaving(false);
      return;
    }
    toast.success('Feedback registrado.');
    setOpenModal(false);
    resetForm();
    setSaving(false);
    load();
  };

  const handleDelete = async () => {
    if (!paraExcluir) return;
    const { error } = await supabase.from('feedbacks_cancelamento').delete().eq('id', paraExcluir.id);
    if (error) toast.error('Erro ao excluir.');
    else {
      toast.success('Feedback removido.');
      setFeedbacks((prev) => prev.filter((f) => f.id !== paraExcluir.id));
    }
    setParaExcluir(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Feedbacks de Cancelamento</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entenda por que clientes estão cancelando para agir antes
          </p>
        </div>
        <Button onClick={() => setOpenModal(true)}>
          <Plus className="mr-2 h-4 w-4" /> Registrar Feedback
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiSimple title="Total de Feedbacks" value={feedbacks.length.toLocaleString('pt-BR')} />
        <KpiSimple title="Motivo Mais Comum" value={motivoMaisComum} />
        <KpiSimple
          title="Últimos 30 dias"
          value={feedbacks
            .filter((f) => {
              const diff = Date.now() - new Date(f.data_cancelamento).getTime();
              return diff <= 30 * 24 * 60 * 60 * 1000;
            })
            .length.toLocaleString('pt-BR')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Motivo</CardTitle>
            <CardDescription>Quantidade de cancelamentos por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            {motivosAgg.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-sm text-muted-foreground">
                Sem feedbacks ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={motivosAgg} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="motivo"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    width={140}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Motivos</CardTitle>
            <CardDescription>Quais razões mais aparecem</CardDescription>
          </CardHeader>
          <CardContent>
            {motivosAgg.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados ainda.</p>
            ) : (
              <ul className="space-y-3">
                {motivosAgg.map((m, i) => {
                  const pct = (m.total / feedbacks.length) * 100;
                  return (
                    <li key={m.motivo} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground">
                          {i + 1}. {m.motivo}
                        </span>
                        <span className="text-muted-foreground">
                          {m.total} ({pct.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Histórico de Feedbacks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : feedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      Nenhum feedback registrado ainda.
                    </TableCell>
                  </TableRow>
                ) : (
                  feedbacks.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="text-sm">{formatDate(f.data_cancelamento)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{f.nome || '—'}</span>
                          <span className="text-xs text-muted-foreground">{f.telefone || ''}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{f.plano || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{f.motivo}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {f.comentario || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {f.origem}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setParaExcluir(f)}
                          className="p-1.5 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal cadastro */}
      <Dialog
        open={openModal}
        onOpenChange={(open) => {
          setOpenModal(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Feedback de Cancelamento</DialogTitle>
            <DialogDescription>
              Use quando um cliente cancelar pelo WhatsApp ou outro canal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={120} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  maxLength={20}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plano">Plano que tinha</Label>
              <Select value={plano} onValueChange={setPlano}>
                <SelectTrigger id="plano">
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BASICO">Básico</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger id="motivo">
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comentario">Comentário</Label>
              <Textarea
                id="comentario"
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="O que o cliente disse exatamente?"
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir feedback?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
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

function KpiSimple({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
        <p className="text-2xl font-semibold text-foreground mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}
