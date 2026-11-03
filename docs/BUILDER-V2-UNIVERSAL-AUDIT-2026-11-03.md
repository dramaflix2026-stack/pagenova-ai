# Auditoria e desenvolvimento do editor universal — 03/11/2026

Branch: `audit/universal-edit-service-description-20261103`.
Base auditada: `9a4984e3ac45ea940075333cde40855c27469a40`.
Production e main não foram modificadas. Nenhuma migração ou alteração de infraestrutura foi executada.

## Resultado e limites

O contrato de blocos ganhou comandos em português por nomes de seções, processamento atômico de pedidos combinados, validação de JSON em runtime e prioridade sobre atalhos locais. O renderizador compartilhado passou a respeitar mais propriedades editadas. Isso **não conclui** a compatibilidade visual universal: vários renderizadores especializados ainda têm conteúdo e estrutura fixos.

## Estado inicial

- Os 39 testes universais existentes passaram antes das alterações.
- A branch estava exatamente no commit informado.
- Os quatro previews mais recentes estavam READY. Os dois anteriores, `5a9b926b` e `67aeaaf2`, estavam ERROR; não foram tratados como falhas atuais depois de correções já presentes.
- O serviço universal já oferecia update/add/remove/move de blocos e remoção/movimentação de seções. O adaptador de linguagem cobria sobretudo IDs e textos exatos.
- O endpoint já despachava operações universais antes de handlers legados, mas atalhos anteriores no editor podiam consumir somente parte de um pedido.
- O publicador preserva o snapshot JSON; editor, endpoint e renderizador público já aceitavam um bloco, mas o botão visual de publicação ainda exigia quatro.
- Especializados como TP3 Modelo 02 têm várias seções/textos fixos, independentemente da ordem/presença dos blocos. Não foram reconstruídos.

## Bloco 1 — commit 7448b99c

- Resolução conservadora de capa, serviços, sobre, galeria, depoimentos, FAQ, contato e rodapé por IDs/títulos existentes e aliases. Recusa alvos ambíguos.
- Título, descrição e imagem por seção; cor, fonte, tamanho desktop/mobile e alinhamento de título/descrição; cor dos botões.
- Remoção de galeria/depoimentos/FAQ por nome; movimento antes/depois de seções.
- Nova galeria a partir de URLs fornecidas. Sem imagens fornecidas, recusa o lote inteiro.
- Separação de comandos fora de textos entre aspas; aplicação sequencial em cópias imutáveis. Falha em qualquer cláusula descarta o resultado inteiro.
- Dispatcher universal antes dos atalhos do editor. Pedidos combinados com anexos são recusados explicitamente, preservando anexos e projeto, até existir processamento transacional de uploads.
- Validação em runtime de objetos, tipos, propriedades, limites numéricos, URLs e novos blocos; validação compartilhada entre inserção e atualização.
- Novos blocos recebem texto, cor e alinhamento compatíveis com o publicador. Mudanças de cor recebem `colorExplicit`.
- Publicação habilitada na interface para projetos editados válidos com um ou mais blocos.

## Bloco 2 — renderização, dados factuais e validação

- Renderizador clássico: cores explícitas de títulos precedem os padrões institucionais; CTAs preservam caminhos relativos com query/hash.
- Fontes de parágrafos e botões, tamanhos de botão e tamanhos mobile passam ao HTML/CSS compartilhado.
- Testes executam o React real para comparar modos de prévia e público, ordem, remoção e propriedades editadas.
- A geração deixou de solicitar nomes/cidades/relatos fictícios. Depois dos reparos de cardinalidade, relatos gerados que não constam no briefing são descartados. A seção e seu layout continuam disponíveis.
- Testes do renderizador foram incluídos no comando de build.

## Arquivos alterados

- `frontend/src/lib/builder-v2-universal-operations.ts`
- `frontend/src/lib/builder-v2-universal-language.ts`
- `frontend/src/lib/builder-v2-universal-targets.ts` (novo)
- `frontend/src/app/api/builder-v2/chat/route.ts`
- `frontend/src/app/app/builder-v2/page.tsx`
- `frontend/src/components/builder-v2-site.tsx`
- `frontend/scripts/test-builder-v2-universal-operations.mjs`
- `frontend/scripts/test-builder-v2-reference-generation.mjs`
- `frontend/scripts/test-builder-v2-universal-renderer.mjs` (novo)
- `frontend/scripts/builder-v2-renderer-harness.mjs` (novo)
- `frontend/scripts/qa-builder-v2-universal-browser.mjs` (novo)
- `frontend/package.json`
- Este relatório.

## Evidências de teste

| Verificação | Resultado | Limite da evidência |
| --- | --- | --- |
| `node --experimental-strip-types --test scripts/test-builder-v2-*.mjs` em frontend | 185 aprovados, zero falhas/skips | Inclui testes de código e execução real; não equivale a 185 testes visuais |
| Criação seguida de edição pelo endpoint | Aprovada para os três IDs de template estático | Autenticação, cobrança e modelo externo simulados; handler real executado |
| Pedido combinado completo | Imagem, título, botões, remoção de depoimentos, galeria e FAQ aplicados | Fixture de dados; sem provar todos os especializados |
| Recusa atômica | Ambiguidade, URL inválida e galeria sem URLs preservam o original | Operações suportadas pelo adaptador conservador |
| React SSR | Aprovado em prévia e modo público para os dois templates clássicos | HTML real; não envolve Supabase |
| Chromium com CSS compilado da aplicação | 12 cenários aprovados: 2 templates × 2 modos × larguras 1440/768/390 | Conteúdo renderizado localmente; rede externa bloqueada, sem hidratação do editor |
| Browser: cores, tipografia, links e overflow | Valores computados corretos; zero overflow horizontal | Fixture pequena; não valida todas as seções/efeitos |
| TypeScript | Aprovado depois da geração de utilitários e tipos Next | Dependências locais reutilizadas |
| Build Next com webpack | Compilação, tipos e geração de páginas aprovados | Executado antes do último filtro de depoimentos; o filtro passou na regressão posterior |
| Build padrão local | Gates passaram; Turbopack recusou node_modules por symlink externo | Restrição do ambiente local; configuração do projeto mantida |
| Snapshot | Round-trip JSON preserva conteúdo e identidade; testes existentes de publicação passaram | Sem gravação real no bucket e sem F5 autenticado |

O build também executou as verificações existentes de publicação/forms/quiz/CRM em memória; dados reais não foram alterados. Artefatos gerados do CRM não integram o patch.

Para reproduzir o navegador: `node --experimental-strip-types scripts/qa-builder-v2-universal-browser.mjs` em frontend. O script compila o CSS e grava evidências em `/tmp/pagenova-browser-qa` por padrão; `PAGENOVA_QA_OUTPUT` altera o destino.

## Deploys

- Base `9a4984e`: `pagenova-qibxkggcs-giovane-s-projects4.vercel.app`, READY.
- Bloco 1 `7448b99c`: `pagenova-hh90qskwi-giovane-s-projects4.vercel.app`, READY, target Preview.
- A consulta HTTP ao Builder do preview da base respondeu 200 na tela de login (`x-matched-path: /login`). Isso não foi contado como validação funcional do Builder.
- O segundo bloco deve ser conferido pelo SHA do commit e estado de seu próprio Preview. READY sozinho não prova funcionamento visual.

## Pendências reais, por prioridade

1. Integrar o contrato editável aos renderizadores especializados TP1–TP10/modelos e 3D. Conteúdo fixo pode ignorar texto, estilo, exclusão ou reordenação de blocos. Criar testes de execução por modelo antes de migrar, preservando composição/tilt/animações.
2. Auditar a origem dos depoimentos e demais dados factuais também nos caminhos legados de edição e componentes especializados. O novo filtro cobre a geração principal, não todos os caminhos do produto.
3. Testar autenticado o fluxo editor → F5 → prévia → snapshot real → URL pública em Preview, incluindo desktop/mobile e isolamento do usuário. A sessão usada pela consulta HTTP não estava autenticada.
4. Unificar uploads, referências, vídeos cinematográficos, metadados de cabeçalho/rodapé/WhatsApp e coleções em operações transacionais. Hoje esses recursos têm handlers próprios; pedidos combinados com anexos são recusados com segurança.
5. Ampliar linguagem natural e conteúdo estruturado para cards/FAQ/galerias sem depender só de IDs ou texto exato. Comandos não reconhecidos continuam no caminho legado quando isolados; em lotes, a recusa é total.
6. Executar geração com o provedor real e testar briefing completo para cada família/modelo; os testes de geração deste bloco simulam o modelo externo.
7. Somente após validação integrada, preparar revisão para main/Production. Não há autorização de merge ou promoção neste trabalho.
