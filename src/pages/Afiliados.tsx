import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Copy, Plus, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';

interface Afiliado {
  id: string;
  nome: string;
  rede_social: string | null;
  whatsapp: string;
  comissao_percentual: number;
  pix_chave: string;
  link_rastreio: string;
  vendas: number;
  saldo_a_pagar: number;
  cliques_basico: number;
  cliques_pro: number;
  cliques_premium: number;
  vencimento_acesso: string | null;
}

const LISTAR_URL = 'https://n8n.fisherai.shop/webhook/listar-afiliados';
const CADASTRAR_URL = 'https://n8n.fisherai.shop/webhook/cadastrar-afiliado';
const EXCLUIR_URL = 'https://n8n.fisherai.shop/webhook/excluir-afiliado';
const EDITAR_URL = 'https://n8n.fisherai.shop/webhook/editar-afiliado';

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const stripPhone = (value: string) => value.replace(/\D/g, '');

const phoneFromStored = (stored: string) => {
  // Remove possible 55 prefix for display in form
  const d = stripPhone(stored);
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  return formatPhone(local);
};

const getAcessoBadge = (vencimento: string | null) => {
  if (!vencimento) return <span className="text-muted-foreground/60">-</span>;
  const now = new Date();
  const exp = new Date(vencimento);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">{diffDays} dias restantes</Badge>;
  }
  return <Badge variant="destructive">Expirado</Badge>;
};

export default function Afiliados() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Afiliado | null>(null);
  const [paraExcluir, setParaExcluir] = useState<Afiliado | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // form state
  const [nome, setNome] = useState('');
  const [redeSocial, setRedeSocial] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [comissao, setComissao] = useState('20');
  const [pixChave, setPixChave] = useState('');
  const [diasAcesso, setDiasAcesso] = useState('30');

  const fetchAfiliados = async () => {
    setLoading(true);
    try {
      const res = await fetch(LISTAR_URL, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const lista: Afiliado[] = Array.isArray(json) ? json : (json.data ?? json.afiliados ?? []);
      setAfiliados(lista);
    } catch (err) {
      console.error('Erro ao carregar afiliados:', err);
      toast.error('Erro ao carregar afiliados.');
      setAfiliados([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAfiliados();
  }, []);

  const resetForm = () => {
    setNome('');
    setRedeSocial('');
    setWhatsapp('');
    setComissao('20');
    setPixChave('');
    setDiasAcesso('30');
    setEditando(null);
  };

  const openNovo = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditar = (a: Afiliado) => {
    setEditando(a);
    setNome(a.nome);
    setRedeSocial(a.rede_social || '');
    setWhatsapp(phoneFromStored(a.whatsapp));
    setComissao(String(a.comissao_percentual));
    setPixChave(a.pix_chave);
    setDiasAcesso('0');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const digits = stripPhone(whatsapp);
    if (digits.length < 10) {
      toast.error('WhatsApp inválido.');
      return;
    }
    const whatsappLimpo = digits.startsWith('55') ? digits : `55${digits}`;

    const dias = Number(diasAcesso);
    if (dias <= 0) {
      toast.error('Dias de acesso deve ser maior que 0.');
      return;
    }

    if (editando) {
      toast.error('Edição via API ainda não disponível.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(CADASTRAR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          rede_social: redeSocial.trim(),
          whatsapp: whatsappLimpo,
          comissao: Number(comissao),
          pix: pixChave.trim(),
          dias_acesso: dias,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success('Afiliado cadastrado com sucesso!');
      setModalOpen(false);
      resetForm();
      await fetchAfiliados();
    } catch (err) {
      console.error('Erro ao cadastrar afiliado:', err);
      toast.error('Erro ao cadastrar afiliado.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!paraExcluir) return;
    setExcluindo(true);
    try {
      const res = await fetch(EXCLUIR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paraExcluir.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success('Afiliado excluído com sucesso');
      setParaExcluir(null);
      await fetchAfiliados();
    } catch (err) {
      console.error('Erro ao excluir afiliado:', err);
      toast.error('Erro ao excluir afiliado.');
    } finally {
      setExcluindo(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Gestão de Afiliados</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {afiliados.length.toLocaleString('pt-BR')} afiliado(s) cadastrado(s)
          </p>
        </div>
        <Button onClick={openNovo}>
          <Plus className="mr-2 h-4 w-4" /> Novo Afiliado
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Rede Social</TableHead>
              <TableHead>Link de Rastreio</TableHead>
              <TableHead className="text-center">Comissão</TableHead>
              <TableHead className="text-center">Cliques</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-center">Conversão</TableHead>
              <TableHead className="text-right">Saldo a Pagar</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead className="text-center">Acesso Moovi</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : afiliados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  Nenhum afiliado cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              afiliados.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-sm">
                    {a.rede_social ? a.rede_social : <span className="text-muted-foreground/60">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{a.link_rastreio}</span>
                      <button onClick={() => copyLink(a.link_rastreio)} className="text-muted-foreground hover:text-foreground">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{a.comissao_percentual}%</TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-default">
                            {(a.cliques_basico ?? 0) + (a.cliques_pro ?? 0) + (a.cliques_premium ?? 0)}
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Básico: {a.cliques_basico ?? 0} | Pro: {a.cliques_pro ?? 0} | Premium:{' '}
                            {a.cliques_premium ?? 0}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">{a.vendas}</TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const total = (a.cliques_basico ?? 0) + (a.cliques_pro ?? 0) + (a.cliques_premium ?? 0);
                      const taxa = total > 0 ? (a.vendas / total) * 100 : 0;
                      return (
                        <span className={taxa > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                          {taxa.toFixed(2)}%
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    {Number(a.saldo_a_pagar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.pix_chave}</TableCell>
                  <TableCell className="text-center">{getAcessoBadge(a.vencimento_acesso)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEditar(a)}
                        className="p-1.5 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setParaExcluir(a)}
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

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Afiliado' : 'Novo Afiliado'}</DialogTitle>
            {editando && (
              <DialogDescription>
                A edição não recria o link de rastreio nem reaplica acesso VIP automaticamente.
              </DialogDescription>
            )}
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                maxLength={120}
                placeholder="João da Silva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redeSocial">Rede Social</Label>
              <Input
                id="redeSocial"
                value={redeSocial}
                onChange={(e) => setRedeSocial(e.target.value)}
                maxLength={200}
                placeholder="@usuario ou link do canal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                required
                placeholder="(99) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comissao">Comissão (%)</Label>
              <Input
                id="comissao"
                type="number"
                min={0}
                max={100}
                value={comissao}
                onChange={(e) => setComissao(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix">Chave PIX</Label>
              <Input
                id="pix"
                value={pixChave}
                onChange={(e) => setPixChave(e.target.value)}
                required
                maxLength={120}
                placeholder="CPF, e-mail ou chave aleatória"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diasAcesso">
                {editando ? 'Renovar acesso por (dias)' : 'Dias de Acesso ao Moovi (Cortesia)'}
              </Label>
              <Input
                id="diasAcesso"
                type="number"
                min={1}
                max={3650}
                value={diasAcesso}
                onChange={(e) => setDiasAcesso(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...
                  </>
                ) : editando ? (
                  'Salvar alterações'
                ) : (
                  'Salvar Afiliado'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!paraExcluir} onOpenChange={(open) => !open && setParaExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir afiliado?</AlertDialogTitle>
            <AlertDialogDescription>
              {paraExcluir && (
                <>
                  Remove <span className="font-medium text-foreground">{paraExcluir.nome}</span> permanentemente.
                  Cliques e vendas históricas associadas a este registro serão perdidas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={excluindo}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {excluindo ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
