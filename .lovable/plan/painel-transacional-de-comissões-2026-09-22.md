# Painel transacional de comissões

## Objetivo
Transformar a página **Comissões** em um painel gerencial conectado aos webhooks do n8n, com resumo por afiliado, histórico individual e baixa de pagamentos sem recarregar a página.

## Implementação

### 1. Resumo de comissões
- Substituir a consulta atual ao banco pelo `GET https://n8n.fisherai.shop/webhook/resumo-comissoes`.
- Criar tipos e normalização segura para afiliado, percentuais, vendas, saldo e PIX.
- Manter os indicadores de Total a Pagar, Vendas Geradas e Afiliados Ativos calculados a partir da resposta.
- Exibir skeletons durante a carga, mensagem de lista vazia e aviso de erro com opção de tentar novamente.
- Formatar valores em BRL e destacar saldos positivos com a cor de sucesso do tema.

### 2. Detalhes por afiliado
- Tornar cada linha acessível por clique e teclado, com indicação visual de que abre detalhes.
- Abrir um painel lateral com nome, saldo e histórico do afiliado.
- Buscar as transações em `GET https://n8n.fisherai.shop/webhook/detalhes-comissao?afiliado_id={id}` sempre que um afiliado for selecionado.
- Exibir Nome do Cliente, Data da Venda, Valor da Venda, Valor da Comissão e Status.
- Usar badge amarelo para pendente e verde para pago, com skeletons, erro e estado vazio próprios do painel.

### 3. Dar baixa em comissão
- Mostrar **Dar Baixa** somente nas transações pendentes.
- Enviar `POST https://n8n.fisherai.shop/webhook/pagar-comissao` com JSON `{ "comissao_id": "..." }`.
- Manter loading por transação para bloquear cliques duplicados.
- Após sucesso, alterar imediatamente a transação para **Pago**, mostrar o toast e atualizar o resumo em segundo plano.
- Em falha, preservar a transação pendente e apresentar uma mensagem clara.

## Detalhes técnicos
- Reutilizar os componentes existentes de tabela, painel lateral, botões, badges e skeletons.
- Aceitar respostas em array direto ou envelopes comuns (`data`, `afiliados`, `transacoes`) sem mascarar respostas inválidas.
- Tratar números nulos, strings numéricas e datas inválidas sem exibir `NaN` ou datas quebradas.
- Preservar o tema escuro e os tokens visuais atuais do Moovi.

## Validação
- Verificar estados de carregamento, vazio e erro do resumo e do histórico.
- Simular as três APIs no navegador para confirmar payload, loading, baixa local e atualização do resumo.
- Executar os testes existentes e a verificação de tipos do projeto.
