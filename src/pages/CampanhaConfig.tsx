import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function CampanhaConfig() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Configurações da Campanha</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Defina as regras do seu programa de afiliados
        </p>
      </div>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Regras de Comissão</CardTitle>
          <CardDescription>Padrão aplicado a novos afiliados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default-comm">Comissão padrão (%)</Label>
              <Input id="default-comm" type="number" defaultValue={20} min={0} max={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookie">Janela de atribuição (dias)</Label>
              <Input id="cookie" type="number" defaultValue={30} min={1} />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium">Comissão recorrente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Afiliado ganha em todas as renovações, não só na primeira venda
              </p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/60 p-4">
            <div>
              <p className="text-sm font-medium">Acesso VIP automático</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Afiliado recebe Premium grátis ao se cadastrar
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/40 border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Pagamento</CardTitle>
          <CardDescription>Como e quando pagar seus afiliados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min">Saldo mínimo para saque (R$)</Label>
              <Input id="min" type="number" defaultValue={50} min={0} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cycle">Ciclo de pagamento</Label>
              <Input id="cycle" defaultValue="Mensal (todo dia 10)" />
            </div>
          </div>
          <div>
            <Badge variant="outline" className="text-xs">
              Configurações em modo demonstração — persistência em breve
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Configurações salvas (demo).')}>Salvar alterações</Button>
      </div>
    </div>
  );
}
