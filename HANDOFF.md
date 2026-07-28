# Handoff — continuação de sessão (PousadaGest / Pousada da Baleia)

> Este arquivo existe só para dar contexto a uma nova conversa, porque a anterior
> estourou a janela de contexto. Pode apagar depois de colar/ler numa nova sessão.
> Cole o caminho deste arquivo (ou peça pra ler) assim que abrir o novo chat.

## O projeto

- App de gestão de pousada ("PousadaGest") + site público de reservas, para a
  **Pousada da Baleia** (Rio das Ostras).
- Repo local: `C:\Users\epthi\Documents\GitHub\Teste-pousada-`
- Stack: Vite + React + TypeScript + Tailwind. Firebase (Firestore + Auth +
  Hosting, projeto `bananabook`) para tudo, exceto fotos — fotos vão pro
  **Supabase Storage** (bucket `pousada-photos`, projeto
  `https://oraswxcvyyuimieaewio.supabase.co`), porque o Firebase Storage passou
  a exigir plano pago.
- Deploy: **Netlify** (site `pousadaapp`), mas a conta está sem crédito de
  build — os deploys automáticos estão sendo pulados. Solução enquanto isso:
  `npm run build` local + arrastar a pasta `dist` em "Deploy manually" no
  painel do Netlify.
- Dev server: `npm run dev` (porta 3000). Rode via `preview_start` do
  navegador embutido, não via Bash puro.

## GitHub — atenção com o push

- Repo: `https://github.com/epthiago1-eng/Teste-pousada-`
- Dono: `epthiago1-eng` (e-mail `ep.thiago1@gmail.com`, é o que está no
  `git config` local).
- **O Git CLI desta máquina está autenticado como `thiagostrikeai`, que NÃO
  tem permissão de push nesse repo.** Por isso todo `git push` daqui falha com
  403. O usuário sempre faz o push manualmente pelo **GitHub Desktop** (que
  está logado na conta certa). Não tente `gh auth login` de novo sem o usuário
  pedir.
- Ou seja: pode e deve fazer commits locais normalmente: só avise que o push
  precisa ser feito por ele no GitHub Desktop.

## Estado do git nesta sessão

Havia **~9 commits locais não enviados** ao final da sessão anterior (o
usuário ainda não confirmou se já deu push neles pelo Desktop — pergunte).
Nesta sessão (a que estourou o contexto), fiz uma leva grande de mudanças
**que ainda NÃO foram commitadas**. Rode `git status` e `git log --oneline -5`
assim que abrir a nova sessão pra confirmar o que já está salvo.

## O que foi implementado nesta última leva (NÃO commitado ainda)

Pedido do usuário: replicar comportamentos do calendário de reservas do site
QuartoVerde (referência visual) no formulário "Nova Reserva" do nosso app.

### 1. Modal de Novo Hóspede — `src/components/NewGuestModal.tsx` (novo arquivo)
Clicar no "+" ao lado da busca de hóspede (em `BookingModal.tsx`) abre um modal
com: Nome*, Telefone (🇧🇷 + formato BR via `formatPhoneBR`), E-mail,
Nacionalidade (dropdown, lista em `NATIONALITIES` no `lib/utils.ts`),
Identificação (CPF/RG/Passaporte/Outro, `DOCUMENT_TYPE_LABELS`) + Número,
botões Enviar/Cancelar. Ao enviar, cria o cliente e já seleciona ele na
reserva.

### 2. Seletor de datas em calendário — `src/components/DateRangePicker.tsx` (novo)
Substitui os dois `<input type=date>` por um campo que abre um popup com
2 meses. Clique numa data = check-in; clique na próxima = check-out (igual
QuartoVerde). Mostra contagem de noites.

**Efeito colateral implementado:** o campo "Quartos disponíveis" no
`BookingModal` agora fica **bloqueado com ícone de cadeado** ("Selecione as
datas primeiro") até check-in E check-out estarem preenchidos
(`datesReady` boolean).

### 3. Seletor de Ocupação — `src/components/OccupancyPicker.tsx` (novo)
Substitui os inputs numéricos de Adultos/Crianças por um campo único
("2 adultos · 1 criança") que abre popup com steppers (+/-). Se
crianças > 0, mostra um `<select>` de idade por criança (`CHILD_AGE_OPTIONS`
em `lib/utils.ts`: "< 1 ano" até "17 anos").

### 4. Gratuidade por idade + taxa de hóspede extra (mexe em dinheiro!)
**Isso não existia no modelo de dados — foi criado do zero nesta sessão.**
Perguntei ao usuário qual regra usar; ele escolheu "uma idade limite por
plano". Implementado:

- `types.ts` → `RatePlan` ganhou 3 campos novos:
  - `baseOccupancy?: number` (hóspedes incluídos no preço; padrão 2)
  - `extraGuestFee?: number` (R$ por noite, por hóspede além do base)
  - `childFreeUpToAge?: number` (crianças até essa idade não contam)
- `types.ts` → `Booking.childrenAges?: number[]` (idade de cada criança)
- `types.ts` → `Client.documentType?: 'cpf'|'rg'|'passport'|'other'`
- `lib/utils.ts` → funções novas: `countingGuests()`, `extraGuestSurcharge()`,
  constantes `CHILD_AGE_OPTIONS`, `NATIONALITIES`, `DOCUMENT_TYPE_LABELS`.
- `RatesPage.tsx` → nova seção "Ocupação e hóspede extra" no modal de editar
  plano tarifário, com os 3 campos acima.
- `BookingModal.tsx` → `stayTotal()` agora soma a sobretaxa de hóspede extra
  por noite; o `useEffect` de preço automático recalcula ao mudar
  adultos/idades das crianças.

**Testado ao vivo e funcionando**: configurei temporariamente o plano "Suite
Premium" com `baseOccupancy=2, extraGuestFee=50, childFreeUpToAge=5`. Criança
com idade "< 1 ano" → preço não muda. Mudei pra "8 anos" → total foi de
R$200 para R$250 **instantaneamente**. ⚠️ **Essa configuração de teste ainda
está salva no plano "Suite Premium" de verdade** — perguntei ao usuário se
queria manter ou reverter para R$0/sem gratuidade, e ele **dispensou a
pergunta sem responder**. Pergunte de novo antes de mexer em mais alguma
coisa relacionada a preço.

### 5. Status movido para o painel "Resumo da reserva"
Antes havia um campo "Status" separado no formulário principal E um selo
somente-leitura no painel lateral. Agora só existe UM controle: um
`<select>` de verdade estilizado como pill colorida (com chevron), dentro do
cabeçalho "Resumo da reserva" no painel lateral — igual à referência do
QuartoVerde. O campo "Canal" ficou sozinho no topo do formulário principal.

### 6. Tooltip de resumo ao passar o mouse — `CalendarPage.tsx`
Passar o mouse (com 300ms de delay) sobre uma barra de reserva no calendário
mostra um cartão com: código da reserva, hóspede (+ ícones de adultos/
crianças), estado (badge colorida), check-in/check-out por extenso, duração,
preço da reserva e total devido. Estado novo: `bookingHover` +
`bookingHoverTimer` (um `useRef` de timeout).

## Limpeza já feita (não precisa repetir)

- Criei um cliente de teste "Maria Teste Vault" pra testar o modal — **já
  deletei** via tela de Clientes.
- **Não cheguei a clicar em "Criar reserva"** durante os testes — nenhuma
  reserva de teste foi gravada.
- Rodei `npx tsc --noEmit` depois de cada bloco de mudança — tudo passando,
  sem erros de tipo.

## Pendências / próximos passos ao retomar

~~1. Perguntar de novo sobre a config de teste do plano "Suite Premium".~~
   **Resolvido**: o usuário respondeu "manter" — a config (R$50/hóspede
   extra acima de 2, gratuidade até 5 anos) fica valendo de verdade.
~~2. Commitar toda essa leva.~~ **Feito** — 3 commits:
   `d635feb` (modelo de dados + utils + RatesPage),
   `6bc51d1` (NewGuestModal/DateRangePicker/OccupancyPicker + BookingModal),
   `61fe179` (tooltip de hover no calendário).
3. Lembrar o usuário que o **push** continua sendo feito por ele no GitHub
   Desktop (não temos permissão via CLI). Ainda não sei se ele já deu push
   nesses 3 + os anteriores — pergunte / rode `git status -sb` pra ver
   quantos commits o `main` local está à frente do `origin/main`.

## Outras mudanças relevantes de sessões anteriores (já commitadas, contexto)

- Modal "Nova Reserva" redesenhado no estilo QuartoVerde (layout 2 colunas +
  painel resumo).
- Calendário: bloqueio/desbloqueio rápido por popup, redimensionar reserva
  arrastando a borda, faixa verde de confirmação, destaque de coluna no hover
  (alinhado à diária, não ao dia civil), linhas divisórias mais evidentes nas
  linhas de quarto, legenda redesenhada como botão flutuante + cartão (estilo
  QuartoVerde).
- Hero cinematográfico da página pública (`/p/:slug`): vídeo novo do usuário
  convertido em sequência de frames AVIF/WebP com qualidade adaptativa
  (mede a banda do visitante), textos sincronizados com os cortes do vídeo.
- Página pública (`/p/:slug`) reconstruída como fluxo de reserva guiado
  (abas Início/Quartos/Pousada/Local + fluxo de reserva em etapas), em
  `PublicSitePage.tsx` + `BookingSheet.tsx` + `publicPricing.ts`. Mantém o
  contrato de gravação em `bookingRequests` que a tela de Solicitações já lê.

## Como retomar rápido

```bash
cd "C:\Users\epthi\Documents\GitHub\Teste-pousada-"
git status
git log --oneline -15
npx tsc --noEmit
```

Depois abra o navegador embutido (`preview_start` com `name` apontando pro
`.claude/launch.json`, que já tem a config `pousada-dev` na porta 3000) e
logue manualmente quando pedido (não digito senha por política).
