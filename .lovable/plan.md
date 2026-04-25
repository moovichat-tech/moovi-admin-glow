## Escopo

Quatro mudanças focadas no frontend (sem alterar backend nem webhooks novos). Onde a fonte de dados não está disponível ainda, uso dados de exemplo/mock claramente marcados, prontos pra trocar pela API depois.

---

## 1. Home (`src/pages/Home.tsx`) — reformular

**Remover**: card "Seu Portal de Afiliados" (link + botão copiar).

**Header da página** ganha um filtro de período no canto superior direito:
- Select com: `Este mês`, `Últimos 3 meses`, `Últimos 6 meses`, `Últimos 12 meses`, `Este ano`, `Personalizado`.
- Quando "Personalizado", abre um popover com dois `Calendar` (data inicial / data final) usando shadcn DatePicker (com `pointer-events-auto`).
- O período selecionado afeta os KPIs e gráficos.

**KPIs (5 cards em grid responsivo)**:
1. Quantidade de Usuários
2. Receita
3. Comissão de Afiliados
4. Cliques
5. Quantidade de Assinantes

Layout: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`. Mantém o estilo `BigKpi` atual (card escuro, número grande tabular).

**Mantém os 2 gráficos** (Receita / Comissões) abaixo dos KPIs, agora alimentados pelo período global do header (removo os selects internos de cada gráfico).

**Novos blocos de Ranking** (lado a lado, `grid-cols-1 lg:grid-cols-2`):
- **Top 10 Afiliados por Comissão** — tabela: posição, nome, comissão total (BRL).
- **Top 10 Afiliados por Vendas** — tabela: posição, nome, vendas (qtd).

Posição renderizada como badge circular numerada (1, 2, 3 com destaque dourado/prata/bronze sutil usando tokens existentes; demais em `muted`).

**Dados**: como o usuário pediu "foque apenas no frontend", uso arrays mock dentro de `Home.tsx` (constantes no topo: `MOCK_KPIS`, `MOCK_RANKING_COMISSAO`, `MOCK_RANKING_VENDAS`, `MOCK_SERIES`). Comentário `// TODO: ligar à API n8n` marcando os pontos de integração futura. Removo o `useEffect` que lê do Supabase.

---

## 2. Afiliados (`src/pages/Afiliados.tsx`) — coluna nova

- Nova coluna "Comissão Total" entre "Vendas" e "Conversão" (ou após "Saldo a Pagar"). Decisão: colocar **logo após "Saldo a Pagar"**, com label `Comissão Total`, alinhada à direita, formatada em BRL.
- Como o backend ainda não retorna esse campo: na interface `Afiliado` adiciono `comissao_total?: number` opcional. No render, uso `a.comissao_total ?? a.saldo_a_pagar` como fallback (mostra ao menos algo coerente até o webhook devolver o histórico).
- Atualizar `colSpan` dos estados de loading/empty (de 11 para 12).

---

## 3. Sidebar + rotas — remover Indicados

- `src/components/AppSidebar.tsx`: remover item "Indicados" do `programaItems`. "Usuários" continua em Operações.
- `src/App.tsx`: remover import `Indicados` e a rota `/indicados`.
- `src/pages/Indicados.tsx`: deletar arquivo.

---

## 4. Usuários (`src/pages/Usuarios.tsx`) — detalhes enriquecidos

Mantém a tabela atual; o que muda é o **drawer de detalhes** (`Sheet`) ao clicar no olho.

Reestruturar o conteúdo do drawer em seções:

**Seção "Dados do Cliente"** (já existe, manter campos atuais: telefone, plano, status, gateway, renovação, cadastro, IDs).

**Seção "Origem"** (nova):
- Se `gateway_pagamento === 'cortesia_afiliado'` (ou outro marcador): mostrar nome do afiliado e link de rastreio.
- Caso contrário: "Cadastro direto / orgânico".
- Como não há FK afiliado→usuário no schema, uso lookup heurístico via Supabase: buscar em `afiliados` o registro cujo `link_rastreio` bate com algum campo de referência. Se não houver dado, mostro placeholder "—" + comentário `// TODO`.

**Seção "Assinatura Ativa"** (nova):
- Query `assinaturas` por `telefone = usuario.telefone` (mais recente, status ACTIVE).
- Mostra: plano, ciclo, valor, próximo vencimento, data de início.
- Estado vazio: "Sem assinatura ativa".

**Seção "Histórico de Pagamentos"** (nova):
- Query `pagamentos` por `telefone = usuario.telefone`, ordem desc por `data_pagamento`.
- Lista compacta: data, valor (BRL), status (badge), método. Limita a 10 últimos com link "ver mais" desabilitado por enquanto.

**Seção "Feedback de Cancelamento"** (nova, condicional):
- Query `feedbacks_cancelamento` por `telefone = usuario.telefone`, ordem desc, take 1.
- Se existir: mostra motivo, comentário, data_cancelamento.
- Se não: seção não aparece.

**Carregamento das seções extras**: ao abrir o drawer (`useEffect` em `selecionado`), dispara as 4 queries em paralelo via `Promise.all` e armazena em estado local (`detalhes`). Loader sutil enquanto carrega.

---

## Detalhes técnicos

- **Filtro de período (Home)**: estado `{ tipo: 'preset' | 'custom', preset?: string, from?: Date, to?: Date }`. Helper `getRange()` devolve `{from, to}` para qualquer caso. Usado para filtrar `MOCK_SERIES` por enquanto.
- **DatePicker custom**: `Popover` + dois `Calendar mode="single"` lado a lado, com botão "Aplicar" no rodapé. Adicionar `className="pointer-events-auto"` no Calendar (regra do projeto).
- **Ranking medals**: função `medalClass(pos)` retorna classes Tailwind (`bg-primary/20 text-primary` p/ 1º, `bg-secondary` p/ 2º-3º, `bg-muted` demais).
- **Tipos**: `interface Pagamento`, `interface Assinatura`, `interface Feedback`, `interface AfiliadoOrigem` no topo de `Usuarios.tsx`.
- **Não criar** novos componentes de UI shadcn — reusa `Card`, `Table`, `Badge`, `Sheet`, `Calendar`, `Popover`, `Select` já no projeto.

---

## Arquivos afetados

- editar: `src/pages/Home.tsx` (reescrito)
- editar: `src/pages/Afiliados.tsx` (coluna nova)
- editar: `src/pages/Usuarios.tsx` (drawer enriquecido)
- editar: `src/components/AppSidebar.tsx` (remover item)
- editar: `src/App.tsx` (remover rota/import)
- deletar: `src/pages/Indicados.tsx`