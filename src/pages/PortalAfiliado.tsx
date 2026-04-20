import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const portalLink = 'https://moovi.chat/?ref=parceiro';

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
          Personalize a página onde seus afiliados se cadastram
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Link do Portal</CardTitle>
          <CardDescription>Compartilhe este link para receber novos afiliados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input readOnly value={portalLink} className="font-mono text-sm bg-secondary/40" />
            <Button variant="secondary" onClick={() => copy(portalLink)}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => window.open(portalLink, '_blank')}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Conteúdo da Página</CardTitle>
          <CardDescription>O que afiliados vão ver</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input defaultValue="Seja parceiro do Moovi" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              rows={4}
              defaultValue="Indique o Moovi e ganhe 20% de comissão recorrente em todas as assinaturas. Acesso Premium grátis incluso."
            />
          </div>
          <div className="space-y-2">
            <Label>Benefícios destacados</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">20% recorrente</Badge>
              <Badge variant="secondary">Acesso Premium grátis</Badge>
              <Badge variant="secondary">Pagamento via PIX</Badge>
              <Badge variant="secondary">Dashboard em tempo real</Badge>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Modo demonstração — edição persistente em breve
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
