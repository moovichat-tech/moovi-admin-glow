# Cadastro e controle de acesso de afiliados

## Objetivo

Transformar **Gestão de Afiliados** no ponto único para cadastrar o afiliado e conceder, visualizar, adicionar ou retirar acesso ao Moovi, mantendo as tabelas `afiliados` e `usuarios` sincronizadas pela API do n8n.

## Alterações no backoffice

- Tornar **e-mail** e **WhatsApp** obrigatórios no cadastro e na edição.
- Alterar a cortesia inicial padrão de 30 para **15 dias** e enviar o plano **PREMIUM**.
- Exibir na tabela o e-mail e a situação do acesso, incluindo dias restantes e data de vencimento.
- Criar uma ação específica de **Gerenciar acesso** em cada afiliado.
- Nesse painel, permitir:
  - adicionar dias ao vencimento atual;
  - retirar dias do vencimento atual;
  - informar qualquer quantidade inteira válida;
  - visualizar antes de salvar a nova data e os novos dias restantes.
- Impedir que a retirada produza uma data inválida; zero dias restantes deixa o acesso expirado/inativo.
- Aplicar validações de nome, e-mail, telefone, comissão, PIX e dias antes de chamar a API.
- Manter estados de carregamento, mensagens de sucesso/erro e atualização imediata da tabela.

## Integração esperada com o n8n

### Cadastro: `POST /webhook/cadastrar-afiliado`

O backoffice enviará:

```json
{
  "nome": "Afiliado X",
  "email": "afiliado@exemplo.com",
  "rede_social": "@afiliado",
  "whatsapp": "5562999999999",
  "telefone": "5562999999999",
  "comissao": 20,
  "pix": "...",
  "dias_acesso": 15,
  "plano": "PREMIUM"
}
```

O fluxo do n8n deverá executar uma transação no PostgreSQL externo:

- Validar e normalizar e-mail/telefone.
- Inserir o registro em `afiliados`, incluindo `email` e `vencimento_acesso = NOW() + 15 dias`.
- Inserir ou atualizar `usuarios` pelo telefone normalizado, preenchendo `nome`, `email`, `telefone`, `plano = 'PREMIUM'`, `status = 'Ativo'`, `data_renovacao = vencimento_acesso` e `gateway_pagamento = 'cortesia_afiliado'`.
- Retornar status 200/201 somente se as duas gravações forem concluídas; em erro, desfazer ambas.
- Nunca receber ou armazenar senha em texto puro. O primeiro acesso deve usar o fluxo seguro de criação/recuperação de senha já adotado pelo Moovi.

### Listagem: `GET /webhook/listar-afiliados`

Além dos campos atuais, deverá retornar `email` e `vencimento_acesso`.

### Edição: `POST /webhook/editar-afiliado`

Deverá aceitar `email` e manter nome, e-mail e telefone sincronizados em `afiliados` e `usuarios`.

### Ajuste de acesso: `POST /webhook/ajustar-acesso-afiliado`

O backoffice enviará uma operação explícita e auditável:

```json
{
  "id": "uuid-do-afiliado",
  "operacao": "adicionar",
  "dias": 15
}
```

`operacao` aceitará `adicionar` ou `retirar`. O n8n deverá calcular a nova data no servidor, atualizar `afiliados.vencimento_acesso` e `usuarios.data_renovacao`, e definir `usuarios.status` como `Ativo` quando a data for futura ou `Inativo` quando expirar. A resposta deverá incluir a nova data.

## Banco externo

- Adicionar `email` à tabela `afiliados`, se a coluna ainda não existir.
- Garantir índice único normalizado para e-mail e/ou telefone conforme a regra de conta do Moovi.
- Fazer a associação entre as tabelas por um identificador estável; até existir `afiliado_id` em `usuarios`, usar telefone normalizado sem duplicidades.
- A coluna `data_renovacao` mostrada nas imagens será a data sincronizada do acesso de cortesia.

## Validação

- Verificar cadastro com 15 dias e atualização imediata da tabela.
- Verificar que o mesmo cadastro aparece em `afiliados` e `usuarios`.
- Testar adição e retirada de dias, inclusive expiração.
- Testar edição de e-mail/telefone sem criar usuário duplicado.
- Confirmar mensagens de erro quando o n8n ainda não tiver recebido as mudanças descritas acima.