# Avisos de terceiros

Este produto usa software e ativos de terceiros. Abaixo estão os avisos e as
licenças correspondentes.

Documento vivo: **nunca remova um aviso daqui**. Dependência que sai do
projeto continua registrada, com a data da remoção, porque versões já
publicadas seguem existindo.

Última verificação: **2026-09-20**, a partir do `package.json` e das licenças
declaradas em `node_modules`.

---

## 1. O que vai dentro do site do cliente

O site gerado é HTML, CSS e JavaScript escritos neste projeto. Ele **não
embute** nenhuma biblioteca de terceiros: sem React, sem jQuery, sem GSAP, sem
framework de CSS. A única dependência externa em tempo de execução é a
tipografia.

### Tipografia — Google Fonts (SIL Open Font License 1.1)

As famílias abaixo são carregadas de `fonts.googleapis.com` pelo site
publicado:

Inter · Manrope · Sora · Space Grotesk · DM Sans · Work Sans · Fraunces ·
Playfair Display · Lora · DM Serif Display

Todas sob **OFL-1.1**, que permite uso comercial, incorporação e
redistribuição, desde que os arquivos de fonte não sejam vendidos
isoladamente e que a licença acompanhe qualquer redistribuição dos arquivos.

> Hoje não redistribuímos arquivo de fonte nenhum: o site aponta para o Google.
> Se um dia as fontes forem hospedadas no nosso servidor, o texto da OFL de
> cada família precisa ser incluído junto.

Texto da licença: https://openfontlicense.org

### Ícones

Os ícones são SVG inline gerados por `src/site-kit/primitives/render-utils.ts`.
**A origem de alguns traçados está em verificação** — ver a pendência em
`docs/licenses/component-inventory.md`. Se confirmada a origem no projeto
Lucide, aplica-se o aviso da seção 2.

---

## 2. O que roda no CRM e no servidor

Estes pacotes fazem parte da aplicação, mas nunca são entregues dentro do site
do cliente.

### MIT

80 pacotes diretos, entre eles: React, React DOM, React Router, TanStack Query,
Radix UI (todos os componentes), Tailwind CSS, Express, Helmet, Zod, Drizzle
Kit, Vite, Vitest, ESLint, Prettier, FullCalendar, dnd-kit, react-hook-form,
mysql2, pino, multer, tsx e o SDK da Anthropic.

A licença MIT exige manter o aviso de copyright e a permissão. Os textos
completos, com os respectivos detentores de direitos, estão em
`node_modules/<pacote>/LICENSE` e são reproduzíveis a partir do
`package-lock.json`.

### Apache-2.0

`typescript`, `drizzle-orm`, `sharp`, `class-variance-authority`,
`@playwright/test`.

Exige preservar avisos de copyright, patente e atribuição, e indicar
modificações — não fazemos modificações em nenhum deles.

### ISC

`lucide-react` — ícones usados nas telas do CRM.
`zod-to-json-schema` — conversão de schema para o formato que a API da
Anthropic aceita.

Copyright dos respectivos autores. A ISC permite uso, cópia e distribuição
mantendo o aviso de copyright.

### BSD-2-Clause

`dotenv`.

### MPL-2.0

`axe-core` — usado **apenas em teste** de acessibilidade (`tests/e2e/`), nunca
no produto. A MPL exige que modificações nos arquivos originais sejam
publicadas sob a mesma licença; não modificamos nenhum arquivo do pacote.

### Licença dupla: MIT ou GPL-3.0-or-later

`jszip` — monta o ZIP de exportação do site. **Optamos pela licença MIT**, o
que é permitido pela própria oferta dupla do projeto. Nenhum código do jszip é
entregue ao cliente: ele roda no servidor, e só o ZIP resultante é entregue.

---

## 3. Serviços externos

Não são software embutido, mas fazem parte do funcionamento:

- **Anthropic** — geração do conteúdo e da direção visual dos sites.
- **Google Places API (New)** — pesquisa de empresas no CRM. A atribuição
  exigida pelo Google é exibida na tela de pesquisa e nos cards de resultado.
- **Google Fonts** — entrega das fontes (seção 1).

---

## 4. Como atualizar este arquivo

Ao adicionar uma dependência ou um ativo:

1. confirme a licença (campo `license` do `package.json` do pacote, ou o
   arquivo `LICENSE` do projeto de origem);
2. acrescente aqui, na seção da licença correspondente;
3. se o item entra no site do cliente, registre também em
   `docs/licenses/component-inventory.md`;
4. se a licença exigir atribuição visível, diga onde o aviso aparece.

Ao remover uma dependência, mova a linha para uma nota "removido em AAAA-MM-DD"
em vez de apagar.
