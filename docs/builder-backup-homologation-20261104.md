# PageNova AI — homologação final do backup automático

> Atualização posterior: [recuperação e ativação segura](builder-backup-activation-20261104.md). Consulte o relatório novo para números, mudanças de propriedade e bloqueios atuais.

Data: 04/11/2026. Branch: `feature/builder-v2-safe-cloud-sync-20261104`. PR: [#15](https://github.com/dramaflix2026-stack/pagenova-ai/pull/15).

**Decisão: homologação parcial; NÃO liberar Production.** Nenhum merge, deploy, migração real, alteração de domínio ou provisionamento pago foi executado. Não foram copiados dados nem credenciais de Production para testes.

Código de aplicação auditado: `013f9e2bc51db940a740d21f44103419d798c4b2`, descendente de `e6b36a3ae8968ad34fcd987ba17d924e4ed80fee`, baseado em `190cabd075fa0afeed8d8e658f2b0572a0343277`. A missão acrescenta ferramentas, fixtures e documentação de QA; não altera templates ou o motor. O SHA final enviado é informado no PR e no retorno da missão, pois um arquivo não pode incluir o hash do commit que contém a si próprio.

## Resultado dos blocos

| Verificação | Resultado e alcance real |
| --- | --- |
| Integridade da branch/commits | Cadeia de pais conferida; os commits anteriores foram preservados |
| 16 arquivos originais do PR | Revisados; relação e finalidade abaixo |
| 13 testes específicos | 13/13 aprovados novamente |
| Suíte completa | 318 testes Node aprovados em 24 execuções, mais validadores/runtime existentes |
| TypeScript | `next typegen` e `tsc --noEmit --incremental false` aprovados; build também concluiu TypeScript |
| ESLint | Aprovado nos módulos de armazenamento/sincronização, provider, API e recuperação |
| `npm run build` local limpo | **Aprovado, exit 0**: testes, geradores, CRM/Vite, Next 16.3.5/Turbopack e geração de rotas |
| Fontes Geist | Preservadas. Compilação padrão limpa passou sem mocks, troca de fonte ou desativação de TLS |
| Build do Dockerfile real | **BLOQUEADO antes de iniciar**: não há Docker nesta máquina e o runner GitHub foi recusado pela conta |
| Chromium/IndexedDB reais | 7 cenários aprovados em perfis descartáveis separados, com fechamento/reabertura dos processos |
| RLS em Postgres local | Aprovado com o SQL real da migração e duas identidades, incluindo recusa de escrita direta e anonimato |
| Supabase Auth + PostgREST reais | **Pendente**: stack local em Docker preparada, mas job não iniciou |
| Builder completo contra Supabase real | **Pendente**: suíte preparada para a imagem original, não executada |
| OpenAI real | **Pendente**: nenhum segredo real foi copiado e nenhuma chamada paga foi feita |
| Projetos reais do Chrome | Intocados; não foram acessados ou migrados. Procedimento humano somente de leitura abaixo |

Não somar os 13 testes específicos aos 318: eles já estão incluídos na suíte completa. Os sete cenários de Chromium são uma execução adicional e separada.

## Auditoria dos 16 arquivos entregues

| Arquivo | Conferência |
| --- | --- |
| `docs/builder-v2-safe-cloud-sync-20261104.md` | Histórico, limitações e gate de liberação preservados; este relatório atualiza o resultado |
| `frontend/package-lock.json` | Apenas duas dependências de teste fixadas; pins anteriores preservados |
| `frontend/package.json` | Testes integrados ao build; novos comandos de homologação separados |
| `frontend/scripts/test-project-sync-api.mjs` | Handlers reais com adaptador de banco/auth; login, origem, conta, conteúdo e falhas |
| `frontend/scripts/test-project-sync.mjs` | Ordem, migração, CAS, RLS, falhas, troca de conta e abertura de snapshot antigo |
| `frontend/src/app/api/builder-v2/projects/route.ts` | `getUser()`, cliente por sessão, payloads inválidos recusados, respostas sem cache e revisão-base |
| `frontend/src/app/app/builder-v2/backups/page.tsx` | Recuperação com ID novo, cópia anterior preservada e checagem da conta antes da ativação |
| `frontend/src/app/app/builder-v2/page.tsx` | Captura após hidratação; abertura antiga é arquivo, não substituição remota; alterações visuais não introduzidas |
| `frontend/src/app/app/layout.tsx` | Provider adicionado sem retirar autenticação ou verificação de acesso |
| `frontend/src/components/project-sync-provider.tsx` | Início/finalização de listeners por identidade; sem conteúdo visual |
| `frontend/src/lib/pagenova-project-store.ts` | Argumento clonado antes da fila; migração enumera registros em transação somente de leitura |
| `frontend/src/lib/project-sync-contract.ts` | Validação de conteúdo e de serialização; objetos que perderiam dados não são enviados silenciosamente |
| `frontend/src/lib/project-sync-local.ts` | Banco de backup separado, propriedade local, snapshots e fila durável, base invalidada para visão antiga |
| `frontend/src/lib/project-sync.ts` | Originais lidos sem exclusão, retry, coordenação entre abas e recusa permanente sem bloquear outros projetos |
| `ops/builder-backup-railway-preview-plan.json` | Plano declarativo; não executa alterações na Railway |
| `supabase/migrations/20261104160714_builder_project_safe_cloud_sync.sql` | Migração aditiva, SELECT por RLS, revisões imutáveis, escrita controlada por função privada e CAS transacional |

O scanner encontrou `.delete()` apenas em Set/Map de memória dos módulos novos, não em object stores de projetos. O nome, a versão 1 e o store do IndexedDB original permanecem intactos. O SQL de backup não remove tabelas ou dados existentes. A função de exclusão legada, utilizada por outros fluxos do aplicativo, não é chamada pelo migrador.

## Arquivos acrescentados nesta missão

- `.dockerignore`: exclui credenciais locais e resíduos do contexto Docker.
- `.github/workflows/builder-backup-homologation.yml`: execução isolada, sem deploy.
- `frontend/scripts/fixtures/project-sync-qa.sql`: entitlement exclusivo do banco descartável.
- `frontend/scripts/test-project-sync-supabase.mjs`: suíte preparada para Auth/REST/Builder reais, com trava de loopback.
- `frontend/scripts/test-project-sync-browser.mjs`: os sete cenários de perfis Chromium executados localmente.
- `ops/builder-backup-readonly-inventory.js`: inventário de leitura para a origem pessoal do Chrome.
- `docs/builder-backup-homologation-20261104.md`: este relatório.

`frontend/package.json` recebeu dois comandos opcionais de homologação, sem dependências novas. O relatório anterior recebeu um link para o resultado atual. Os arquivos de aplicação, a migração e o Dockerfile permanecem como no commit auditado.

## Ambiente isolado e bloqueio externo comprovado

Foi preparado `.github/workflows/builder-backup-homologation.yml`, limitado à branch de trabalho, com permissões `contents: read`, checkout sem credenciais persistentes e job condicionado a repositório público. Usa runner Linux padrão; não usa runners maiores, segredos do repositório nem upload de artifacts. A documentação do GitHub informa gratuidade de runners padrão em repositórios públicos: [referência oficial](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job).

O fluxo prepara Supabase CLI **2.81.3** fixado, inteiramente local no runner, copia somente a migração nova, cria uma tabela de entitlement para usuários sintéticos e obtém somente chaves geradas por essa stack descartável. Os scripts recusam URLs externas: apenas `localhost` e `127.0.0.1` são aceitos. Não há login/link com o Supabase hospedado.

O Dockerfile testado pelo job é exatamente `Dockerfile.railway-frontend`, sem alteração. `.dockerignore` exclui Git, dependências/cache gerados, `.env` e metadados temporários Supabase do contexto de build. O app só seria iniciado no próprio runner, em rede local, sem domínio público.

Execução tentada: [41872124639](https://github.com/dramaflix2026-stack/pagenova-ai/actions/runs/41872124639). Job `126721747602`, zero etapas iniciadas. Anotação exata:

> The job was not started because your account is locked due to a billing issue.

Não há logs de build porque o job não iniciou. A conta não foi desbloqueada, nenhuma forma de pagamento foi alterada e nenhum recurso alternativo pago foi criado. A execução inicial já confirmou esse bloqueio; novos pushes não representam aprovação da infraestrutura.

## Sete cenários de navegador executados

Comando: `npm run test:project-sync:browser`, usando Chromium 153 real e perfis novos em scratch. O executável da dependência existente foi extraído localmente porque o extrator padrão encontrou uma restrição de `chown` neste ambiente. Não foi utilizado o perfil pessoal do Chrome.

1. Gravação real no IndexedDB e backup automático dos módulos originais.
2. F5, mantendo todos os campos desconhecidos do projeto sintético.
3. Dois perfis concorrentes: a tentativa antiga vira conflito e o apontador atual mantém a versão nova.
4. Rede desconectada, gravação local, fechamento do processo e reabertura com o mesmo perfil; fila recuperada.
5. Recuperação no outro perfil com nova chave, mantendo seu projeto original.
6. Servidor confirma a escrita, resposta HTTP é perdida, processo é fechado e reaberto; retry idempotente sem duplicar revisão aceita.
7. Troca da identidade autenticada na fixture: a fila anterior não é enviada para o outro usuário e o original continua íntegro.

**Limite desta evidência:** o navegador, IndexedDB, módulos de cliente e Postgres/WASM são reais; o servidor HTTP e a autenticação são fixtures. Essa execução não certifica Supabase Auth, JWT, PostgREST ou a tela completa do Builder. A suíte adicional `test-project-sync-supabase.mjs` está preparada para cobrir essas fronteiras na imagem Docker e em Supabase local verdadeiros; permanece sem resultado enquanto o runner estiver bloqueado.

## Investigação de build e fontes

A primeira execução reaproveitando `.next` encontrou `Failed to open database / Loading persistence directory failed / invalid digit found in string`. O instalador legado FRIGOLOG também não aceita reaplicar a extração sobre seus próprios arquivos posteriormente modificados pelos patches de build. Foram movidos somente artefatos gerados desta sessão, mantendo os arquivos versionados dos templates.

Uma compilação Next/Turbopack limpa passou com downloads reais das fontes. Depois, `npm run build` inteiro também passou em uma árvore com artefatos gerados limpos. Isso confirma o build local atual, mas não demonstra uma causa única para as falhas anteriores de conexão ao Google. O incidente anterior de rede não foi artificialmente convertido em aprovação: não houve mocks de fontes, substituição de tipografia, alteração de certificados ou `NODE_TLS_REJECT_UNAUTHORIZED=0`.

A comparação com a Railway deve ser feita pelo job Docker ainda bloqueado, não pela soma de testes locais.

## Production preservada e compatibilidade

Leitura remota confirmou o serviço `pagenova-frontend` em `main`, deployment `492dec42-04d9-438d-9ff1-83b43c1df534` em SUCCESS, sem alterações pendentes. O domínio atual não foi modificado. Uma consulta de catálogo confirmou que `pagenova_cloud_projects` e `pagenova_project_revisions` continuam ausentes no Supabase de Production.

O motor universal e os renderizadores não foram alterados nesta missão. A suíte existente de edição universal passou. O formato do backup preserva os campos do template/modelo sem despacho por nicho. Isso não equivale a uma validação visual manual de todos os templates nem a uma chamada real à OpenAI.

## Riscos e pendências que impedem liberação

- **Auth real e REST:** faltam JWT/cookies reais do Supabase, grants via PostgREST e funcionamento do Builder dentro da imagem Docker. O acesso por sessão expirada observado anteriormente não foi contornado.
- **Conta GitHub bloqueada:** o proprietário precisa revisar a situação de faturamento para permitir executar o job. Alternativa: executar o mesmo procedimento em uma máquina local com Docker já disponível, sem contratar cloud.
- **Origem e propriedade de dados legados:** IndexedDB/localStorage são separados por origem. Os registros antigos sem proprietário são atribuídos à primeira conta que os migra; é necessário validar a conta correta e o procedimento para navegadores compartilhados antes da migração real. RLS não identifica retroativamente o proprietário de um registro local sem identidade.
- **Cobertura de conteúdo:** revisões acima de 20 MB, tipos locais não serializáveis e sites acima do limite de blocos precisam de tratamento de assets/chunks ou procedimento próprio. A recusa preserva o original, mas não equivale a backup completo na nuvem.
- **Dependências externas:** URLs de imagens são preservadas, não seus bytes; URLs temporárias podem expirar. A sincronização retoma ao abrir o app e não promete executar rede com o navegador encerrado.
- **OpenAI:** é necessária uma chave exclusiva de QA e orçamento autorizado para uma chamada real usando somente conteúdo sintético. Não copiar a chave de Production nem enviá-la pelo chat. O teste preparado sem chave verifica apenas falha explícita e preservação do projeto.
- **Recuperação segura:** abrir uma revisão em outro dispositivo cria ID novo; não há merge automático. Conflitos permanecem preservados e exigem escolha explícita.

## Procedimento humano exato, sem aprovação simulada

### Para liberar a execução da homologação

1. O proprietário entra no GitHub e revisa a condição de faturamento da conta indicada no run acima. Não é necessário autorizar este agente a pagar ou alterar cobrança.
2. Após resolver a restrição, executar novamente o workflow `Builder backup isolated homologation` na branch de trabalho. Não selecionar `main`, não acrescentar segredos de Production nem domínio público.
3. Conferir resultado final SUCCESS e as etapas: Supabase local, build do Dockerfile, Auth/RLS/REST, Builder e recuperação. Se uma etapa falhar, a homologação continua reprovada até corrigir e repetir.
4. A alternativa em Docker local usa os mesmos comandos do YAML e URLs de loopback. A fixture SQL só pode ser aplicada ao banco descartável iniciado para QA, nunca a um projeto vinculado.

### Para conferir os projetos reais do Chrome sem copiá-los ao ambiente de teste

1. Manter o código atual de Production. No Chrome pessoal, abrir a **origem exata** em que os projetos foram criados (protocolo e hostname, inclusive `www`). Não limpar dados do site.
2. Em `chrome://version`, localizar o caminho do perfil. Fechar o Chrome e fazer uma cópia local de segurança do perfil completo em uma pasta de backup fora do ambiente de QA; reabrir o perfil original. Essa cópia não deve ser carregada no runner, na cloud de teste ou enviada ao agente.
3. Abrir DevTools → Console nessa origem e executar o conteúdo de `ops/builder-backup-readonly-inventory.js`. O script apenas lê registros/versões e gera hashes/chaves; aborta qualquer tentativa de criação/upgrade de banco. Ele não baixa arquivos, não envia dados e **não é um backup**.
4. Guardar o objeto retornado localmente e conferir a contagem de projetos, chaves e avisos `requiresFullProfileBackup`. Compartilhar, se necessário, somente contagens e avisos, sem conteúdo, credenciais ou dados pessoais dos projetos.
5. Não migrar os projetos reais durante esta missão. Depois da homologação completa e de uma autorização futura de liberação, repetir o inventário antes/depois da migração sem editar os originais e comparar os hashes das mesmas chaves. Diferença inesperada impede continuar.

### Para validar o chat de edição

1. No ambiente isolado, usar conta e projeto totalmente sintéticos, com acesso válido pelo fixture local.
2. Configurar uma chave OpenAI exclusiva de QA com orçamento previamente autorizado no ambiente isolado, fora do repositório e do chat.
3. Fazer uma edição que efetivamente chame o provedor, conferir resultado e evidência de chamada, atualizar com F5, reabrir o navegador e recuperar em segundo perfil. Comparar o conteúdo sintético editado; não testar em projetos reais.
4. Não declarar esse teste aprovado com base nos testes determinísticos do motor ou na resposta `IA não configurada`.

## Plano futuro de migração e recuperação

A ordem de uma liberação futura é: homologação real completa → revisão final do PR → inventário local e confirmação da propriedade → migração aditiva revisada → validação de RLS/grants → publicação do código aprovado → conferência de originais e backups. Nenhuma dessas operações de Production foi executada aqui.

Em falha de aplicação, voltar somente o código para o deployment anterior. Manter tabelas, revisões imutáveis, filas e originais. Nunca usar DROP, TRUNCATE, `indexedDB.deleteDatabase()` ou limpeza do navegador como rollback. Recuperar uma revisão como cópia com chave nova e conferir antes de reutilizá-la.

**Recomendação fundamentada:** os testes locais sustentam o desenho de preservação e a recuperação das fixtures, mas as fronteiras Auth/REST/Docker e o procedimento dos projetos reais não foram homologados. Manter o PR em rascunho e Production bloqueada.
