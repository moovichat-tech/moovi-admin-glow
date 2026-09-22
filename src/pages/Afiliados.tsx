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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarClock, Loader2, Trash2, Copy, Plus, Info, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

interface Afiliado {
  id: string;
  nome: string;
  email?: string | null;
  rede_social: string | null;
  whatsapp: string;
  comissao_percentual: number | string | null;
  pix_chave: string;
  link_rastreio: string;
  vendas?: number | string | null;
  vendas_realizadas?: number | string | null;
  saldo_a_pagar?: number | string | null;
  saldo_comissao?: number | string | null;
  comissao_total?: number | string | null;
  cliques_basico?: number | string | null;
  cliques_pro?: number | string | null;
  cliques_premium?: number | string | null;
  cliques_total?: number | string | null;
  vencimento_acesso: string | null;
}

/** Converte qualquer valor (null, undefined, '', '1.234,56', '12.5') em número seguro */
const num = (value: unknown): number => {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const raw = String(value).trim();
  if (!raw) return 0;
  // trata formato pt-BR "1.234,56"
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = parseFloat(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const brl = (value: unknown) =>
  num(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const getVendas = (a: Afiliado) => num(a.vendas_realizadas ?? a.vendas);

const getCliques = (a: Afiliado) => {
  const soma = num(a.cliques_basico) + num(a.cliques_pro) + num(a.cliques_premium);
  return soma > 0 ? soma : num(a.cliques_total);
};

const getSaldo = (a: Afiliado) => num(a.saldo_comissao ?? a.saldo_a_pagar);

const getComissaoTotal = (a: Afiliado) =>
  a.comissao_total !== null && a.comissao_total !== undefined && a.comissao_total !== ''
    ? num(a.comissao_total)
    : getSaldo(a);

const getConversao = (a: Afiliado) => {
  const cliques = getCliques(a);
  if (!cliques) return 0;
  const taxa = (getVendas(a) / cliques) * 100;
  return Number.isFinite(taxa) ? taxa : 0;
};

const LISTAR_URL = 'https://n8n.fisherai.shop/webhook/listar-afiliados';
const CADASTRAR_URL = 'https://n8n.fisherai.shop/webhook/cadastrar-afiliado';
const EXCLUIR_URL = 'https://n8n.fisherai.shop/webhook/excluir-afiliado';
const EDITAR_URL = 'https://n8n.fisherai.shop/webhook/editar-afiliado';
const AJUSTAR_ACESSO_URL = 'https://n8n.fisherai.shop/webhook/ajustar-acesso-afiliado';

const affiliateSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome completo.').max(120),
  email: z.string().trim().email('Informe um e-mail válido.').max(255),
  redeSocial: z.string().trim().max(200),
  whatsapp: z.string().refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11 || (digits.startsWith('55') && digits.length >= 12);
  }, 'Informe um WhatsApp válido com DDD.'),
  comissao: z.coerce.number().min(0, 'A comissão não pode ser negativa.').max(100, 'A comissão não pode passar de 100%.'),
  pixChave: z.string().trim().min(1, 'Informe a chave PIX.').max(120),
});


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
  if (Number.isNaN(exp.getTime())) return <span className="text-muted-foreground/60">-</span>;
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return <Badge className="bg-primary text-primary-foreground hover:bg-primary/90">{diffDays} dias restantes</Badge>;
  }
  return <Badge variant="destructive">Expirado</Badge>;
};

const getDiasRestantes = (vencimento: string | null) => {
  if (!vencimento) return 0;
  const expiration = new Date(vencimento);
  if (Number.isNaN(expiration.getTime())) return 0;
  return Math.max(0, Math.ceil((expiration.getTime() - Date.now()) / 86_400_000));
};

const formatDate = (value: string | null) => {
  if (!value) return 'Sem vencimento';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Data inválida' : date.toLocaleDateString('pt-BR');
};

export default function Afiliados() {
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState<Afiliado | null>(null);
  const [gerenciandoAcesso, setGerenciandoAcesso] = useState<Afiliado | null>(null);
  const [operacaoAcesso, setOperacaoAcesso] = useState<'adicionar' | 'retirar'>('adicionar');
  const [diasAjuste, setDiasAjuste] = useState('15');
  const [salvandoAcesso, setSalvandoAcesso] = useState(false);
  const [paraExcluir, setParaExcluir] = useState<Afiliado | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  // form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [redeSocial, setRedeSocial] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [comissao, setComissao] = useState('20');
  const [pixChave, setPixChave] = useState('');
  const [diasAcesso, setDiasAcesso] = useState('15');

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
    setEmail('');
    setRedeSocial('');
    setWhatsapp('');
    setComissao('20');
    setPixChave('');
    setDiasAcesso('15');
    setEditando(null);
  };

  const openNovo = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditar = (a: Afiliado) => {
    setEditando(a);
    setNome(a.nome);
    setEmail(a.email || '');
    setRedeSocial(a.rede_social || '');
    setWhatsapp(phoneFromStored(a.whatsapp));
    setComissao(String(a.comissao_percentual));
    setPixChave(a.pix_chave);
    setDiasAcesso('0');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = affiliateSchema.safeParse({ nome, email, redeSocial, whatsapp, comissao, pixChave });
    if (!validation.success) {
      toast.error(validation.error.issues[0]?.message || 'Revise os dados informados.');
      return;
    }
    const digits = stripPhone(validation.data.whatsapp);
    const whatsappLimpo = digits.startsWith('55') ? digits : `55${digits}`;

    const dias = Number(diasAcesso) || 0;

    if (!editando && dias <= 0) {
      toast.error('Dias de acesso deve ser maior que 0.');
      return;
    }

    setSaving(true);
    try {
      const url = editando ? EDITAR_URL : CADASTRAR_URL;
      const body = editando
        ? {
            id: editando.id,
            nome: validation.data.nome,
            email: validation.data.email.toLowerCase(),
            rede_social: validation.data.redeSocial,
            whatsapp: whatsappLimpo,
            telefone: whatsappLimpo,
            comissao: validation.data.comissao,
            pix: validation.data.pixChave,
          }
        : {
            nome: validation.data.nome,
            email: validation.data.email.toLowerCase(),
            rede_social: validation.data.redeSocial,
            whatsapp: whatsappLimpo,
            telefone: whatsappLimpo,
            comissao: validation.data.comissao,
            pix: validation.data.pixChave,
            dias_acesso: dias,
            plano: 'PREMIUM',
          };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success(editando ? 'Afiliado atualizado com sucesso' : 'Afiliado cadastrado com sucesso!');
      setModalOpen(false);
      resetForm();
      await fetchAfiliados();
    } catch (err) {
      console.error('Erro ao salvar afiliado:', err);
      toast.error(editando ? 'Erro ao atualizar afiliado.' : 'Erro ao cadastrar afiliado.');
    } finally {
      setSaving(false);
    }
  };

  const openGerenciarAcesso = (afiliado: Afiliado) => {
    setGerenciandoAcesso(afiliado);
    setOperacaoAcesso('adicionar');
    setDiasAjuste('15');
  };

  const handleAjustarAcesso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gerenciandoAcesso) return;
    const dias = Number(diasAjuste);
    if (!Number.isInteger(dias) || dias <= 0 || dias > 3650) {
      toast.error('Informe uma quantidade inteira entre 1 e 3650 dias.');
      return;
    }
    const restantes = getDiasRestantes(gerenciandoAcesso.vencimento_acesso);
    if (operacaoAcesso === 'retirar' && dias > restantes) {
      toast.error(`É possível retirar no máximo ${restantes} dia(s).`);
      return;
    }

    setSalvandoAcesso(true);
    try {
      const res = await fetch(AJUSTAR_ACESSO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gerenciandoAcesso.id, operacao: operacaoAcesso, dias }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success(operacaoAcesso === 'adicionar' ? 'Dias de acesso adicionados.' : 'Dias de acesso retirados.');
      setGerenciandoAcesso(null);
      await fetchAfiliados();
    } catch (err) {
      console.error('Erro ao ajustar acesso do afiliado:', err);
      toast.error('Não foi possível atualizar o acesso. Verifique o fluxo no n8n.');
    } finally {
      setSalvandoAcesso(false);
    }
  };

  const previewVencimento = (() => {
    if (!gerenciandoAcesso) return null;
    const dias = Number(diasAjuste);
    if (!Number.isInteger(dias) || dias <= 0) return null;
    const atual = gerenciandoAcesso.vencimento_acesso ? new Date(gerenciandoAcesso.vencimento_acesso) : new Date();
    const base = Number.isNaN(atual.getTime()) || atual.getTime() < Date.now() ? new Date() : atual;
    const novaData = new Date(base);
    novaData.setDate(novaData.getDate() + (operacaoAcesso === 'adicionar' ? dias : -dias));
    return novaData;
  })();

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
              <TableHead>E-mail</TableHead>
              <TableHead>Rede Social</TableHead>
              <TableHead>Link de Rastreio</TableHead>
              <TableHead className="text-center">Comissão</TableHead>
              <TableHead className="text-center">Cliques</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-center">Conversão</TableHead>
              <TableHead className="text-right">Saldo a Pagar</TableHead>
              <TableHead className="text-right">Comissão Total</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead className="text-center">Acesso Moovi</TableHead>
              <TableHead className="w-20 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-10">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : afiliados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-10 text-muted-foreground">
                  Nenhum afiliado cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              afiliados.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.email || '—'}</TableCell>
                  <TableCell className="text-sm">
                    {a.rede_social ? a.rede_social : <span className="text-muted-foreground/60">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">{a.link_rastreio}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => copyLink(a.link_rastreio)} className="h-7 w-7" title="Copiar link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{num(a.comissao_percentual)}%</TableCell>
                  <TableCell className="text-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex items-center gap-1 cursor-default">
                            {getCliques(a)}
                            <Info className="h-3.5 w-3.5 text-muted-foreground/60" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Básico: {num(a.cliques_basico)} | Pro: {num(a.cliques_pro)} | Premium:{' '}
                            {num(a.cliques_premium)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="text-center">{getVendas(a)}</TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const taxa = getConversao(a);
                      return (
                        <span className={taxa > 0 ? 'text-primary font-medium' : 'text-muted-foreground'}>
                          {taxa.toFixed(2)}%
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">{brl(getSaldo(a))}</TableCell>
                  <TableCell className="text-right font-medium">{brl(getComissaoTotal(a))}</TableCell>

                  <TableCell className="text-xs text-muted-foreground">{a.pix_chave}</TableCell>
                  <TableCell className="text-center">{getAcessoBadge(a.vencimento_acesso)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openGerenciarAcesso(a)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        title="Gerenciar acesso"
                      >
                        <CalendarClock className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditar(a)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setParaExcluir(a)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                autoComplete="email"
                placeholder="afiliado@exemplo.com"
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
            {!editando && (
              <div className="space-y-2">
                <Label htmlFor="diasAcesso">Dias de Acesso ao Moovi (Cortesia)</Label>
                <Input
                  id="diasAcesso"
                  type="number"
                  min={1}
                  max={3650}
                  value={diasAcesso}
                  onChange={(e) => setDiasAcesso(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">O afiliado será cadastrado no plano Premium.</p>
              </div>
            )}
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

      <Dialog open={!!gerenciandoAcesso} onOpenChange={(open) => !open && setGerenciandoAcesso(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar acesso ao Moovi</DialogTitle>
            <DialogDescription>
              {gerenciandoAcesso?.nome} · vencimento atual em {formatDate(gerenciandoAcesso?.vencimento_acesso ?? null)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAjustarAcesso} className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="operacaoAcesso">Operação</Label>
                <Select value={operacaoAcesso} onValueChange={(value: 'adicionar' | 'retirar') => setOperacaoAcesso(value)}>
                  <SelectTrigger id="operacaoAcesso">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adicionar">Adicionar dias</SelectItem>
                    <SelectItem value="retirar">Retirar dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasAjuste">Quantidade de dias</Label>
                <Input
                  id="diasAjuste"
                  type="number"
                  min={1}
                  max={operacaoAcesso === 'retirar' ? Math.max(1, getDiasRestantes(gerenciandoAcesso?.vencimento_acesso ?? null)) : 3650}
                  step={1}
                  value={diasAjuste}
                  onChange={(e) => setDiasAjuste(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Resultado previsto</p>
              <p className="mt-1 font-medium text-foreground">
                {previewVencimento ? previewVencimento.toLocaleDateString('pt-BR') : 'Informe uma quantidade válida'}
              </p>
              {operacaoAcesso === 'retirar' && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Disponível para retirada: {getDiasRestantes(gerenciandoAcesso?.vencimento_acesso ?? null)} dia(s)
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGerenciandoAcesso(null)} disabled={salvandoAcesso}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvandoAcesso || (operacaoAcesso === 'retirar' && getDiasRestantes(gerenciandoAcesso?.vencimento_acesso ?? null) === 0)}>
                {salvandoAcesso && <Loader2 className="h-4 w-4 animate-spin" />}
                Aplicar ajuste
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
