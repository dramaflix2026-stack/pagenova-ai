# Builder 2.0: backup automático e recuperação segura

Resultados atuais da missão final: [relatório de homologação](builder-backup-homologation-20261104.md). As seções abaixo preservam o histórico das implementações anteriores.

Data: 04/11/2026. Branch: `feature/builder-v2-safe-cloud-sync-20261104`.
Base: `main` em `190cabd075fa0afeed8d8e658f2b0572a0343277`.

## Estado da entrega

Implementação na branch isolada, com testes locais aprovados. Não publicada em Production. A migração SQL NÃO foi aplicada ao Supabase hospedado e nenhum projeto real foi migrado nesta sessão. A validação autenticada ao vivo e entre dois navegadores físicos permanece pendente: o navegador disponível foi redirecionado de `/app/builder-v2` para `/trial-expired`. A restrição de acesso não foi alterada.

## Auditoria

- O Studio usa `pagenova-builder-v2-private-v1` e `:versions` no localStorage; importações CRM usam um sufixo próprio. O rascunho principal era substituído a cada edição e ao iniciar outro site; o histórico mantém até 25 versões.
- O IndexedDB legado é `pagenova-projects`, versão 1, store `projects`. Armazena projetos institucionais, clones e outros módulos. A fila existente ordena gravações por projeto.
- O histórico remoto existente usa `pagenova_builder_versions` e o identificador compartilhado `builder-v2-default`. Não representa o catálogo de projetos nem garante cópia automática de todo estado atual. Foi preservado por compatibilidade.
- A autenticação existente usa Supabase SSR/cookies e `auth.getUser()`. O layout também verifica direito de acesso. O frontend público está na Railway, serviço `pagenova-frontend`, branch `main`; contém as variáveis de Supabase e OpenAI necessárias por nome. Nenhum segredo foi impresso ou alterado.
- Nenhuma modificação no chat, renderizadores, templates, modelos visuais ou integração OpenAI.

## Implementação

1. Banco local separado `pagenova-project-backups-v1`, sem upgrade, limpeza ou exclusão no banco original. Preserva snapshots completos e uma fila durável por usuário/projeto, com hash canônico e ordem de captura.
2. Importação somente por leitura dos registros originais, preservando suas chaves. Importação de rascunhos e históricos do Studio. Importações são revisões de arquivo e nunca avançam a versão atual remota. Repetições usam identidade determinística, sem duplicar a mesma cópia.
3. Eventos após gravação local bem-sucedida e captura de cada mudança hidratada do Studio. A rede não é aguardada pelo salvamento original. Tentativas automáticas ao abrir o app, recuperar conexão, voltar à janela e a cada 30 segundos.
4. Duas tabelas novas: `pagenova_cloud_projects` guarda o apontador atual; `pagenova_project_revisions` guarda conteúdo imutável. Ambas têm RLS por `auth.uid()`. Clientes autenticados só recebem SELECT direto. Não recebem UPDATE/DELETE de backups.
5. O procedimento privado recebe a identidade exclusivamente de `auth.uid()`, fixa `search_path` e serializa operações do mesmo projeto com lock transacional. O wrapper público é SECURITY INVOKER. A função privada SECURITY DEFINER é necessária para escrita controlada e histórico imutável sem conceder DML direto aos clientes.
6. Atualizações com revisão-base divergente são guardadas como conflitos; o apontador atual permanece intacto. IDs de operação permitem repetir uma requisição cujo retorno foi perdido. A fila persiste a base enviada antes da rede. Locks do navegador coordenam abas sem bloquear a captura local.
7. Estados vazios do Studio, payloads inválidos e arquivos/objetos que perderiam conteúdo na serialização são recusados. O original permanece local. Para objetos locais de tipos ainda não suportados, é necessário implementar serialização de assets antes de liberar seu backup; o sistema não os converte silenciosamente em objetos vazios.
8. Vínculo persistente da origem local à primeira conta que a migrou, mais comparação entre usuário da fila e usuário autenticado em cada POST. Trocar de conta não autoriza reenviar a fila anterior. Registros legados não têm proprietário; sua atribuição inicial é à conta autenticada que executa a migração.
9. Acesso aos backups pelo painel de versões existente, em `/app/builder-v2/backups`. Lista as revisões da conta, com paginação, histórico, cópias locais e conflitos. Recuperação cria um NOVO projeto, guardando antes o rascunho atual. Não substitui um projeto remoto existente. Para IndexedDB usa uma chave nova; para Studio preserva também o texto bruto do slot anterior antes de ativar a cópia.
10. A captura na gravação legada agora clona o argumento antes da espera, evitando que uma referência mutável produza conteúdo diferente entre salvamento e notificação.

## Validação executada

`npm run test:project-sync`: **13 testes aprovados na revisão atual**. IndexedDB via fake-indexeddb; SQL real via Postgres/WASM (PGlite); handlers de API reais transpilados com adaptador de autenticação/banco simulado.

| Cenário | Resultado |
| --- | --- |
| Criação, atualização e ordem de 30 edições rápidas | Aprovado |
| Captura de referências mutáveis e rejeição de estados vazios | Aprovado |
| Preservação exata de registros/chaves do IndexedDB original | Aprovado |
| Migração repetida de localStorage, histórico e IndexedDB | Aprovado |
| Falha de rede, persistência local e reenvio posterior | Aprovado |
| Revisão-base divergente e preservação das duas versões | Aprovado em Postgres local |
| Restauração por cópia sem alteração do original | Aprovado no armazenamento local |
| Requisição repetida e confirmação da revisão | Aprovado |
| RLS entre duas identidades e recusa de acesso anônimo | Aprovado em Postgres local |
| API: login obrigatório, origem, conta, payload e falha de serviço | Aprovado |
| ESLint dos novos arquivos | Aprovado |
| TypeScript após geração de tipos/utilitários | Aprovado |
| `npm run build` na revisão atual | 318 testes Node aprovados, além dos validadores existentes; etapa final Turbopack bloqueada por conexão ao baixar as fontes Geist |
| Teste OpenAI pelo chat autenticado na Railway | Bloqueado pelo acesso expirado da sessão disponível |
| Dois dispositivos reais + atualização/fechamento durante envio | Pendente no ambiente de homologação |
| Políticas via REST do Supabase hospedado | Pendente: migração ainda não aplicada |

O build completo inicial usou a primeira versão dos seis testes locais; após acrescentar quatro testes de API e as proteções finais, os dez testes foram executados novamente. A compilação final do Next é verificada separadamente. Um cache de compilação do Turbopack tornou-se inválido na segunda compilação; foi movido para scratch e a compilação foi refeita sem reutilizá-lo. Artefatos de templates/CRM gerados pelos scripts de build não integram a alteração.

## Limites e liberação

- Não declarar migração de projetos reais concluída antes de conferir contagem e conteúdo no Chrome/origem onde estão os originais.
- IndexedDB e localStorage são isolados por origem (protocolo, domínio e porta). Uma página no domínio novo não pode ler dados do domínio antigo. Validar o domínio usado pelos projetos existentes; se houver mudança de origem, preparar exportação/importação ou executar a migração na origem antiga.
- Downloads externos de imagens não fazem parte desta migração. Os projetos mantêm as URLs e dados existentes; links temporários continuam dependendo de sua validade.
- As cópias são retidas sem exclusão automática. Monitorar espaço local e volume remoto. Em falta de espaço, avisar o usuário; nunca limpar o original como recuperação.
- A sincronização funciona com o app aberto; a fila retoma na próxima abertura. Não há garantia de executar rede depois de o navegador/processo ser encerrado.
- Reabrir uma revisão em outro dispositivo cria uma ramificação segura com ID novo. Não há mesclagem automática nem resolução destrutiva de conflitos.

### Etapas restantes antes de Production

1. Disponibilizar a migração aditiva em ambiente de homologação e verificar os grants/RLS pelo REST e pelos advisors do Supabase.
2. Usar uma conta de teste com acesso válido, sem alterar o plano/entitlement da conta atual. Publicar a branch em ambiente isolado, preservando `main` e os domínios de Production.
3. Em dois perfis de navegador, criar, editar simultaneamente, ficar offline, recarregar durante um envio e restaurar revisões. Conferir payloads e todos os originais antes/depois.
4. Executar uma edição real pelo chat na Railway com OpenAI, confirmar persistência após F5 e recuperação no segundo perfil. Não consumir geração de site novo para um teste de edição.
5. Somente após aprovação dessas verificações, aplicar a migração aditiva ao Supabase de Production e publicar a aplicação. Caso falhe a aplicação, voltar o código; manter tabelas e revisões. Nunca fazer rollback com DROP/TRUNCATE ou limpeza de IndexedDB.

## Continuação e revisão final — 04/11/2026

A branch existente e o PR #15 foram reaproveitados. Antes desta revisão, a árvore de trabalho estava limpa e o código local correspondia ao commit remoto `e6b36a3ae8968ad34fcd987ba17d924e4ed80fee`. Foram revisados os 15 arquivos da entrega anterior; não foi necessário recriar o projeto nem refazer a implementação.

Correções adicionais da revisão:

- A propriedade local agora é conferida dentro do próprio armazenamento de backups, inclusive quando a captura é chamada diretamente pela recuperação. Um projeto já vinculado à conta A não pode ser enfileirado para a conta B.
- A recuperação no Studio verifica troca de conta antes de iniciar e antes de ativar a cópia. Se o rascunho atual pertence a outra conta, seu texto bruto é preservado localmente, sem enviá-lo à nuvem da conta atual.
- Históricos sem rascunho principal também são encontrados. Um rascunho ilegível ou uma versão inválida não bloqueia a migração das demais versões válidas; os originais permanecem intactos.
- A API recusa JSON nulo, escalar ou array com HTTP 400, em vez de falhar ao acessar seus campos.
- Uma revisão recusada permanentemente por tamanho/validação (HTTP 413/422) fica preservada com estado local `blocked`; a fila continua enviando os outros projetos. A recuperação identifica essa cópia como envio recusado. O limite atual de envio é 20 MB por revisão; arquivos maiores exigem um mecanismo de assets/chunks antes de sua liberação.

A suíte específica passou a **13 testes aprovados**, incluindo os novos cenários. O teste de Postgres também confirma a aceitação de um projeto legado válido pela RPC, além da recusa de um projeto vazio.

O primeiro build repetido encontrou cache inválido do Turbopack. Na tentativa seguinte, o instalador legado FRIGOLOG recusou seus próprios arquivos já gerados e modificados pelos patches do build anterior. Esses dois artefatos transitórios foram movidos para scratch e o build foi executado a partir de arquivos gerados limpos. Não houve mudança no instalador, nos templates aprovados nem em seus conteúdos versionados. Uma execução em checkout limpo evita esses resíduos.

### Preparação da Railway e estado remoto confirmado

- Plano revisável: `ops/builder-backup-railway-preview-plan.json`. É um plano, não uma configuração ativa nem um comando de deploy.
- Dockerfile existente: `Dockerfile.railway-frontend`; contexto monorepo `/`, Node 24, `npm ci`, build integral, porta 8000 e healthcheck `/api/health`.
- Preview deve usar um serviço/ambiente separado, esta branch e um Supabase isolado. Não reutilizar o serviço público nem alterar seus domínios durante a homologação.
- Conferência remota: `pagenova-frontend` continua em `main`, sem alterações pendentes, deployment `492dec42-04d9-438d-9ff1-83b43c1df534` em SUCCESS. As cinco variáveis necessárias estão cadastradas por nome; nenhum valor foi exposto.
- Supabase hospedado: ambas as tabelas de backup ainda estão ausentes. Não há branch de desenvolvimento existente nesse projeto. Não foi provisionada infraestrutura com custo adicional nem aplicada migração de Production.
- Portanto, a implementação está disponível para homologação; a liberação para Production continua **não aprovada**. Permanecem necessárias a validação REST/RLS em Supabase isolado, a conferência dos projetos reais na origem do Chrome e os testes autenticados entre dispositivos e com OpenAI na Railway.

Proteção adicional contra regressão na abertura: a primeira hidratação do Studio é arquivada, sem avançar o apontador remoto. A leitura de um estado local diferente do último snapshot confirmado invalida a revisão-base conhecida. Edições feitas a partir dessa visão antiga passam a conflito, em vez de usar a confirmação de uma versão que não foi carregada na tela. Confirmações atrasadas não removem essa proteção. O mesmo tratamento vale para o snapshot atual importado do IndexedDB. Um teste específico reproduz rascunho antigo + confirmação mais nova + confirmação atrasada + nova edição e verifica que a base enviada continua nula, impedindo substituir um apontador já existente.

### Resultado de compilação desta continuação

- `npm run test:project-sync`: 13/13 aprovados.
- Suíte chamada por `npm run build`: 318 testes Node aprovados, mais os validadores/runtime existentes. A etapa final com Turbopack falhou ao buscar arquivos WOFF2 de `fonts.gstatic.com`; não foram substituídas fontes nem alterado o layout para contornar a falha.
- `next typegen` seguido de `tsc --noEmit --incremental false`: aprovado.
- ESLint nos módulos de sincronização, API e recuperação modificados: aprovado.
- Foi executada também a compilação Next.js com Webpack, usando as mesmas fontes reais e sem mocks, para verificar o código com outro compilador. A compilação completa com Webpack, incluindo TypeScript e geração de rotas, foi aprovada.
- A Railway segue usando o Dockerfile original, que executa o build padrão. A compilação desse caminho ainda deve ser conferida no preview, além dos testes autenticados pendentes.
