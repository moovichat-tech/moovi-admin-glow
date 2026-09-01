# Moovi Backoffice

Preciso iniciar a construção do frontend do Backoffice administrativo do meu SaaS, chamado Moovi. Vamos focar no Pilar 1: Login e Layout Base.

1. Identidade Visual: O sistema deve ser construído inteiramente em Dark Mode (fundo escuro elegante) com detalhes, botões e acentos na cor verde Moovi (semelhante ao #10b981).

2. Tela de Login (/login): Crie uma tela de login minimalista contendo:

Logo ou título 'Moovi Backoffice'.

Campos de E-mail e Senha.

Botão 'Entrar' (com estado de loading ao clicar).

Lógica de Segurança: Integre este formulário diretamente com o Supabase Auth. Não use senhas fixas no código.

3. Layout Autenticado e Rotas Protegidas:

Crie um componente de Layout que englobe as páginas internas.

Implemente uma lógica de Rota Protegida (Protected Route): se o usuário tentar acessar qualquer página interna sem estar logado no Supabase Auth, ele deve ser redirecionado para /login.

4. Navegação (Sidebar): No layout protegido, crie um Menu Lateral (Sidebar) fixo com os seguintes itens de navegação (adicione ícones do Lucide React para cada um):

📊 Visão Geral (rota /)

💬 Feedbacks de Cancelamento (rota /feedbacks)

🌟 Influenciadores (rota /influencers)

🚪 Sair / Logout (no rodapé da sidebar, que desloga do Supabase e manda para /login).

5. Páginas Temporárias: Crie as páginas em branco para as rotas /, /feedbacks e /influencers apenas com um título h1 no meio, para que eu possa navegar pelo menu e testar o roteamento.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb8743c6-9608-4895-9fe3-0bdd620df114).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
