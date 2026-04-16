import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Loader2, Trash2, Copy, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';

interface Afiliado {
  id: string;
  nome: string;
  whatsapp: string;
  comissao_percentual: number;
  pix_chave: string;
  link_rastreio: string;
  vendas: number;
  saldo_a_pagar: number;
  cliques_basico: number;
  cliques_pro: number;
  cliques_premium: number;
}

const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

const stripPhone = (value: string) => value.replace(/\D/g, '');

export default function Afiliados() {
  const { user } = useAuth();
  const [afiliados, setAfiliados] = useState<Afiliado[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [comissao, setComissao] = useState('20');
  const [pixChave, setPixChave] = useState('');

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
    setWhatsapp('');
    setComissao('20');
    setPixChave('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const digits = stripPhone(whatsapp);
    if (digits.length < 10) {
      toast.error('WhatsApp inválido.');
      return;
    }

    const link_rastreio = `https://moovi.chat/?ref=${digits}`;

    setSaving(true);
    const { error } = await supabase.from('afiliados').insert({
      user_id: user.id,
      nome: nome.trim(),
      whatsapp: digits,
      comissao_percentual: Number(comissao),
      pix_chave: pixChave.trim(),
      link_rastreio,
    });

    if (error) {
      toast.error('Erro ao cadastrar afiliado.');
    } else {
      toast.success('Afiliado cadastrado com sucesso!');
      setModalOpen(false);
      resetForm();
      fetchAfiliados();
    }
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
              <TableHead>Link de Rastreio</TableHead>
              <TableHead className="text-center">Comissão (%)</TableHead>
              <TableHead className="text-center">Cliques</TableHead>
              <TableHead className="text-center">Vendas</TableHead>
              <TableHead className="text-right">Saldo a Pagar (R$)</TableHead>
              <TableHead>Chave PIX</TableHead>
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
            ) : afiliados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum afiliado cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              afiliados.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.nome}</TableCell>
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
                  <TableCell className="text-right">
                    {Number(a.saldo_a_pagar).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.pix_chave}</TableCell>
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
