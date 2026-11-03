# Editor universal — auditoria e desenvolvimento de 03/11/2026

Branch: `audit/universal-edit-service-description-20261103`.
Base informada e conferida: `9a4984e3ac45ea940075333cde40855c27469a40`.
Main e Production preservadas. Sem migrações, alterações de infraestrutura ou gravações em dados reais.

## Resultado

O editor agora processa comandos combinados em português de maneira atômica, antes dos atalhos legados. Valida operações e patches de IA, preserva identidade/mídia/metadados não relacionados e conecta edições a mais renderizadores existentes. A compatibilidade universal completa ainda não está concluída: há renderizadores especializados com conteúdo e estrutura fixos.

## Auditoria inicial

- Os 39 testes universais da base passaram antes de qualquer edição.
- O Preview de `9a4984e` estava READY; falhas anteriores de deploy já tinham correções na branch.
- Havia operações estruturadas e reconhecimento de IDs/textos exatos. O editor podia interceptar apenas parte de um pedido composto.
- A publicação já aceitava snapshots com um ou mais blocos, mas o botão da interface ainda exigia quatro.
- Preview e publicação utilizam o mesmo componente principal; vários componentes TP possuem composições fixas que ignoram operações nos blocos.
- O navegador remoto redirecionou `/app/builder-v2` para login. Não havia sessão autenticada para testar geração, F5 e publicação reais.
- A branch recebeu os commits concorrentes `7448b99c` e `ccf8f138`. Ambos foram incorporados e seus testes preservados; nenhum avanço remoto foi sobrescrito.

## Implementação consolidada

### Motor e linguagem

- Alvos por título visível, nome de seção, aliases em português e IDs. Recusa de alvos ambíguos.
- Edição de títulos, descrições, imagens e links; estilos de cor, fonte, alinhamento e tamanho desktop/mobile.
- Cor de todos os botões; remoção e movimentação de seções antes/depois de uma âncora.
- Galeria com URLs fornecidas, título opcional, posicionamento antes do contato e recusa de duplicação/ausência de imagens.
- Separação de comandos fora de aspas; qualquer comando inválido ou não suportado cancela o lote inteiro.
- Dispatcher compartilhado antes de atalhos locais. Pedidos combinados com anexos são recusados preservando anexos e site, até haver transação de upload.
- Validação em runtime de tipos, objetos JSON, propriedades, contagens, URLs e limites de estilo. Rejeição de controles, redirects com barra invertida, credenciais em URL e esquemas inseguros.
- Novos blocos recebem os campos exigidos pela publicação. Alterações explícitas de cor/alinhamento são identificadas para os renderizadores.
- Patches do modelo também passam pelo validador compartilhado de atualização. O caminho legado aceita sites editados menores que quatro blocos.

### Renderização sem reconstruir templates

- Clássicos Institucional Complete e Minimalista Sofisticado: cores explícitas, fonte/tamanho de parágrafos e CTAs, tamanho mobile e links relativos com query/hash.
- TP3 modelos 01/02/03: estilos explícitos da capa e botões; perguntas cadastradas no FAQ dos modelos 02/03; título da galeria do modelo 03; proteção do índice do carrossel após exclusões.
- TP3 modelos 01/02/03: remoções e movimentações de seções são aplicadas às seções React aprovadas como unidades inteiras. O adaptador não injeta wrappers de layout nem substitui composições por templates genéricos.
- Eventos estruturais são serializáveis e seguem com o site no rascunho/snapshot. Testes comprovam que uma capa removida não reaparece pelos fallbacks fixos do TP3.
- Fontes são propriedades CSS: carregar uma fonte que ainda não exista no projeto continua sendo uma preocupação separada.

### Conteúdo factual e publicação

- A geração deixou de solicitar depoimentos fictícios. O filtro final descarta relatos/atribuições que não constam do briefing, mesmo depois dos reparos de cardinalidade.
- Testes cobrem relato fornecido, atribuição inventada, recombinação indevida de fatos separados e geração sem relatos cadastrados. O relato completo com atribuição deve constar do briefing.
- Botão de publicação liberado para um ou mais blocos válidos; snapshot e renderização pública mantêm o contrato existente.
- Formulários, bancos e integrações existentes não foram modificados para simular sucesso.

## Verificação

| Verificação | Resultado e alcance |
| --- | --- |
| Regressão `test-builder-v2-*.mjs` | 202 testes, zero falhas/skips no estado final |
| Gates existentes antes de instalação/build do CRM | Todos aprovados; 247 casos Node no conjunto final, além de smoke/runtime de formulários, quiz, créditos e isolamento em memória |
| Handler real: geração nova seguida de edição | Aprovado para os três IDs estáticos; autenticação, cobrança e provedor simulados |
| Pedido combinado | Imagem + título + botões + remoção de depoimentos + galeria + FAQ; rollback integral em ambiguidade/erro |
| React real dos clássicos | Prévia e público: texto, estilo, links, remoção e ordem |
| Chromium dos clássicos | 12 cenários: dois templates × prévia/público × 1440/768/390 px; cores/tipografia/links computados e sem overflow |
| React real dos três TP3 | Edição de conteúdo, FAQ, CTA e galeria; remoção/reordenação de seções, JSON e modos prévia/público |
| Chromium dos três TP3 | Nove combinações de modelo/largura: 1440/820/390 px; tipografia/CTA corretos; sem overflow nos modelos 02/03 |
| TypeScript e Next 16.3.5 | Compilação, tipos e geração de páginas concluídos com Turbopack após copiar dependências para dentro do checkout |
| Persistência e publicação | Round-trip JSON e regressões de publicação aprovados; sem gravação real em Supabase ou publicação pública de fixture |

Os testes em navegador local usam HTML dos componentes reais e CSS da aplicação, com rede externa bloqueada. Não comprovam hidratação integral do editor, carregamento das mídias externas ou fidelidade visual de todas as famílias. Os testes de criação não equivalem a geração com o provedor real.

Os primeiros builds locais encontraram dois problemas de ambiente: Turbopack recusou o symlink externo de dependências; uma segunda extração do FRIGOLOG encontrou arquivos já modificados pelo próprio instalador. As dependências foram copiadas e os arquivos gerados localmente foram regenerados a partir do ZIP. Não houve alteração dos templates/instaladores por esse motivo; artefatos gerados do CRM não integram o patch. O build Next final concluiu.

## Arquivos do desenvolvimento consolidado

- `frontend/src/lib/builder-v2-universal-{operations,language,targets,plan}.ts`
- `frontend/src/app/api/builder-v2/chat/route.ts`
- `frontend/src/app/app/builder-v2/page.tsx`
- `frontend/src/components/builder-v2-site.tsx`
- `frontend/src/components/builder-v2-tp3-model{1,2,3}.tsx`
- `frontend/src/components/builder-v2-universal-{bindings,sections}.tsx`
- `frontend/scripts/test-builder-v2-{universal-operations,reference-generation,universal-renderer}.mjs`
- `frontend/scripts/builder-v2-renderer-harness.mjs`
- `frontend/scripts/qa-builder-v2-universal-browser.mjs`
- `frontend/scripts/verify-builder-v2-universal-render.cjs`
- `frontend/package.json` e este relatório.

## Histórico e deploys

Commits remotos incorporados: `7448b99c` e `ccf8f138`. Blocos locais: `14d1d70a` (motor), `f8fa4c3f` (patches/TP3), `146c564e` (integração concorrente), `e9426e14` (estrutura TP3), `e8f12657` (integração do renderizador compartilhado). O envio pelo conector GitHub consolida o estado validado em um commit sobre a ponta remota, pois o checkout não tem credencial de escrita Git. O SHA desse envio deve ser usado para localizar o Preview final.

Deploys de base conferidos: `9a4984e` → `pagenova-qibxkggcs-giovane-s-projects4.vercel.app`; `7448b99c` → `pagenova-hh90qskwi-giovane-s-projects4.vercel.app`, ambos READY/Preview. O acesso remoto ao Builder da base terminou no login e não foi contado como teste funcional. READY sozinho não comprova funcionamento visual.

## Pendências reais e próximos blocos

1. Estender bindings e composição editável às demais famílias/modelos TP1–TP10 e aos renderizadores 3D; ainda há textos/cards/estruturas fixos. TP3 tem integração parcial comprovada, não cobertura total de todas as propriedades.
2. Unificar uploads/referências, vídeos cinematográficos, cabeçalho/rodapé/WhatsApp e coleções em operações transacionais. Hoje há handlers próprios e pedidos combinados com anexos são recusados com segurança.
3. Executar com autenticação o fluxo editor → F5 → prévia → snapshot real → URL pública de teste, sem tocar Production. Ainda não verificado ponta a ponta.
4. Testar com o provedor real briefings novos para cada família/modelo e validar efeitos cinematográficos, 3D/tilt e responsividade com mídias carregadas.
5. Auditar dados factuais/depoimentos também nos caminhos legados e componentes especializados; o filtro novo cobre a geração principal.
6. Ampliar instruções naturais e coleções de cards/FAQ/galerias. Comando isolado não reconhecido ainda pode entrar no legado; lotes não reconhecidos são recusados integralmente.
7. Somente após validação integrada e aprovação explícita, preparar merge/promoção para main/Production.
