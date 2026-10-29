# Builder 2.0 — auditoria inicial e primeira correção

Data: 29/10/2026. Base examinada: `main`, commit `24bb373cd667f894a71388d868843c34351ba0a3`.

## Resultado e limites

O fluxo de geração inicial descartava a imagem de referência: a interface a enviava, mas o ramo `isFresh` retornava antes do trecho que construía a mensagem multimodal. A primeira correção encaminha a imagem à geração de identidade e aos lotes de seções, mantendo o fluxo de fotos de conteúdo existente. Também corrige escapes duplicados nas duas expressões que extraem quantidades numéricas de serviços e remove instruções internas contraditórias para essa quantidade.

Esta entrega cobre a auditoria inicial do caminho principal e duas correções delimitadas. As sete fases do briefing não estão concluídas. O envio correto da imagem à IA não comprova fidelidade visual: a renderização ainda tem limitações documentadas abaixo.

Os testes novos executam o handler real com autenticação, faturamento e provedor de IA simulados. Não consomem créditos ou APIs pagas. Após autenticação pelo formulário seguro, foi executada geração nova do cenário A na versão em produção, seguida de adição de card, F5 e publicação. O resultado real está registrado abaixo. A publicação de QA foi criada como parte dos testes autorizados, sem vincular um domínio customizado. Isso testa a baseline publicada, não o código ainda isolado neste PR.

## Arquitetura encontrada

| Etapa | Implementação observada | Serviços envolvidos |
| --- | --- | --- |
| Interface e rascunho | `frontend/src/app/app/builder-v2/page.tsx`; blocos editáveis e estado do site | Next.js/React, localStorage |
| Geração inicial | `frontend/src/app/api/builder-v2/chat/route.ts`, ramo `isFresh`; plano, seções extras, lotes e reparos | Next.js; OpenAI `gpt-4.1-mini` |
| Edições | Handlers locais na interface, helpers de edição e handlers na mesma rota; fallback com operações da IA | Navegador, Next.js, OpenAI quando necessário |
| Autorização e créditos | `builder-v2-generation-credits.ts`, helpers de acesso, trial, créditos e orçamento | Supabase; carteira compartilhada com CRM |
| Fotos de conteúdo | `generateVisuals`, `niche-photo-catalog.json`, rotas `assets` e `image` | Catálogo existente, Supabase Storage; geração de imagem quando aplicável |
| Referência visual | Anexo convertido em data URL e enviado como `image` ao chat | Navegador → Next.js → OpenAI |
| Histórico | Rascunho e versões locais; `/api/builder-v2/versions` | localStorage e tabela `pagenova_builder_versions` |
| Prévia institucional | `builder-v2-preview-frame.tsx` e `builder-v2-site.tsx` | Iframe, React, motor de animações existente |
| Publicação | `/api/builder-v2/publish`; snapshot JSON integral do site | Bucket privado `pagenova-published-sites`; índice de publicações e domínios no Supabase |
| Página publicada | `/p/[slug]/[[...path]]` encaminha snapshots V2; `/site/[slug]` renderiza | Next.js, Supabase Storage, renderizadores existentes |
| Importação do CRM | `builder-v2-crm-import.ts`, `builder-v2-crm-transport.ts` e rotas do CRM | Integração distinta da criação direta no Studio |

Não foi encontrada dependência direta de Railway/MySQL na chamada que gera os blocos do Builder V2. O repositório tem outros backends e o CRM tem seu próprio pipeline. Isso não autoriza remover essas integrações nem concluir que Railway/MySQL são dispensáveis para a plataforma inteira.

## Modalidades e templates protegidos

| Opção | Identificador/implementação |
| --- | --- |
| Institucional | Modo `static`, `BuilderV2Site`/`BuilderV2ClassicSite` |
| Cinematográfico | Modo `cinematic`, `builder-v2-cinematic-background.tsx`, vídeos e estilos existentes |
| 3D | Modo `immersive-3d`, `builder-v2-immersive-3d.tsx` |
| Template 1 | `institutional-complete` |
| Template 2 | `minimalist-sophisticated` |
| Template 3 | `modern-impactful` |
| Template 4 | `image-text-alternating` |
| Template 5 | `prompt-adaptive` |

Restaurantes e imobiliária também possuem renderizadores especializados. A equivalência entre prévia e publicação precisa ser validada por categoria, e não apenas pelo componente institucional.

A baseline documentada em `TEMPLATE_UNIVERSAL_V1_FROZEN.md` continua protegida. Não foram alterados renderizadores, CSS dos templates, catálogo, URLs de imagens, vídeos, componentes 3D, motor de animações, projetos de clientes ou esquema de banco nesta correção.

## Achados priorizados

| ID | Evidência no código | Consequência | Encaminhamento |
| --- | --- | --- | --- |
| A01 | Ramo de criação não construía mensagem multimodal | Referência anexada não chegava à IA na geração nova | Corrigido nesta entrega; testar fidelidade visual ao vivo |
| A02 | Regex de serviços usava `\\s`, `\\d` etc. dentro de literal de regex | Quantidade numérica podia cair no padrão de quatro | Corrigido e testado com 5, 6 e 8 serviços |
| A03 | Diferenciais têm meta fixa de quatro e reparo fixo de quatro antes da validação adaptativa | Briefings com outra quantidade podem ser contrariados | Fase 2: contrato de cardinalidade por seção compartilhado pelos cinco templates |
| A04 | Extração mais abrangente de contagens fica dentro de `if(adaptiveBrief)` | Templates 1–4 não têm a mesma garantia de quantidades | Fase 2: consolidar extração e validação; incluir números por extenso e limites explícitos |
| A05 | Briefing longo pode selecionar `prompt-adaptive` quando o template atual é T1; não há distinção de T1 explicitamente escolhido nesse teste | Escolha do cliente pode ser substituída | Fase 2: registrar seleção explícita e preservar o template escolhido |
| A06 | No renderer, T5 define fundos escuros por índice da seção e vários textos claros | Paleta clara pedida pode não aparecer, mesmo com JSON correto | Fase 4: separar defaults visuais de propriedades explícitas do site |
| A07 | T2 contém regras `!important` para cor e centralização; há regras compartilhadas que forçam títulos ao centro | Edição pode alterar os dados sem mudar o resultado visível | Fase 4: precedência de tokens/defaults e propriedades explícitas, sem nova pilha de overrides |
| A08 | `layout` final dos blocos é substituído pelo layout do plano de seções; os renderizadores têm composições próprias | Enxergar a referência ainda não permite reproduzir toda composição | Fase 3: contrato de direção visual nos recursos já suportados; implementar apenas lacunas comprovadas |
| A09 | Formulário institucional abre `mailto:`; sem destinatário o botão fica desabilitado | Aparência de formulário não equivale a recebimento de lead no servidor | Fase 5: validar produto esperado e reutilizar infraestrutura de formulários existente quando cabível |
| A10 | Suplementos/fallbacks usam textos genéricos e cores fixas; fallback adaptativo pode usar o goal como descrição | Meta numérica pode ser atingida com conteúdo ruim ou instrução pública | Fase 2: reparos sem instruções técnicas no conteúdo; critérios de qualidade verificáveis |
| A11 | Publicação usa o template do snapshot e o componente institucional compartilhado; categorias têm branches próprios | Não há evidência para declarar resolvida toda divergência prévia/publicação | Fase 6: comparar snapshot e resultado real por template/categoria/modo |
| A12 | Rascunho local e histórico remoto são mecanismos diferentes; versões remotas usam `builder-v2-default` | Reabertura entre dispositivos/projetos exige verificação adicional | Fase 5/6: testar isolamento e restauração, incluindo políticas do banco; não presumir falha ou segurança apenas por leitura da rota |

O commit-base já refatorou a pilha CSS do Template 2. Seu resultado não foi descartado nem recriado. O ponto pendente é compatibilizar a precedência do chat e medir o resultado visual com referências aprovadas.

## Validação desta correção

- Regressão reproduzida: o teste de referência falha com o fluxo anterior por receber uma string onde deveria existir conteúdo multimodal.
- Quatro testes novos: imagem na identidade e nos cinco lotes; geração sem imagem; restrições existentes de tipo/tamanho da referência; quantidades numéricas de serviços no handler real.
- Suíte final do Builder V2 e animações: 132 testes passaram, incluindo os quatro testes novos.
- `npm run build` executou os gates existentes, compilou Next.js e concluiu a verificação TypeScript e a geração de páginas com sucesso.
- O novo teste foi incluído no comando de build e no workflow de qualidade.

As imagens dos testes são fixtures de payload. Não demonstram a qualidade de uma análise visual real. Os testes existentes misturam verificações comportamentais e inspeções de código; não substituem inspeção desktop/mobile.

Referências válidas passam agora a consumir tokens de visão nas chamadas de identidade e de cada lote. Não há chamada adicional de IA. A fase 3 deve avaliar extrair uma direção visual uma vez e reutilizá-la, preservando fidelidade e reduzindo custo/latência.

## Teste real da baseline publicada — cenário A

Projeto sintético: **Clínica Horizonte QA**, nicho Psicologia. O briefing pediu preservar T1, usar verde-escuro/bege/branco sem azul, centralizar títulos, gerar 4 serviços/4 diferenciais/4 etapas, sobre com imagem, galeria, relatos ilustrativos, FAQ com 4 perguntas, formulário e CTA `#servicos`.

| Verificação | Resultado observado no DOM renderizado |
| --- | --- |
| Template selecionado | **Reprovado:** T1 antes da geração, T5 após gerar, apesar do pedido de preservação |
| Paleta | **Reprovado:** seções predominantemente `rgb(24,24,24)`, `rgb(13,14,17)` e `rgb(17,21,27)`; títulos brancos |
| Serviços | 4 cards na geração inicial |
| Diferenciais | 4 cards |
| Etapas | 4 cards com imagens |
| Títulos das seções | Centralizados nas nove seções medidas |
| FAQ | **Reprovado:** 12 elementos `details` renderizados, para 4 perguntas solicitadas |
| Fotos | Aplicação reportada do catálogo Psicologia; elementos de imagem presentes no DOM. Carregamento/enquadramento precisam de inspeção visual adicional |
| Formulário | Presente como demonstração; botão desabilitado sem e-mail de destino, conforme implementação encontrada |
| Adição de card pelo chat | Quinto serviço “Orientação de Carreira” apareceu; os quatro anteriores continuaram e o FAQ continuou com 12 perguntas |
| Persistência após F5 | Os cinco serviços permaneceram; o FAQ permaneceu com 12 perguntas |
| Botão interno | `href=#servicos` presente; clique manteve o iframe em `about:srcdoc`. Alinhamento final da rolagem ainda não aprovado |
| Mobile | Alternância para a prévia mobile executada; conteúdo inspecionado no DOM. Sem aprovação visual completa |
| Publicação | Publicado e aberto em `/site/v2-clinica-horizonte-qa-b396d91f31`; cinco serviços e 12 perguntas mantidos como na prévia |
| Evidência visual | Captura da publicação mostra o hero com foto do nicho, conteúdo adicional de serviços dentro do hero e marca/menu brancos sobre cabeçalho claro com contraste insuficiente |

**Resultado geral: reprovado.** A IA respondeu “Site completo criado em etapas e validado”, mas essa mensagem não corresponde à conformidade com o briefing. A conta de teste mostrava duas gerações disponíveis antes do teste e uma depois; os outros cinco cenários de geração nova não foram executados.

## Ordem de continuação e critérios de aceite

1. **Contrato inicial de briefing:** unificar quantidades, seções, ordem, links e propriedades explícitas; manter defaults quando o cliente não especificar. Aceite: sites novos nos cinco templates respeitam os mesmos pedidos, inclusive quantidades por extenso e pedidos conflitantes resolvidos sem alteração silenciosa.
2. **Referência visual:** avaliar composição real, não apenas paleta; compartilhar direção visual entre lotes e renderer sem substituir fotos do nicho. Aceite: comparação visual com referências distintas e instrução textual prevalecendo quando divergir da imagem.
3. **Precedência visual e T2:** remover o conflito entre defaults/CSS e propriedades do cliente. Aceite: mudança de cor e alinhamento aparece na prévia e na publicação; T1 sem alteração visual nos cenários sem pedidos novos.
4. **Chat e integridade:** executar a matriz de textos, cards, imagens, seções, CTA, FAQ e animações em sites novos e existentes; comparar diffs dos dados e resultado renderizado.
5. **Persistência/publicação:** salvar, F5, reabrir, publicar e conferir desktop/mobile para cada categoria e modalidade que compartilha o componente alterado.
6. **Estabilização:** finalizar build, regressões, comparação com baseline e commits concorrentes; liberar somente os commits desta frente após evidências.

| Cenário real pendente | Geração nova e verificações |
| --- | --- |
| A — Psicologia | 4 serviços, 4 diferenciais, 4 etapas; sobre, galeria, depoimentos, FAQ e formulário; verde-escuro/bege/branco; títulos centralizados |
| B — Clínica | Outra paleta, textos e fotos coerentes com o nicho |
| C — Advocacia | Composição corporativa, sem fatos ou credenciais inventados |
| D — Restaurante | Cardápio, preços e ingredientes fornecidos; CTA correto; prévia/publicação |
| E — Imobiliária | Imóveis, valores, descrições e fotos; preservação das edições |
| F — Referência | Imagem enviada no briefing inicial; composição, tipografia, paleta, cards e proporções comparados visualmente |

Para cada cenário: gerar → desktop/mobile → editar → salvar → F5 → reabrir → publicar → comparar. Registrar aprovado/reprovado com evidência do resultado real; mensagem da IA não é critério de aprovação.

As durações do briefing continuam estimativas. A01–A12 fornecem a base técnica para revisá-las; esta auditoria não garante uma data de conclusão das sete fases.
