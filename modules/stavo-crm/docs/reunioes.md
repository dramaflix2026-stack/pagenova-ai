# Reunioes

Agenda interna da plataforma. O usuario cria a sala no Google Meet, cola o
link no agendamento, e a reuniao passa a viver no calendario, no card do lead,
no historico e nos alertas.

Nao ha integracao com a conta Google nesta versao: nenhuma credencial nova, e
o servidor nunca acessa a URL colada.

## Modelo de dados

Migracao: `drizzle/0002_white_pandemic.sql`

### `meetings`

| Coluna | Observacao |
| --- | --- |
| `lead_id` | FK para `leads`, **ON DELETE RESTRICT** |
| `start_at`, `end_at` | Sempre UTC |
| `timezone` | Fuso em que foi marcada; padrao `America/Sao_Paulo` |
| `meet_url` | Ja normalizado pelo dominio, nunca o texto cru |
| `status` | `SCHEDULED` \| `COMPLETED` \| `CANCELED` \| `NO_SHOW` |
| `version` | Concorrencia otimista |

Indices: `(lead_id, status, start_at)` para card e drawer,
`(status, start_at, end_at)` para a janela do calendario e a deteccao de
conflito.

### `meeting_reminders`

Um lembrete por `(meeting_id, meeting_version, offset_minutes)` — indice
unico. Reagendar cria lembretes de uma versao nova e cancela logicamente os
antigos; sem o carimbo de versao, um aviso do horario velho continuaria
elegivel.

### `lead_events`

Ganhou `meeting_id` (anulavel, indexado). Coluna propria em vez de busca
dentro do JSON: "eventos desta reuniao" e consulta do drawer, e filtrar por
payload nao usa indice.

Eventos: `MEETING_SCHEDULED`, `MEETING_UPDATED`, `MEETING_RESCHEDULED`,
`MEETING_CANCELED`, `MEETING_COMPLETED`, `MEETING_NO_SHOW`.

> **Decisao consciente:** nao foi criada uma CHECK constraint para
> `end_at > start_at`. A versao do MySQL da hospedagem nao foi verificada, e
> uma CHECK em servidor que nao a suporta faria a migracao falhar no deploy.
> A regra e garantida no dominio (`assertValidRange`) e coberta por teste.

## Validacao do link

`src/shared/meetings.ts` → `parseMeetUrl`. Arquivo compartilhado: a tela e a
API usam **a mesma funcao**, entao o formulario nunca aceita algo que a API
recusa.

Regras, nesta ordem:

1. `trim`;
2. analise com o parser de URL — nunca `includes`;
3. protocolo exatamente `https:`;
4. hostname exatamente `meet.google.com`;
5. sem usuario/senha embutidos;
6. sem porta explicita;
7. caminho nao vazio (`https://meet.google.com/` sozinho e recusado);
8. fragmento (`#...`) removido antes de persistir.

O backend e a autoridade: `createMeeting`, `updateMeeting` e
`rescheduleMeeting` revalidam mesmo com o schema Zod ja tendo normalizado.

**O servidor nunca busca a URL.** Fazer requisicao para um endereco colado
pelo usuario abriria caminho para SSRF.

## Conflito de horario

Duas faixas conflitam quando `novo_inicio < existente_fim AND novo_fim >
existente_inicio`. Terminar exatamente quando outra comeca **nao** e conflito.

Somente `SCHEDULED` ocupa horario. No reagendamento a propria reuniao e
ignorada.

**Concorrencia:** a checagem roda dentro da transacao com
`SELECT ... FOR UPDATE` sobre a janela. No InnoDB em REPEATABLE READ isso pega
gap lock no intervalo do indice, entao duas requisicoes quase simultaneas nao
conseguem inserir reunioes sobrepostas — a segunda espera e enxerga o
conflito.

## Fuso horario

- Banco: UTC;
- exibicao e formulario: `America/Sao_Paulo`;
- API: ISO 8601 com offset explicito.

A conversao acontece em um unico lugar por camada:
`src/client/lib/meetingTime.ts` no navegador e `src/server/domain/time.ts` no
servidor. O calendario recebe os instantes **uma vez**, com `timeZone` fixo —
converter de novo seria o caminho classico para a reuniao aparecer tres horas
deslocada.

Nunca usar `new Date('AAAA-MM-DD HH:mm')`: essa forma depende do relogio do
navegador.

## Endpoints

| Metodo | Rota | Observacao |
| --- | --- | --- |
| GET | `/api/meetings?start&end&status&leadId&search` | Janela; maximo 120 dias |
| GET | `/api/meetings/upcoming?limit&leadId` | Card, drawer e resumo |
| GET | `/api/meetings/alerts` | Reunioes que pedem atencao |
| GET | `/api/meetings/:id` | Detalhe |
| POST | `/api/meetings` | Agendar |
| PATCH | `/api/meetings/:id` | Conteudo; recusa `startAt`/`endAt` |
| POST | `/api/meetings/:id/reschedule` | Muda o horario da MESMA reuniao |
| POST | `/api/meetings/:id/cancel` | Motivo obrigatorio |
| POST | `/api/meetings/:id/complete` | Resultado opcional |
| POST | `/api/meetings/:id/no-show` | Observacao opcional |
| PATCH | `/api/meeting-reminders/:id` | `READ` ou `DISMISSED` |
| GET | `/api/leads/search?q=` | Autocomplete; minimo 2 letras, teto 20 |

Todas exigem sessao. Mutacoes exigem CSRF, `idempotencyKey` e
`expectedVersion`.

Codigos de erro: `MEETING_NOT_FOUND`, `LEAD_NOT_FOUND`, `LEAD_ARCHIVED`,
`INVALID_MEET_URL`, `INVALID_TIME_RANGE`, `MEETING_IN_PAST`,
`MEETING_CONFLICT`, `INVALID_MEETING_TRANSITION`, `STALE_MEETING_VERSION`,
`LEAD_HAS_FUTURE_MEETINGS`.

## Idempotencia

O log de eventos e a fonte: cada mutacao grava um evento com a chave do
cliente, e `lead_events.idempotency_key` tem indice unico. Reenviar por
timeout ou clique duplo encontra o evento e devolve a reuniao como estava —
sem criar uma segunda.

## Alertas

Integrados a `getAttentionItems`, que alimenta "Precisa da sua atencao" no
painel. **Nao foi criada uma central paralela**: a plataforma so tinha essa, e
duplicar daria duas listas concorrentes para a mesma coisa.

Uma reuniao vira **um** item, com a maior urgencia atual. Os lembretes de 24h
e 1h decidem quando ela entra no radar; nunca geram duas linhas.

Faixas: `NEEDS_OUTCOME` → `IN_PROGRESS` → `WITHIN_HOUR` → `TODAY` →
`TOMORROW` → `THIS_WEEK`.

Faixas criticas (em andamento, menos de 1 hora, vencida sem desfecho) aparecem
mesmo sem lembrete: uma reuniao comecando em 10 minutos nao pode depender de
um aviso ter sido criado.

A tela atualiza a cada 60 segundos e ao voltar o foco. Nao ha cron.

## Arquivamento de lead

Arquivar um lead com reuniao futura e **bloqueado** com
`LEAD_HAS_FUTURE_MEETINGS`. A tela reenvia com `keepFutureMeetings: true`
depois de o usuario confirmar. Nada e apagado em nenhum caminho.

## Migracao

Local:

```bash
npm run db:migrate
```

Producao: a aplicacao aplica as migracoes pendentes ao iniciar
(`AUTO_MIGRATE`, ligado por padrao). Basta reimplantar.

**Antes de migrar em producao:** faca backup do MySQL pelo hPanel.

A migracao 0002 e aditiva — cria duas tabelas e adiciona uma coluna anulavel.
Nenhum dado existente e tocado.

**Rollback honesto:** nao ha script de rollback automatico. Para desfazer:

```sql
DROP TABLE `meeting_reminders`;
DROP TABLE `meetings`;
ALTER TABLE `lead_events` DROP COLUMN `meeting_id`;
DELETE FROM `__drizzle_migrations` WHERE `hash` LIKE '%white_pandemic%';
```

Isso apaga as reunioes. Restaurar o backup e o caminho seguro.

## Fora do escopo desta versao

OAuth com Google, sincronizacao com o Google Agenda, criacao automatica da
sala, convite ao cliente, e-mail, WhatsApp, SMS, push, agenda publica,
recorrencia, multiplos vendedores e exclusao fisica de reuniao.
