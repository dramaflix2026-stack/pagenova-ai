# Implantação na Hostinger

Procedimento completo para colocar a aplicação no ar em um plano
**Business Web Hosting** com aplicação Node.js.

---

## 0. Antes de começar — verificações com o usuário

Confirme no hPanel:

1. **A vaga de aplicação Node.js está livre?**
   Se estiver ocupada por outro projeto, **pare aqui**. Não migre para Vercel nem
   troque a arquitetura sem decidir isso conscientemente.
2. **Qual domínio ou subdomínio** será usado (ex.: `crm.seudominio.com.br`).
3. **A versão do Node é 22 ou superior?**

Tenha em mãos (e **nunca** coloque em arquivo versionado):

- credenciais do MySQL criado na Hostinger;
- a chave restrita da Google Places API;
- a senha inicial escolhida para o administrador.

---

## 1. Banco de dados

No hPanel → **Bancos de Dados MySQL**:

1. Crie um banco (ex.: `uXXXXX_stavo_crm`).
2. Crie um usuário com senha forte e conceda **todos os privilégios** nesse banco.
3. Anote host, porta, nome, usuário e senha.

> Em geral o host é `localhost`. Se a Hostinger indicar um host remoto, use o
> valor exibido no painel e ative `DB_SSL=true` se a hospedagem exigir.

---

## 2. Aplicação Node.js

No hPanel → **Avançado → Node.js**:

| Campo | Valor |
| --- | --- |
| Versão do Node | **22** (ou superior) |
| Modo | Production |
| Raiz da aplicação | ex. `domains/seudominio.com.br/crm` |
| URL da aplicação | o domínio/subdomínio escolhido |
| Arquivo de inicialização | `dist/server/index.js` |

---

## 3. Enviar o código

**Opção A — GitHub privado (recomendado)**

```bash
git init
git add .
git commit -m "Versão inicial"
git remote add origin git@github.com:SEU_USUARIO/stavo-crm.git
git push -u origin main
```

No hPanel, conecte o repositório privado e faça o deploy.

**Opção B — ZIP**

Compacte o projeto **sem** `node_modules`, `dist` e `.env`, e envie pelo
Gerenciador de Arquivos.

> Confirme que `.env` **não** foi enviado. Ele está no `.gitignore` por segurança.

---

## 4. Variáveis de ambiente

No painel de variáveis da aplicação Node (**nunca** em arquivo versionado):

```
NODE_ENV=production
HOST=0.0.0.0
APP_URL=https://crm.seudominio.com.br
APP_NAME=Stavo Digital
APP_TIMEZONE=America/Sao_Paulo
TRUST_PROXY=true

DB_HOST=localhost
DB_PORT=3306
DB_NAME=uXXXXX_stavo_crm
DB_USER=uXXXXX_stavo
DB_PASSWORD=<senha do banco>
DB_SSL=false

SESSION_SECRET=<48 bytes aleatórios>
ADMIN_EMAIL=stavodigital123@gmail.com
ADMIN_INITIAL_PASSWORD=<senha inicial — TEMPORÁRIA>

GOOGLE_MAPS_API_KEY=<chave restrita>
GOOGLE_PLACES_LANGUAGE=pt-BR
GOOGLE_PLACES_REGION=BR
GOOGLE_TEXT_SEARCH_MONTHLY_HARD_LIMIT=900
GOOGLE_DETAILS_MONTHLY_HARD_LIMIT=900
GOOGLE_USAGE_WARNING_PERCENT=80

CRON_SECRET=<32 bytes aleatórios, opcional>
LOG_LEVEL=info

# Sites com IA -- ver secao 14. Sem ANTHROPIC_API_KEY o modulo fica
# BLOQUEADO (nao mock, nao quebrado): SITE_AI_ENABLED continua controlando
# se o menu aparece.
SITE_AI_ENABLED=false
SITE_AI_MOCK_MODE=false
ANTHROPIC_API_KEY=<chave da Anthropic, opcional ate ligar o modulo>
# So se a chave for "multi-workspace" (ver secao 14 abaixo):
ANTHROPIC_WORKSPACE_ID=
PUBLIC_SITES_BASE_URL=https://crm.seudominio.com.br
SITE_PUBLIC_ASSETS_DIR=storage/sites
SITE_ASSETS_DIR=storage/site-assets
SITE_AI_MONTHLY_BUDGET_USD=50
```

Gere os segredos:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> `PORT` é definido pela Hostinger. A aplicação usa `process.env.PORT`
> automaticamente — **não** defina manualmente.

> `TRUST_PROXY=true` é necessário atrás do proxy reverso, para que o cookie
> `Secure` e o IP de rate limit funcionem corretamente.

**A aplicação recusa iniciar** em produção se `SESSION_SECRET` for fraco/ausente,
se `DB_PASSWORD` estiver vazio ou se `APP_URL` não usar HTTPS. A mensagem de erro
diz exatamente o que corrigir.

---

## 5. Instalar, compilar e preparar

No terminal SSH da Hostinger, dentro da raiz da aplicação:

```bash
npm ci
npm run build
npm run db:migrate
npm run db:seed
npm run admin:bootstrap
```

O que cada passo faz:

| Comando | Resultado |
| --- | --- |
| `npm ci` | Instala exatamente o que está no `package-lock.json` |
| `npm run build` | Gera `dist/client` e `dist/server/index.js` |
| `npm run db:migrate` | Cria as 32 tabelas. **Para na primeira falha.** |
| `npm run db:seed` | Etapas, origens, motivos e preferências (idempotente) |
| `npm run admin:bootstrap` | Cria o administrador. Idempotente; recusa substituir usuário existente. A senha nunca é exibida. |

---

## 6. Primeiro acesso e remoção do segredo de bootstrap

1. Inicie a aplicação pelo painel.
2. Acesse `https://crm.seudominio.com.br` e faça login.
3. **Remova `ADMIN_INITIAL_PASSWORD`** do painel de variáveis.
4. **Reinicie** a aplicação.

Enquanto a variável existir, a aplicação registra um aviso no log e a tela de
Configurações → Segurança mostra um alerta.

---

## 7. Domínio, HTTPS e cookies

1. Aponte o domínio/subdomínio para a aplicação Node no hPanel.
2. Ative o **SSL gratuito** (Let's Encrypt) e aguarde a emissão.
3. Force HTTPS.
4. Confirme que `APP_URL` usa `https://`.

Em produção a aplicação envia cookies `HttpOnly` + `Secure` + `SameSite=Lax`,
`Strict-Transport-Security` e uma Content-Security-Policy restritiva.

---

## 8. Google Cloud

1. Crie um projeto no Google Cloud Console.
2. Ative a **Places API (New)**.
3. Associe uma conta de faturamento e cadastre um cartão.
   > É a conta de cobrança do **uso da API**, não faturamento da empresa.
   > Pode ser pessoa física, com CPF. A aplicação não exige CNPJ.
4. Crie a chave e **restrinja à Places API (New)** e ao IP do servidor.
5. Defina **quotas diárias** por SKU.
6. Crie um **alerta de orçamento**.

Mantenha os limites internos de 900/SKU como proteção primária. O alerta do Google
apenas avisa; ele **não** interrompe consumo.

---

## 9. Cron (opcional)

O sistema **não depende** de cron: a manutenção roda ao abrir o dashboard ou o
financeiro, e se recupera sozinha se ficar meses sem executar.

Para agendar mesmo assim, no hPanel → **Cron Jobs**, diariamente:

```bash
cd ~/domains/seudominio.com.br/crm && /usr/bin/node -e "fetch('https://crm.seudominio.com.br/api/jobs/recurrences',{method:'POST',headers:{'x-cron-secret':process.env.CRON_SECRET}}).then(r=>r.text()).then(console.log)"
```

Sem `CRON_SECRET` definido, o endpoint responde 404 — ele simplesmente não existe.

---

## 10. Backup

1. hPanel → **Backups**: confirme o backup automático diário.
2. Agende uma exportação lógica periódica (Configurações → Exportação → JSON).
3. Guarde as variáveis de ambiente em um gerenciador de senhas, **separado** do
   código.

Detalhes em [backup-restore.md](backup-restore.md).

---

## 11. Verificação pós-deploy

Percorra esta lista **em produção**:

- [ ] `https://crm.seudominio.com.br/api/health` responde `{"status":"ok"}`
- [ ] `https://crm.seudominio.com.br/api/ready` responde `{"database":"ok"}`
- [ ] HTTPS ativo, sem aviso de certificado
- [ ] Login funciona
- [ ] Cookie de sessão tem `HttpOnly` e `Secure` (DevTools → Application → Cookies)
- [ ] Logout encerra a sessão
- [ ] Criar um lead manual funciona
- [ ] Mover o card entre etapas funciona
- [ ] Reiniciar a aplicação **não** perde dados
- [ ] Dashboard carrega
- [ ] Importar um CSV pequeno funciona
- [ ] Pesquisa do Google traz uma página e o contador sobe em 1
- [ ] Card do Google carrega os detalhes ao vivo com atribuição
- [ ] Criar serviço, registrar venda pendente e confirmar pagamento funciona
- [ ] Recorrência gera uma cobrança por competência
- [ ] Exportação JSON baixa e **não contém** segredo
- [ ] Interface utilizável no celular
- [ ] Logs sem senha, token ou chave
- [ ] `ADMIN_INITIAL_PASSWORD` removida do painel

---

## 12. Rollback

**Código**

```bash
git log --oneline -5
git checkout <commit-anterior>
npm ci && npm run build
# reinicie pelo painel
```

**Banco**

Restaure o dump anterior (ver [backup-restore.md](backup-restore.md)).
Migrações não têm `down` automático: em caso de falha, restaure o backup.

**Chave do Google comprometida**

1. Exclua a chave no Google Cloud (efeito imediato).
2. Crie outra com as mesmas restrições.
3. Atualize a variável e reinicie.

**Sessões comprometidas**

```bash
ADMIN_NEW_PASSWORD='<nova senha>' npm run admin:reset-password -- --confirm
```

Isso troca a senha e **revoga todas as sessões**.

**Página de manutenção**

Pare a aplicação pelo painel e publique um `index.html` estático no domínio, ou
use o recurso de página de manutenção do hPanel.

---

## 14. Sites com IA (modulo opcional)

Desligado por padrao (`SITE_AI_ENABLED=false`). Ativar exige tres decisoes:

**1. Chave da Anthropic.** Crie em https://platform.claude.com/settings/keys
(console renomeado; o antigo console.anthropic.com redireciona para lá),
restrita ao minimo de escopo disponivel. Sem ela, com `SITE_AI_ENABLED=true`, o modulo
aparece no menu mas toda geracao retorna "sem credencial configurada" — nunca
finge sucesso. `SITE_AI_MOCK_MODE=true` gera sites de exemplo sem gastar
credito, util para treinar a equipe antes da chave chegar.

Se a chave criada for **pessoal ou de conta de servico ligada a mais de um
workspace** (comum quando a organizacao ja tem varios workspaces no
console), a API recusa toda chamada com
`anthropic-workspace-id is required...` (achado real ao testar uma chave
assim nesta etapa). Duas saidas, escolha uma:
- crie a chave presa a UM workspace so (mais simples, nenhuma variavel extra); ou
- preencha `ANTHROPIC_WORKSPACE_ID` com o id `wrkspc_...` do workspace,
  visivel em **Settings > Workspaces** no console.

**2. Diretorio de armazenamento persistente.** `SITE_PUBLIC_ASSETS_DIR`
(sites publicados) e `SITE_ASSETS_DIR` (fotos enviadas) **precisam sobreviver
a um redeploy**. Se a Hostinger recriar o diretorio da aplicacao a cada
deploy (comportamento nao confirmado neste ambiente — ver `docs/risks.md`),
aponte essas duas variaveis para um caminho fora da arvore de deploy (ex.
`/home/uXXXXX/persistent/sites`) e garanta que o usuario do processo Node
tem permissao de escrita ali. **Teste isto antes do primeiro cliente real**:
publique um site, force um redeploy, confirme que o link continua no ar.

**3. `PUBLIC_SITES_BASE_URL`.** O link que o cliente recebe
(`https://.../p/slug`) usa esta variavel — normalmente a mesma origem do
CRM, ja que a rota publica `/p/:slug` roda no mesmo processo Express. So use
um dominio separado se voce de fato configurar um subdominio/origem
adicional na Hostinger para isso.

Depois de configurar, `npm run db:migrate` aplica as 8 tabelas do modulo (e a
migracao `0005`, que so alarga duas colunas — nunca apaga dado). Nenhuma
migracao deste modulo remove coluna ou tabela existente.

---

## 15. Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| "Configuracao de ambiente invalida" | Segredo ausente ou fraco | Leia a mensagem — ela lista cada variável |
| Aplicação não sobe | Arquivo de inicialização errado | Deve ser `dist/server/index.js`, após `npm run build` |
| `/api/ready` devolve 503 | Credenciais MySQL erradas | Revise `DB_*`; teste o acesso pelo phpMyAdmin |
| Login "não gruda" | Cookie sem `Secure` atrás do proxy | Defina `TRUST_PROXY=true` e `APP_URL` com HTTPS |
| Rate limit disparando cedo | Todos os IPs chegam como o proxy | Defina `TRUST_PROXY=true` |
| Pesquisa devolve "não configurada" | Sem `GOOGLE_MAPS_API_KEY` | Defina a variável e reinicie |
| Chave recusada | Restrição incompatível | Restrinja por **IP do servidor**, não por referenciador HTTP |
| Rotas do SPA dão 404 | Build do frontend ausente | Rode `npm run build` (gera `dist/client`) |
| Datas com um dia de diferença | Fuso incorreto | Confirme `APP_TIMEZONE=America/Sao_Paulo` |
