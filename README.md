# 🏨 PousadaGest 2.0

Sistema completo de gestão para pousadas e pequenos hotéis — multi-tenant (várias pousadas no mesmo sistema), com funcionamento offline, sincronização automática e login com papéis de acesso.

## O que tem no app

| Módulo | Descrição |
|---|---|
| **Dashboard** | Ocupação do dia, chegadas, saídas, hóspedes na casa, receita do mês |
| **Calendário** | Mapa de ocupação por quarto (14/30 dias) — clique numa célula vazia para criar reserva |
| **Reservas** | Pré-reserva, confirmação, check-in, check-out, cancelamento, no-show, bloqueio de quarto, pagamentos parciais e consumo |
| **Quartos** | Quartos + categorias com preço base e status de limpeza |
| **Clientes** | Cadastro completo com histórico de estadias |
| **Financeiro** | Receitas e despesas por mês (check-out lança a hospedagem automaticamente) |
| **Governança** | Painel de limpeza (sujo → em limpeza → limpo → inspecionado) |
| **Produtos** | Frigobar/serviços com controle de estoque e alerta de mínimo |
| **Tarifas** | Planos de preço por categoria, preço de fim de semana, estadia mínima |
| **Equipe** | Funcionários e registro de pagamento de salário |
| **Páginas públicas** | Reserva online (`/p/slug`), portal do hóspede (`/p/slug/portal`) e FNRH digital (`/p/slug/fnrh`) |

## Papéis de usuário

| Papel | Acesso |
|---|---|
| **Administrador** | Tudo + gestão de usuários e convites |
| **Gerente** | Tudo, exceto criar convites |
| **Recepção** | Reservas, calendário, clientes, quartos, produtos, governança, solicitações |
| **Governança** | Somente o painel de limpeza |

O acesso é garantido em **duas camadas**: na interface (rotas protegidas) e no servidor (regras do Firestore) — mesmo que alguém burle o app, o banco recusa a operação.

## Offline + sincronização

O Firestore roda com **cache local persistente (IndexedDB)**: o app abre e funciona sem internet (é um PWA instalável no celular e no PC), as alterações ficam salvas no aparelho e sincronizam sozinhas quando a conexão volta — inclusive entre várias abas. O indicador no topo mostra **Online / Sincronizando / Offline**.

## Como colocar no ar

### 1. Criar o projeto Firebase (grátis)

1. Acesse [console.firebase.google.com](https://console.firebase.google.com) → **Adicionar projeto**.
2. **Authentication** → Começar → ative **E-mail/senha**.
3. **Firestore Database** → Criar banco → modo **produção** → região `southamerica-east1` (São Paulo).
4. Engrenagem → **Configurações do projeto** → *Seus aplicativos* → ícone **Web** (`</>`) → registre o app e copie as chaves.

### 2. Configurar o código

```bash
cd pousadagest-v2
npm install
copy .env.example .env.local   # (Windows) e preencha com as chaves do passo anterior
```

### 3. Publicar as regras de segurança (ESSENCIAL)

No console do Firebase → **Firestore → Regras**, cole o conteúdo do arquivo `firestore.rules` e publique.
Ou pela CLI: `npm i -g firebase-tools && firebase login && firebase deploy --only firestore:rules`.

> ⚠️ Sem as regras publicadas, o banco fica fechado (ou aberto demais). Este arquivo é o que garante que cada pousada só enxerga os próprios dados e que cada papel só faz o que pode.

### 4. Rodar localmente

```bash
npm run dev   # http://localhost:3000
```

### 5. Publicar online

Qualquer host de site estático funciona. Exemplo com Firebase Hosting:

```bash
npm run build
firebase init hosting   # pasta pública: dist | SPA: sim
firebase deploy
```

(Vercel e Netlify também funcionam: basta apontar para o repositório e configurar as variáveis `VITE_FIREBASE_*`.)

## Segurança — o que já está implementado

- **Autenticação obrigatória** (Firebase Auth) com redefinição de senha por e-mail.
- **Isolamento multi-tenant**: as regras do Firestore validam `tenantId` do usuário em cada leitura/escrita.
- **Controle por papel no servidor** (não só na tela): governança só altera status de limpeza; financeiro/equipe restritos a admin/gerente.
- **Convites com código de uso único** para entrar na equipe (admin gera em Configurações → Usuários).
- **Páginas públicas sem vazamento de dados**: a página de reservas lê apenas um documento público com faixas ocupadas (sem nomes ou contatos); pedidos de reserva e FNRH são *create-only* com validação de campos e limite de tamanho.
- **Sem segredos no código**: as chaves ficam em `.env.local` (fora do git). A `apiKey` do Firebase Web não é secreta — a proteção real são as regras + Auth.

### Recomendações para produção (antes de vender)

- Ative **App Check** (reCAPTCHA v3) no console para bloquear bots nas páginas públicas.
- Configure **backups automáticos** do Firestore (console → Backup e recuperação).
- Revise os **domínios autorizados** em Authentication → Settings.
- Considere Cloud Functions para: e-mail de confirmação de reserva, limpeza de solicitações antigas e exclusão de contas.

## Vendendo para outras pousadas (multi-tenant)

Cada cliente cria a própria conta em **"Criar uma nova pousada"** — os dados ficam totalmente isolados no mesmo sistema. Você não precisa reinstalar nada por cliente: um único deploy atende todos. Para cobrar assinatura, o caminho natural é integrar Stripe/Mercado Pago + um campo `plan`/`active` no tenant validado nas regras.

## Tecnologia

React 19 + TypeScript + Vite · Tailwind CSS 4 · Firebase Auth + Firestore (cache offline) · PWA (vite-plugin-pwa) · lucide-react · date-fns · sonner
