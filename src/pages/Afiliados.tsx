import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trash2, Copy, Plus, Info } from 'lucide-react';
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

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const stripPhone = (value: string) => value.replace(/\D/g, '');

const getAcessoBadge = (vencimento: string | null) => {
  if (!vencimento) return <span className="text-muted-foreground/60">-</span>;
  const now = new Date();
  const exp = new Date(vencimento);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) {
    return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white">{diffDays} dias restantes</Badge>;
  }
  return <Badge variant="destructive">Expirado</Badge>;
};

export default function Afiliados() {
  const { user } = useAuth();
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [redeSocial, setRedeSocial] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [comissao, setComissao] = useState('20');
  const [pixChave, setPixChave] = useState('');
  const [diasAcesso, setDiasAcesso] = useState('30');

  const fetchAfiliados = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('afiliados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar afiliados.');
    } else {
      setAfiliados(data ?? []);
    }
    setLoading(false);
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
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const digits = stripPhone(whatsapp);
    if (digits.length < 10) {
      toast.error('WhatsApp inválido.');
      return;
    }

    // Ensure 55 country code prefix
    const whatsappLimpo = digits.startsWith('55') ? digits : `55${digits}`;

    const dias = Number(diasAcesso);
    if (dias <= 0) {
      toast.error('Dias de acesso deve ser maior que 0.');
      return;
    }

    const vencimento = new Date();
    vencimento.setDate(vencimento.getDate() + dias);
    const vencimentoISO = vencimento.toISOString();

    const link_rastreio = `https://moovi.chat/?ref=${whatsappLimpo}`;

    setSaving(true);

    // Insert afiliado
    const { error: errAfiliado } = await supabase.from('afiliados').insert({
      user_id: user.id,
      nome: nome.trim(),
      rede_social: redeSocial.trim() || null,
      whatsapp: whatsappLimpo,
      comissao_percentual: Number(comissao),
      pix_chave: pixChave.trim(),
      link_rastreio,
      vencimento_acesso: vencimentoISO,
    });

    if (errAfiliado) {
      toast.error('Erro ao cadastrar afiliado.');
      setSaving(false);
      return;
    }

    // Upsert usuario with VIP access
    const { error: errUsuario } = await supabase.from('usuarios').upsert(
      {
        user_id: user.id,
        telefone: whatsappLimpo,
        plano: 'PREMIUM',
        status: 'Ativo',
        data_renovacao: vencimentoISO,
        gateway_pagamento: 'cortesia_afiliado',
      },
      { onConflict: 'telefone' }
    );

    if (errUsuario) {
      console.error('Erro ao conceder acesso VIP:', errUsuario);
      toast.warning('Afiliado cadastrado, mas houve erro ao conceder acesso VIP.');
    } else {
      toast.success('Afiliado cadastrado e acesso VIP concedido!');
    }

    setModalOpen(false);
    resetForm();
    fetchAfiliados();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('afiliados').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir afiliado.');
    } else {
      toast.success('Afiliado removido.');
      setAfiliados((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Afiliados</h1>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Afiliado
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Rede Social</TableHead>
              <TableHead>Link de Rastreio</TableHead>
              <TableHead className="text-center">Comissão (%)</TableHead>
              <TableHead className="text-center">Cliques</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-center">Conversão (%)</TableHead>
              <TableHead className="text-right">Saldo a Pagar (R$)</TableHead>
              <TableHead>Chave PIX</TableHead>
              <TableHead className="text-center">Acesso Moovi</TableHead>
              <TableHead className="w-10" />
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
                          <p>Básico: {a.cliques_basico ?? 0} | Pro: {a.cliques_pro ?? 0} | Premium: {a.cliques_premium ?? 0}</p>
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
                        <span className={taxa > 0 ? 'text-emerald-500 font-medium' : 'text-muted-foreground'}>
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
                    <button onClick={() => handleDelete(a.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Afiliado</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required placeholder="João da Silva" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="redeSocial">Rede Social (Instagram, TikTok, etc.)</Label>
              <Input id="redeSocial" value={redeSocial} onChange={(e) => setRedeSocial(e.target.value)} placeholder="@usuario ou link do canal" />
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
              <Input id="comissao" type="number" min={0} max={100} value={comissao} onChange={(e) => setComissao(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pix">Chave PIX</Label>
              <Input id="pix" value={pixChave} onChange={(e) => setPixChave(e.target.value)} required placeholder="CPF, e-mail ou chave aleatória" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diasAcesso">Dias de Acesso ao Moovi (Cortesia)</Label>
              <Input id="diasAcesso" type="number" min={1} value={diasAcesso} onChange={(e) => setDiasAcesso(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Afiliado'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
