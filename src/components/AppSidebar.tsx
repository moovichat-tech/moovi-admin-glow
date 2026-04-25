import {
  Home,
  Handshake,
  DollarSign,
  Megaphone,
  Store,
  FileDown,
  History,
  Settings as SettingsIcon,
  Sparkles,
  Users,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import mooviLogo from '@/assets/moovi-logo.png';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';

const programaItems = [
  { title: 'Home', url: '/', icon: Home },
  { title: 'Afiliados', url: '/afiliados', icon: Handshake },
  { title: 'Comissões', url: '/comissoes', icon: DollarSign },
  { title: 'Configurações da Campanha', url: '/campanha', icon: Megaphone },
  { title: 'Portal do Afiliado', url: '/portal', icon: Store },
  { title: 'Gerar Pagamentos', url: '/pagamentos/gerar', icon: FileDown },
  { title: 'Histórico de Pagamentos', url: '/pagamentos/historico', icon: History },
];

const operacoesItems = [
  { title: 'Usuários', url: '/usuarios', icon: Users },
  { title: 'Feedbacks', url: '/feedbacks', icon: MessageSquare },
];

const sistemaItems = [
  { title: 'Setup', url: '/setup', icon: Sparkles },
  { title: 'Configurações', url: '/settings', icon: SettingsIcon },
];

export function AppSidebar() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const renderItems = (items: typeof programaItems) =>
    items.map((item) => (
      <SidebarMenuItem key={item.url}>
        <SidebarMenuButton asChild isActive={location.pathname === item.url}>
          <NavLink
            to={item.url}
            end
            className="hover:bg-sidebar-accent/60"
            activeClassName="bg-sidebar-accent text-primary font-medium"
          >
            <item.icon className="mr-2 h-4 w-4" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ));

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <img src={mooviLogo} alt="Moovi" className="h-8 w-auto" />
        {!collapsed && (
          <span className="text-sm font-medium text-muted-foreground">Backoffice</span>
        )}
      </div>

      <SidebarContent className="pt-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Programa</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(programaItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Operações</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(operacoesItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Sistema</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>{renderItems(sistemaItems)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
