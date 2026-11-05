# PageNova — recuperação e ativação segura, 04/11/2026

**Homologação parcial. Não publicar em Production.** Este relatório atualiza os dois relatórios anteriores; seus números e limitações antigos não representam o estado final desta missão.

PR [#15](https://github.com/dramaflix2026-stack/pagenova-ai/pull/15), branch `feature/builder-v2-safe-cloud-sync-20261104`. O GitHub confirmou o ponto de partida `d733618c974bcdf80fe7bc562ce33db88100735d`, PR aberto, rascunho, sem merge. A cadeia anterior foi mantida. O SHA final fica no PR e na resposta de entrega, pois este arquivo integra o próprio commit.

Nenhum projeto real, perfil pessoal do Chrome, DNS, banco de Production ou deployment foi modificado. Nenhum recurso pago foi criado. Nenhuma credencial real foi transferida para QA. O armazenamento original continua `pagenova-projects`, versão 1, store `projects`.

## Correções realizadas

1. Legados sem proprietário deixam de ser enviados à primeira conta autenticada. Ficam pendentes até confirmação explícita em Backups. Vínculos existentes não podem ser reatribuídos a outra conta. A criação de um registro novo é distinguida da edição de um registro preexistente em uma transação IndexedDB.
2. Gravações locais vazias ou estruturalmente inválidas não substituem um projeto completo. O erro preserva o registro anterior, inclusive arquivos binários. A validação remota, CAS e revisões imutáveis continuam protegendo o servidor.
3. Nova exportação/importação portátil com SHA-256, IDs/chaves originais, conteúdo, campos desconhecidos e arquivos File/Blob. Preserva também ciclos, referências compartilhadas, datas, buffers, mapas e conjuntos. A importação verifica o arquivo inteiro e o guarda em um banco separado, `pagenova-portable-recovery-v1`, por conta e checksum. Reimportação idêntica não duplica registros. Não substitui o destino. A ativação é por cópia com ID novo.
4. Exportador independente para a origem antiga: `ops/export-pagenova-local-projects.js`, gerado do mesmo codec. Só leitura, sem rede, limpeza ou upgrade de schema. Funciona antes da publicação do código novo, quando executado pelo proprietário no navegador original.
5. Exclusão explícita pelo helper legado exige conta proprietária e Web Locks. Antes da exclusão, cria uma cópia portátil, relê e verifica sua integridade no banco separado. Falha, conta incorreta ou navegador sem locks suspendem a exclusão. O migrador nunca chama esse caminho. Só registros sintéticos foram excluídos nos testes.
6. Uma edição recebida durante um envio em andamento aciona outra drenagem da fila ao terminar. O teste real de F5 encontrou o atraso anterior até o ciclo de 30 segundos; a correção passou no cenário original.
7. Backups mostra revisões confirmadas, pendentes e recusadas; confirmação da propriedade, origem do arquivo importado e limitações do envio. Respostas de outra sessão não são incorporadas à lista.

Templates, fontes, imagens aprovadas e o motor universal não receberam alterações nesta missão. A página de Backups recebeu controles de recuperação; não houve redesenho do Builder.

## Matriz de requisitos e evidências

APROVADO significa somente o alcance descrito. NÃO TESTADO nunca equivale a aprovação. Testes de browser abaixo usam Chromium e IndexedDB reais, Postgres/WASM com o SQL da migração e autenticação HTTP de fixture; não são Supabase Auth/PostgREST nem a interface completa do Next.

| Requisito | Estado | Evidência e limite |
| --- | --- | --- |
| Integridade do PR e continuidade | APROVADO | GitHub confirmou branch, SHA inicial e PR draft aberto; commits anteriores preservados |
| Salvamento local e cópia automática | APROVADO | 19 testes específicos; criação, fila durável e envio no harness Chromium |
| Preservação dos legados durante migração | APROVADO | Inventário somente leitura e teste de igualdade de chaves/conteúdo antes/depois em fixtures |
| Confirmação da conta dos legados | APROVADO | Teste recusa primeira conta implícita e reatribuição de proprietário |
| Recusa de projeto vazio sobre completo | APROVADO | Teste Node e Chromium preservam conteúdo anterior e bytes de arquivo |
| Idempotência, concorrência e versões antigas | APROVADO | CAS SQL, revisões imutáveis, dois perfis, resposta HTTP perdida e reenvio sem duplicação |
| Queda de rede e retorno | APROVADO | Edição offline persiste após fechamento do processo; reabertura envia a fila |
| Falha de servidor e formato/tamanho inválido | APROVADO | Fixtures de falha HTTP, 413/422, conteúdo preservado e outros projetos continuam enviando |
| Histórico e restauração por nova chave | APROVADO | Testes de revisão e recuperação em segundo perfil sem substituir o original |
| F5 e fechar/reabrir navegador | APROVADO | Perfis Chromium persistentes descartáveis; conteúdo comparado após reinício |
| Exportação e importação entre origens | APROVADO | Duas portas/origens HTTP e perfis distintos; File com nome, bytes e data preservados; colisão não substitui destino |
| RLS no SQL local | APROVADO | Migração real em PGlite, duas identidades, anonimato e escrita direta recusados |
| Auth/PostgREST/RLS no Supabase real isolado | NÃO TESTADO | Não há banco de QA conectado; stack Docker preparada, não executada |
| Backup remoto ativo em Production | REPROVADO | Consulta read-only retornou NULL para `public.pagenova_cloud_projects` e `public.pagenova_project_revisions`; produção roda main |
| Troca de conta: impedir envio de dados de outra conta | APROVADO | Segundo usuário não recebe projetos do primeiro no harness |
| Privacidade dos dados locais em navegador compartilhado | REPROVADO | Store legado e slot Studio são globais por origem; leitura local ainda acessível após troca de conta. RLS não isola o disco/perfil do navegador. Não prometer isolamento integral da interface local |
| Projetos reais antigos do Chrome | NÃO TESTADO | Perfil/origem original do proprietário não está disponível nesta sessão; nenhum conteúdo real foi acessado ou migrado |
| Todos os templates no motor | APROVADO | Suíte existente compartilhada passou; fontes dos templates e motor não alteradas. Não significa inspeção visual de cada modelo |
| Chat real OpenAI: títulos, descrições, imagens e seções | NÃO TESTADO | Sem chamada paga ou chave de QA; navegação disponível em www redirecionou para `/trial-expired` |
| Interface completa desktop/mobile autenticada | NÃO TESTADO | Bloqueada pelo acesso expirado; testes de módulos não substituem esse gate |
| TypeScript e ESLint | APROVADO | `tsc --noEmit --incremental false` e `npm run lint`, exit 0; ESLint emite aviso interno de resolução TSNonNullExpression, sem erro de regra |
| Suíte completa e build local | APROVADO | 324 testes Node em 24 execuções, validadores/runtime, geradores, CRM/Vite e Next/Turbopack; build exit 0 |
| Dockerfile real da Railway | NÃO TESTADO | Sem Docker nesta máquina; GitHub recusou runner antes de qualquer etapa por cobrança |
| Fontes Geist aprovadas | APROVADO | Build padrão limpo passou preservando fontes e TLS. A falha antiga de download não reproduziu; não atribuímos causa raiz definitiva |
| Saúde pública Railway www e temporário | APROVADO | `/api/health` HTTP 200, `pagenova-frontend`; deployment atual SUCCESS |
| Backup e chat desta branch na Railway | NÃO TESTADO | Branch não implantada; saúde do main não homologa o PR |
| CRM em Production | REPROVADO | Log observado: `PageNova CRM integration is not configured.`; nenhuma configuração foi alterada |
| www.pagenovaai.com.br | APROVADO | Railway: DNS propagado e certificado VALID; CNAME `ivc7m74b.up.railway.app` |
| pagenovaai.com.br sem www | REPROVADO | Railway DNS_REQUIRES_UPDATE, certificado ISSUING, alvo esperado `df9jd7i8.up.railway.app`; consulta pública sem A utilizável e health HTTP 503 |
| Rollback e plano de migração | APROVADO | Preparação documentada abaixo; não executada |
| Homologação completa / liberação de Production | REPROVADO | Gates reais obrigatórios continuam pendentes |

Os 19 testes específicos já integram os 324. Os 10 cenários Chromium são adicionais. Não somar testes preparados, bloqueados ou simulados a resultados reais.

## Infraestrutura conferida sem alterações

Railway: projeto `31d36a1f-da57-4354-b4c7-c81cf7cded72`, serviço `pagenova-frontend`, deployment `492dec42-04d9-438d-9ff1-83b43c1df534`, SUCCESS, branch main, sem alterações pendentes. Nomes das variáveis conferidos, valores não consultados: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `OPENAI_API_KEY`, `PORT`. Existência não comprova validade ou integração funcional.

Supabase PageNova `kgbgwbodosglmonvrhyi`: ativo; consulta de catálogo confirma ausência das tabelas novas. Não aplicamos a migração. Políticas legadas `pagenova_builder_versions` têm SELECT/INSERT/DELETE autenticado por `auth.uid() = user_id`; isso não comprova RLS das tabelas futuras. Nenhuma branch Supabase de teste disponível foi utilizada e não provisionamos recurso pago.

CI: [run 41872124639](https://github.com/dramaflix2026-stack/pagenova-ai/actions/runs/41872124639), job `126721747602`, zero etapas: “The job was not started because your account is locked due to a billing issue.” O workflow existente prepara Supabase descartável e compila exatamente `Dockerfile.railway-frontend`, sem segredos de Production ou deploy. A falha é anterior ao build, não prova falha de código no Dockerfile.

ALIAS da Hostinger não é incompatível por definição: ele pode achatar o apex para A, sem retornar CNAME. É necessário comparar a resolução A/AAAA do apex ao alvo específico fornecido pela Railway. Documentação: [Hostinger](https://www.hostinger.com/support/10067986-how-to-manage-alias-records-at-hostinger/), [Railway](https://docs.railway.com/networking/domains/working-with-domains). Conferir o registro `@` no painel, possíveis A/AAAA conflitantes e o alvo esperado, preservando MX/TXT/e-mail. Não efetuar correção de DNS nesta missão sem revisar o estado exato do painel.

## Recuperação humana dos projetos antigos — procedimento exato

1. Em cada dispositivo e perfil Chrome usado, não limpar dados. Registrar a origem exata em que os projetos foram criados: `https://pagenovaai.com.br`, `https://www.pagenovaai.com.br` e qualquer outra origem realmente usada são armazenamentos distintos. O domínio temporário não enxerga o IndexedDB do domínio antigo.
2. Antes de editar, fechar o Chrome e copiar localmente o perfil completo indicado em `chrome://version` para uma pasta de segurança. Não enviar esse perfil ou dados reais ao ambiente de QA. Reabrir o perfil original.
3. Abrir a origem original. Uma página de acesso expirado na mesma origem não elimina o armazenamento. Se o domínio não resolve, recuperar seu DNS/origem com revisão antes; não criar banco vazio em outra origem supondo recuperação automática.
4. Revisar e executar no Console o conteúdo versionado de `ops/export-pagenova-local-projects.js`. Confirmar a propriedade dos dados. O script lê o IndexedDB existente e os slots Studio, baixa um JSON com checksum, não envia rede e não altera os originais. Guardar o arquivo em local privado. O inventário `ops/builder-backup-readonly-inventory.js` permite registrar chaves/hashes antes e depois, mas não substitui o backup completo.
5. Repetir em todos os dispositivos/perfis/origens. Projetos de origens diferentes podem ter IDs coincidentes; guardar arquivos separados. Conteúdo ilegível é arquivado como string original, sem ser ativado automaticamente.
6. Depois da homologação e de futura autorização de publicação, entrar na conta correta em `/app/builder-v2/backups`, confirmar propriedade e importar o arquivo. A importação vai para área local separada; usar Recuperar cópia, comparar títulos, seções, imagens e configurações antes de reutilizar. Não excluir os arquivos ou originais.
7. Só considerar cópia remota concluída após confirmação do servidor e leitura da revisão em outra sessão autenticada. Arquivo exportado/importado ou snapshot pendente NÃO é confirmação de Supabase. Comparar também inventário original para verificar que nada mudou.

Não declaramos nenhum projeto real recuperado. Não é possível ler o IndexedDB de outro domínio/dispositivo por código executado no domínio temporário.

## Limitações e riscos residuais

- Cloud aceita JSON válido até 20 MB. File/Blob, ciclos e outros tipos não serializáveis são preservados no arquivo portátil/local, mas não enviados silenciosamente à nuvem. Não há uploader remoto de binários nesta entrega. URLs temporárias/exteriores não garantem disponibilidade futura das imagens.
- Arquivo portátil limitado a 128 MB/10 mil registros e limites estruturais. Não existe seleção de lotes na interface atual; se exceder, manter backup completo do perfil e planejar exportação por lotes antes de migrar. SHA-256 verifica integridade, não autoria; importar somente arquivos confiáveis.
- Conflito preserva ambas as revisões; não mescla semanticamente e não substitui automaticamente a head mais recente.
- Confirmação de propriedade é declaração do usuário, não prova criptográfica de autoria de um registro legado. Dados locais de um perfil compartilhado continuam acessíveis localmente. Falta homologar/corrigir a separação da interface local por conta antes de prometer privacidade integral.
- Backup local pode falhar por quota, bloqueio do navegador ou armazenamento indisponível; mensagens não equivalem a confirmação remota. Manter exportação independente antes de transição de origem.
- Não há evidência de build Docker, Auth/PostgREST real, OpenAI real ou matriz visual mobile/desktop de todos os modelos. Produção segue sem o novo backup remoto.

## Próximas ações e rollback

1. Desbloquear os runners da conta GitHub pelo responsável ou executar o workflow equivalente em máquina com Docker existente. Não provisionar serviço pago. Rodar a stack Supabase local descartável, a migração nova e a imagem do Dockerfile real; exigir Auth/REST/RLS e Builder completos aprovados.
2. Testar o Builder em desktop/mobile com usuário sintético de acesso válido, em duas sessões. Usar chave OpenAI exclusiva de QA e orçamento autorizado para confirmar chamada real, títulos/descrições/imagens/adição/remoção de seções e persistência após F5/reabertura. Não contornar entitlement nem editar projetos reais.
3. Resolver o isolamento da leitura/rascunho local por conta sem apagar ou substituir os legados; repetir testes de troca de conta na interface inteira. Conferir e corrigir separadamente configuração CRM e DNS do apex, preservando e-mail.
4. Executar inventários/exportações originais com o proprietário e guardar cópias privadas verificadas. Não copiar esses projetos para QA. Revisar o PR final e o diff da migração aditiva.
5. Somente após os gates e aprovação explícita: aplicar migração aditiva revisada, verificar grants/RLS com usuários sintéticos, publicar SHA aprovado e verificar revisões remotas e originais antes/depois. Não misturar migração de domínio, deploy e limpeza de dados em uma única operação.

Rollback: voltar somente o código para o deployment anterior; manter tabelas/revisões, IndexedDB original, vault de recuperação, filas e exportações. Nunca DROP/TRUNCATE, limpeza de cache/dados ou `indexedDB.deleteDatabase()` como rollback. Restaurar para ID novo e conferir conteúdo. Esta missão não executa merge, migração de Production ou deploy.

**Próxima ação concreta para destravar a homologação:** executar o workflow Docker/Supabase isolado após desbloqueio dos runners (ou em Docker local existente), enquanto o proprietário exporta com segurança cada origem/perfil antigo. Publicação continua não recomendada até fechar os gates reais e a privacidade local por conta.

## Inventário final de arquivos do PR

Inclui a implementação anterior, QA e esta continuação. Os bundles gerados durante build foram retirados do diff; nenhum template aprovado foi alterado.

- `.dockerignore`
- `.github/workflows/builder-backup-homologation.yml`
- `docs/builder-backup-activation-20261104.md`
- `docs/builder-backup-activation-evidence-20261104.json`
- `docs/builder-backup-homologation-20261104.md`
- `docs/builder-v2-safe-cloud-sync-20261104.md`
- `frontend/package-lock.json`
- `frontend/package.json`
- `frontend/scripts/build-project-portable-export.mjs`
- `frontend/scripts/fixtures/project-sync-qa.sql`
- `frontend/scripts/test-project-portable-archive.mjs`
- `frontend/scripts/test-project-sync-api.mjs`
- `frontend/scripts/test-project-sync-browser.mjs`
- `frontend/scripts/test-project-sync-supabase.mjs`
- `frontend/scripts/test-project-sync.mjs`
- `frontend/src/app/api/builder-v2/projects/route.ts`
- `frontend/src/app/app/builder-v2/backups/page.tsx`
- `frontend/src/app/app/builder-v2/page.tsx`
- `frontend/src/app/app/layout.tsx`
- `frontend/src/components/project-sync-provider.tsx`
- `frontend/src/lib/pagenova-project-store.ts`
- `frontend/src/lib/project-portable-archive.ts`
- `frontend/src/lib/project-portable-recovery.ts`
- `frontend/src/lib/project-sync-contract.ts`
- `frontend/src/lib/project-sync-local.ts`
- `frontend/src/lib/project-sync.ts`
- `ops/builder-backup-railway-preview-plan.json`
- `ops/builder-backup-readonly-inventory.js`
- `ops/export-pagenova-local-projects.js`
- `supabase/migrations/20261104160714_builder_project_safe_cloud_sync.sql`
