# Portal restrito do afiliado

## Objetivo
Criar uma experiência separada do backoffice para que afiliados entrem com o e-mail cadastrado e acompanhem suas comissões, cliques e vendas.

## Implementação

### 1. Acesso do afiliado
- Criar a página pública `/afiliado` com a identidade visual escura do Moovi, título, campo de e-mail e botão com carregamento.
- Enviar o e-mail para `POST https://n8n.fisherai.shop/webhook/auth-afiliado`.
- Exibir a mensagem devolvida pelo serviço quando o acesso falhar.
- Em caso de sucesso, guardar `afiliado_id` e `nome` no navegador e encaminhar para `/afiliado/dashboard`.

### 2. Proteção e sessão
- Criar uma proteção exclusiva para a área do afiliado, independente do login administrativo.
- Redirecionar para `/afiliado` quando não existir identificação válida no navegador.
- Implementar “Sair” limpando os dados salvos e retornando ao login.

### 3. Dashboard
- Buscar `GET https://n8n.fisherai.shop/webhook/dashboard-afiliado?id={afiliado_id}` ao abrir a página.
- Normalizar números, valores monetários, datas, status e respostas envelopadas para evitar `NaN` ou conteúdo quebrado.
- Mostrar saudação, cartões de comissões pendentes, comissões pagas e total de cliques.
- Exibir a distribuição de cliques entre Básico, Pro e Premium com barras horizontais proporcionais.
- Renderizar o histórico em tabela com data, cliente, valor da venda, comissão e status.
- Incluir skeletons, falha com nova tentativa e estado vazio para o histórico.

## Detalhes técnicos
- Criar páginas e utilitários próprios do portal, sem alterar a autenticação do backoffice.
- Reutilizar botões, inputs, badges, tabelas, skeletons e tokens visuais existentes.
- Aceitar campos numéricos como número ou texto e respostas diretas ou dentro de `data`.
- Usar os valores semânticos do tema para os destaques verde e amarelo.

## Validação
- Verificar login com erro e sucesso simulados, persistência da identificação, proteção de rota e saída.
- Simular o dashboard com dados, vazio e erro, conferindo formatação e estados de carregamento.
- Validar a experiência em desktop e celular e executar os testes existentes.
