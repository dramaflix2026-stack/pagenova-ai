# Builder 2.0: backup automático e recuperação segura

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

`npm run test:project-sync`: **10 testes aprovados**. IndexedDB via fake-indexeddb; SQL real via Postgres/WASM (PGlite); handlers de API reais transpilados com adaptador de autenticação/banco simulado.

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
| Build completo `npm run build` | Aprovado: 311 testes Node em 24 execuções, além dos validadores/runtime existentes e compilação Next.js |
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
