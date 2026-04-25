import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthenticatedLayout } from "@/components/AuthenticatedLayout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Afiliados from "./pages/Afiliados";
import Comissoes from "./pages/Comissoes";
import CampanhaConfig from "./pages/CampanhaConfig";
import PortalAfiliado from "./pages/PortalAfiliado";
import GerarPagamentos from "./pages/GerarPagamentos";
import HistoricoPagamentos from "./pages/HistoricoPagamentos";
import Setup from "./pages/Setup";
import Usuarios from "./pages/Usuarios";
import Feedbacks from "./pages/Feedbacks";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              element={
                <ProtectedRoute>
                  <AuthenticatedLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Home />} />
              <Route path="/afiliados" element={<Afiliados />} />
              <Route path="/comissoes" element={<Comissoes />} />
              <Route path="/campanha" element={<CampanhaConfig />} />
              <Route path="/portal" element={<PortalAfiliado />} />
              <Route path="/pagamentos/gerar" element={<GerarPagamentos />} />
              <Route path="/pagamentos/historico" element={<HistoricoPagamentos />} />
              <Route path="/setup" element={<Setup />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/feedbacks" element={<Feedbacks />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
