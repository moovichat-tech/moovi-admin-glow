import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, LayoutDashboard, Send, UserPlus, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const portalLink = 'https://backoffice.moovi.chat/afiliado';

const portalSteps = [
  {
    title: 'Cadastro',
    description: 'Você cadastra o afiliado na aba "Afiliados" informando seus dados básicos e o e-mail.',
    icon: UserPlus,
  },
  {
    title: 'Compartilhamento',
    description: 'Você envia o link do portal (acima) para o parceiro.',
    icon: Send,
  },
  {
    title: 'Acesso Simplificado',
    description:
      'O afiliado acessa a página e entra no sistema digitando apenas o seu e-mail cadastrado (autenticação segura e sem senhas complexas).',
    icon: KeyRound,
  },
  {
    title: 'Transparência',
    description:
      'Dentro do portal, o parceiro terá acesso a um dashboard exclusivo com o total de cliques, conversões, comissões pendentes e valores já pagos.',
    icon: LayoutDashboard,
  },
];

export default function PortalAfiliado() {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Portal do Afiliado</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Central de acesso e acompanhamento dos seus parceiros
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Link do Portal</CardTitle>
          <CardDescription>Envie este link para seus afiliados acessarem o painel restrito.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input readOnly value={portalLink} className="font-mono text-sm bg-secondary/40" />
            <Button variant="secondary" onClick={() => copy(portalLink)}>
              <Copy className="h-4 w-4" />
              Copiar
            </Button>
            <Button variant="outline" onClick={() => window.open(portalLink, '_blank')}>
              <ExternalLink className="h-4 w-4" />
              Abrir em nova guia
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Como funciona o Portal do Afiliado?</CardTitle>
          <CardDescription>Do cadastro ao acompanhamento das comissões em quatro etapas.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="grid gap-3 sm:grid-cols-2">
            {portalSteps.map((step, index) => {
              const Icon = step.icon;

              return (
                <li key={step.title} className="flex gap-4 rounded-md border border-border/60 bg-secondary/20 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="font-medium text-foreground">
                      {index + 1}. {step.title}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
