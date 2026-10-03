# Segurança e privacidade

Revisão transversal da aplicação. Atualize este documento sempre que um controle
mudar.

---

## 1. Modelo de ameaça

Aplicação **privada**, de usuário único, exposta na internet com dados comerciais
e de contato de terceiros.

| Ameaça | Controle |
| --- | --- |
| Acesso não autorizado | Senha forte + rate limit + bloqueio temporário + sessão com expiração dupla |
| Roubo de sessão | Cookie `HttpOnly` + `Secure` + `SameSite=Lax`; apenas o hash do token no banco |
| CSRF | Double submit cookie + validação de `Origin` nas mutações |
| XSS | React escapa por padrão; CSP restritiva; nenhum `dangerouslySetInnerHTML` |
| SQL injection | Queries parametrizadas pelo driver; nenhuma concatenação de SQL |
| SSRF | Bloqueio de IP privado/metadata, validação de DNS, limite de redirects e tamanho |
| Upload malicioso | Extensão + conteúdo validados, limite de tamanho e de linhas, memória apenas |
| Formula injection | Células de CSV iniciadas por `=`, `+`, `-`, `@` recebem apóstrofo |
| Vazamento de segredo | Somente variáveis de ambiente; log redigido; teste verifica o bundle |
| Perda de dados | Arquivamento em vez de exclusão; cancelamento/estorno em vez de delete |
| Estouro de orçamento | Limite interno atômico por SKU, bloqueando antes da chamada |

---

## 2. Autenticação

- **Hash:** `scrypt` nativo do Node (N=32768, r=8, p=1, 64 bytes), salt individual
  de 16 bytes. Sem dependência nativa — portável para hospedagem compartilhada.
- Formato: `scrypt$N$r$p$saltBase64$hashBase64`. Parâmetros versionados; o login
  regrava o hash quando o custo evolui.
- Comparação em **tempo constante** (`timingSafeEqual`).
- Hash malformado ou com custo absurdo é recusado sem lançar erro (proteção contra DoS).
- Senha mínima de **12 caracteres**, recusando valores óbvios e repetitivos.
- **Sem** "esqueci minha senha", SMTP, link mágico, login social ou cadastro.

### Proteção contra força bruta

Duas camadas:

1. **Por IP** — `express-rate-limit`, 20 tentativas / 10 minutos.
2. **Por conta+IP** — persistida em `login_attempts`: atraso progressivo
   (até 2 s) e **bloqueio de 15 minutos** após 8 falhas. A janela expira sozinha
   em 30 minutos sem novas tentativas.

O custo do hash é pago **mesmo quando o usuário não existe**, para que o tempo de
resposta não revele a existência do e-mail. A mensagem é idêntica nos dois casos.

---

## 3. Sessões

| Aspecto | Decisão |
| --- | --- |
| Token | 32 bytes aleatórios (`base64url`) |
| Armazenamento | **SHA-256** do token no banco; o valor bruto só existe no cookie |
| Cookie | `HttpOnly`, `Secure` em produção, `SameSite=Lax`, `Path=/` |
| localStorage | **Nunca** usado para autenticação |
| Expiração por inatividade | 12 h (configurável) |
| Expiração absoluta | 30 dias (configurável) |
| Renovação | `last_seen_at` no máximo uma vez por minuto |
| Logout | Revoga a sessão |
| Troca de senha | Revoga **todas**; o navegador atual recebe uma sessão nova |
| Limpeza | Sessões vencidas removidas pelo job de manutenção |

---

## 4. CSRF e origem

- **Double submit:** cookie `stavo_csrf` (legível pelo JS da própria aplicação)
  precisa bater com o cabeçalho `x-csrf-token`. Comparação em tempo constante.
- Aplicado a **toda** mutação; métodos seguros passam direto.
- `Origin` validado contra `APP_URL` e o host da requisição. Clientes não-navegador
  (cron, CLI) não enviam `Origin` e são tratados à parte.

---

## 5. Cabeçalhos e CSP

Via `helmet`:

```
default-src 'self'      base-uri 'self'        object-src 'none'
frame-ancestors 'none'  form-action 'self'     script-src 'self'
style-src 'self' 'unsafe-inline'               img-src 'self' data:
font-src 'self' data:   connect-src 'self'     manifest-src 'self'
```

- `style-src 'unsafe-inline'` é necessário porque Radix e Recharts aplicam
  estilos inline de posicionamento. **Script inline continua bloqueado.**
- `upgrade-insecure-requests` ativo em produção.
- HSTS: 180 dias, incluindo subdomínios.
- `Referrer-Policy: same-origin`; `X-Powered-By` desativado.
- Rotas privadas enviam `X-Robots-Tag: noindex, nofollow, noarchive` e existe um
  `robots.txt` restritivo — **complemento**, nunca substituto da autenticação.

---

## 6. Segredos

| Regra | Estado |
| --- | --- |
| Nunca no frontend | Verificado por teste sobre o bundle |
| Nunca no Git | `.env` no `.gitignore`; `.env.example` só com nomes |
| Nunca em log | `pino` redige cookie, authorization, senha, token, chaves e `DB_PASSWORD` |
| Nunca em mensagem de erro | O tratador central nunca devolve stack, SQL ou resposta de terceiros |
| Boot seguro | Produção **recusa iniciar** com `SESSION_SECRET` fraco/ausente, `DB_PASSWORD` vazio ou `APP_URL` sem HTTPS |
| Bootstrap temporário | `ADMIN_INITIAL_PASSWORD` gera aviso no log e alerta na interface enquanto existir |

Rotação: ver [google-places.md](google-places.md#rotação) e
[deploy-hostinger.md](deploy-hostinger.md#12-rollback).

> A tela de Configurações mostra apenas **se** a chave do Google está configurada —
> nunca o valor, nem parcialmente.

---

## 7. Entrada e upload

- Todo boundary validado com **Zod**; erro devolve `fieldErrors` por campo.
- Corpo JSON limitado a **512 KB**.
- Upload: apenas `.csv` e `.xlsx`, um arquivo, limite configurável (padrão 10 MB),
  **memória apenas** — nada toca o disco e o caminho nunca vem do usuário.
- Planilha lida como **dados**: fórmulas e macros nunca são avaliadas.
- Limite de linhas (padrão 5.000) evita exaustão de memória.
- O arquivo em memória expira em 30 minutos e é descartado ao concluir a importação.

---

## 8. SSRF

Aplicável apenas à ação **manual** "Localizar Instagram no site".

- Somente `http:` e `https:`
- Bloqueio de `localhost`, `.local`, `.internal`
- Bloqueio de faixas: `0.0.0.0/8`, `10/8`, `127/8`, `169.254/16` (inclui
  `169.254.169.254`), `172.16-31/12`, `192.168/16`, `100.64/10`, multicast,
  e os equivalentes IPv6 (`::1`, `fe80::/10`, `fc00::/7`, `ff00::/8`, IPv4 mapeado)
- **DNS resolvido e validado antes de conectar** e a cada redirecionamento
- Máximo de 2 redirecionamentos
- Timeout de 5 s; resposta limitada a 512 KB
- Não executa JavaScript, não rastreia outras páginas, **não armazena o HTML**

Coberto por testes unitários (`qualification.test.ts`).

---

## 9. Controle de acesso

- Todas as rotas de API exigem sessão, exceto `/api/health`, `/api/ready`,
  `/api/auth/login` e o endpoint de cron.
- Sem sessão, a API responde **401 em JSON**; o frontend redireciona sem loop.
- O endpoint de cron **não existe** quando `CRON_SECRET` não está definido
  (responde 404) e compara o segredo em tempo constante.
- Papéis (`OWNER`/`PARTNER`/`EMPLOYEE`/`SUPPORT`) e capacidades por papel
  chegaram depois do desenho inicial de administrador único — ver
  `src/shared/roles.ts`. Sites com IA usa a capacidade `SITE_AI_MANAGE`
  (`OWNER`/`PARTNER` apenas).

---

## 10. Privacidade

- Coleta apenas o necessário para a operação comercial.
- Contatos e notas ficam atrás de autenticação; nenhuma rota pública os expõe.
- Logs registram método, rota, status, duração e `requestId` — **não** o corpo.
- Metadados de sessão são mínimos: hash do IP e um resumo do user-agent.
- Arquivamento e exportação disponíveis a qualquer momento.
- Finalidade documentada em [/privacidade](/privacidade) e [/termos](/termos).

---

## 11. Resiliência

| Cenário | Comportamento |
| --- | --- |
| Reinício do processo | Nenhum estado crítico em memória; dados sobrevivem |
| Banco indisponível | `/api/ready` devolve 503 sem revelar credenciais; produção não sobe às cegas |
| Google indisponível | Circuit breaker; **o CRM continua funcionando** |
| Quota esgotada | Bloqueio com mensagem explicativa; o restante do sistema segue |
| Upload inválido | Erro tratado; nada é gravado |
| Clique duplicado | `idempotency_key` devolve o resultado original |
| Duas abas abertas | `expected_current_stage_id` → `409 STAGE_CONFLICT`, a tela se atualiza |
| Sessão expirada | 401 em JSON; redirecionamento limpo para o login |
| Migração falha | Para imediatamente; nenhuma etapa seguinte roda |
| Job repetido | Idempotente por construção; unicidade no banco |
| Desligamento | Gracioso, encerrando o pool MySQL; timeout de 15 s como rede de segurança |

---

## 12. Observabilidade

Logs estruturados (`pino`) com nível, timestamp ISO, `requestId`, rota, status,
duração e erro sanitizado. `/api/health` é excluído do log de acesso para não
poluir.

**Nunca registrados:** senha, cookie, token, chave do Google, credenciais do
banco ou conteúdo integral de leads.

Endpoints: `/api/health` (sem tocar o banco) e `/api/ready` (testa o banco sem
revelar nada). O painel de Configurações mostra fuso, ambiente, limites e status
das integrações — sem detalhes secretos.

---

## 13. Sites com IA

Superfície nova, com dois riscos que os outros módulos não têm: o modelo de
IA lê texto de terceiros (o briefing do negócio) e o resultado é publicado
numa **URL sem login**.

- **Injeção de prompt.** O briefing entra no prompt delimitado como dado não
  confiável, com instrução explícita para a IA ignorar qualquer coisa dentro
  dele que pareça comando (`site-plan-v1.ts`, `neutralizeInjection` em
  `site-sanitize.ts`). A IA nunca recebe nem gera HTML/CSS/JS — só um JSON
  validado por Zod (`SiteSchema`), montado em página por um renderer
  determinístico do nosso código.
- **Fatos nunca vêm da IA.** Depoimento, credencial, estatística, preço,
  endereço e telefone só entram no site vindos de `BusinessFacts` — campos
  que o schema da IA nem permite preencher. O linter determinístico
  (`site-linter.ts`) bloqueia qualquer alegação sensível sem essa
  proveniência.
- **CSP em duas zonas.** A rota pública `/p/:slug` tem CSP própria, mais
  permissiva só ali (o `<script>` inline é o runtime que **nós** geramos,
  nunca texto do usuário) — a CSP do CRM autenticado continua intocada.
- **Upload de imagem.** Validação por assinatura binária real (nunca pela
  extensão/MIME declarado pelo navegador), EXIF removido antes de salvar.
- **URL do WhatsApp/Instagram no briefing** passa pelo mesmo sanitizador de
  URL do restante do CRM (bloqueio de host privado, credencial embutida).
- **ZIP de exportação** é varrido depois de montado, procurando por
  `localhost`, `/api/`, e o nome de variáveis de ambiente sensíveis
  (`ANTHROPIC_API_KEY` etc.) antes de ser entregue — ver
  `tests/unit/site-ai-exporter.test.ts`.
- **Publicação sem indexação.** Toda publicação sai com `noindex` e sem
  link de nenhuma página indexável — não existe listagem pública de
  projetos.
- **Fontes vêm do Google Fonts.** É a única requisição externa dos sites
  gerados. A CSP libera exatamente dois domínios (`fonts.googleapis.com`
  para o CSS e `fonts.gstatic.com` para os arquivos), e o nome da família é
  montado a partir de uma lista fechada no código — nunca de texto do modelo
  ou do usuário.
  **Consequência de privacidade:** o navegador do visitante contata um
  servidor do Google, que passa a ver o IP dele. Isso já foi considerado
  tratamento indevido de dado pessoal sob o GDPR na Europa; sob a LGPD o
  risco é menor, mas existe, e a Política de Privacidade do site publicado
  deveria mencionar. Para eliminar a requisição externa, defina
  `SITE_FONTS_SOURCE=none` — o site passa a usar apenas fontes do sistema, e
  perde a identidade tipográfica. Hospedar os arquivos no próprio servidor é
  a terceira opção: basta trocar a implementação de `fontLinkTags`
  (`site-fonts.ts`), sem mexer em mais nada.

---

## 14. Dependências

- **Produção: 0 vulnerabilidades** (`npm audit --omit=dev`).
- `exceljs` foi substituído por `read-excel-file` para eliminar uma cadeia
  vulnerável (`uuid`) — a aplicação só precisa **ler** XLSX, já que a exportação
  é CSV/JSON.
- `multer` fixado em 2.x (a linha 1.x tem vulnerabilidades conhecidas).
- Restam advisories **apenas em dependências de desenvolvimento** (cadeia do
  `drizzle-kit`), que não são embarcadas no runtime de produção.

Rode `npm audit --omit=dev` antes de cada deploy.

---

## 15. Checklist de revisão

- [ ] `npm audit --omit=dev` sem vulnerabilidades
- [ ] Nenhum segredo real no repositório (`git log -p | grep -i "password\|secret\|api_key"`)
- [ ] Bundle do cliente sem valor de chave: `grep -r "AIza" dist/client/`
- [ ] `.env` não versionado
- [ ] `SESSION_SECRET` forte e único por ambiente
- [ ] `ADMIN_INITIAL_PASSWORD` removida após o bootstrap
- [ ] Chave do Google restrita por API e por IP
- [ ] Quotas e alerta de orçamento configurados no Google Cloud
- [ ] HTTPS ativo com HSTS
- [ ] Backup automático confirmado e restauração testada
- [ ] Logs revisados: sem segredo
