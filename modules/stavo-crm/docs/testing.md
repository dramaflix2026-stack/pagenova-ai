# Testes

Três suítes, com exigências diferentes de ambiente.

| Suíte | Comando | Precisa de | Estado nesta entrega |
| --- | --- | --- | --- |
| Unitários | `npm test` | Nada | **140 testes passando** |
| Integração | `npm run test:integration` | MySQL de teste | Escritos (38 casos); **não executados aqui** — sem MySQL neste ambiente |
| E2E | `npm run test:e2e` | App no ar + banco + navegadores | Escritos; exigem ambiente completo |

> Nenhum teste é marcado como `skip` para esconder falha. A suíte de integração
> avisa explicitamente no console quando é ignorada por falta de banco.

---

## 1. Unitários (Vitest)

```bash
npm test           # execução única
npm run test:watch # modo observação
```

Cobrem as regras puras, onde um erro é silencioso e caro:

| Arquivo | O que garante |
| --- | --- |
| `money.test.ts` | Aritmética em centavos; `0.10 + 0.20 = 0.30`; entrada inválida lança erro |
| `time.test.ts` | Dia civil de São Paulo, semana de segunda a domingo, ano bissexto, meses curtos, competências |
| `normalize.test.ts` | Telefone, domínio, nome, endereço, chaves de identidade; unidades em cidades diferentes **não** colidem |
| `links.test.ts` | Instagram/Linktree/diretório ≠ site próprio; `UNKNOWN` nunca é escondido |
| `qualification.test.ts` | Pontuação explicável e determinística, completude, **bloqueio SSRF** |
| `imports.test.ts` | Cabeçalhos, normalização de linha, datas ambíguas, CSV contra formula injection |
| `google.test.ts` | Field mask mínima, ausência de `openNow`, chave só no cabeçalho, paginação sob demanda |
| `auth.test.ts` | Hash scrypt com salt individual, senha fraca recusada, comparação em tempo constante |

**Nenhum consome a API real do Google** — `fetch` é substituído por fixtures e a
chave não existe no ambiente de teste.

---

## 2. Integração (Vitest + MySQL real)

Rodam contra o banco de verdade, com as **mesmas migrações de produção**.

### Preparar

```bash
# 1. Crie um banco EXCLUSIVO para testes (ele é limpo a cada caso)
mysql -u root -p -e "CREATE DATABASE stavo_crm_test CHARACTER SET utf8mb4;"

# 2. Exporte as credenciais
export TEST_DB_HOST=127.0.0.1
export TEST_DB_PORT=3306
export TEST_DB_NAME=stavo_crm_test
export TEST_DB_USER=root
export TEST_DB_PASSWORD=suasenha

# 3. Rode
npm run test:integration
```

No Windows (PowerShell):

```powershell
$env:TEST_DB_HOST='127.0.0.1'; $env:TEST_DB_NAME='stavo_crm_test'
$env:TEST_DB_USER='root'; $env:TEST_DB_PASSWORD='suasenha'
npm run test:integration
```

> **Aviso:** o banco indicado é **apagado** entre os testes. Nunca aponte para
> produção nem para o banco de desenvolvimento.

Sem as variáveis, a suíte imprime instruções e é ignorada — nunca aparece como
aprovada por engano.

### Alternativa rápida: MySQL descartável via Docker

Sem instalar MySQL na máquina:

```bash
docker run -d --name stavo-crm-test-mysql \
  -e MYSQL_ROOT_PASSWORD=testpass123 \
  -e MYSQL_DATABASE=stavo_crm_test \
  -p 33061:3306 \
  mysql:8.4

# aguarde alguns segundos ate o container aceitar conexao, depois:
export TEST_DB_HOST=127.0.0.1 TEST_DB_PORT=33061 TEST_DB_NAME=stavo_crm_test
export TEST_DB_USER=root TEST_DB_PASSWORD=testpass123
npm run test:integration
```

`docker rm -f stavo-crm-test-mysql` remove o container quando terminar; nada
fica em disco fora do volume do container.

> **Historico real (etapa A15 do modulo Sites com IA, 2026-08-29):** esta
> suite nunca tinha rodado contra um MySQL de verdade neste ambiente antes.
> Rodar pela primeira vez (metodo acima) encontrou **9 problemas reais**,
> nenhum visivel so com typecheck/lint/testes unitarios: 7 nos proprios
> fixtures de teste (id de usuario maior que a coluna, FK de usuario nunca
> semeada, id do projeto descartado e recriado localmente, telefone
> duplicado entre dois leads do mesmo teste, tabelas de reuniao fora da
> ordem de limpeza, transicao de status pulada antes de enfileirar um job, e
> uma corrida entre um worker vivo e um teste que tentava forjar um lease
> vencido) e **2 bugs reais de producao**: a publicacao sempre falhava no
> proprio smoke test (a rota publica so serve publicacao ACTIVE, mas o smoke
> test rodava ANTES de ativar) e a coluna `idempotency_key` de
> `lead_events`/`payments` era curta demais para a chave composta que a
> cobranca recorrente realmente gera. Detalhes e correcoes em
> `IMPLEMENTATION_PLAN_SITE_AI.md`, secao "Estado da Etapa A15". A licao:
> rode esta suite contra um MySQL de verdade pelo menos uma vez antes de
> confiar nela — o typecheck nunca teria pego nenhum destes nove problemas.

### O que cobrem

**`crm.test.ts` (20 casos)**

- Migração do zero cria as 8 etapas na ordem correta
- Seed reexecutado não duplica etapas, origens nem motivos
- Mesmo `place_id` nunca cria dois cards
- Mesmo telefone importado duas vezes gera um único card
- Mesma marca em cidades diferentes gera dois leads legítimos
- Lead arquivado também bloqueia duplicata
- **Três follow-ups continuam sendo um primeiro contato** (com 3 tentativas)
- Entrar na coluna Follow-up não registra tentativa
- Primeira resposta registrada uma única vez, mesmo indo e voltando
- Mesma `idempotency_key` não move o card duas vezes
- Etapa esperada divergente devolve `STAGE_CONFLICT`
- `stage_history` guarda todas as passagens, com uma única aberta
- Perda exige motivo e registra uma vez por ciclo
- **Valor pendente não conta como receita**
- Confirmar recebimento transfere o valor e confirma a venda
- Estorno preserva o pagamento original e zera a receita líquida
- Confirmar duas vezes com a mesma chave não duplica pagamento
- Recorrência gera uma cobrança por competência; rodar o job de novo não cria nada
- Cancelar recorrência interrompe cobranças futuras e preserva o passado
- Arquivar não apaga eventos nem financeiro

**`api.test.ts` (18 casos)**

- `/api/health` e `/api/ready` sem sessão e sem segredo
- Rotas internas devolvem `401` em JSON
- Senha errada e e-mail inexistente produzem **a mesma mensagem**
- Cookie de sessão é `HttpOnly` + `SameSite=Lax`
- Logout invalida a sessão
- CSRF: mutação sem cabeçalho ou com token divergente é recusada
- Leitura não exige CSRF
- Erro de validação com `fieldErrors` e `requestId`
- Rota inexistente com `ROUTE_NOT_FOUND`
- **Quota bloqueia a chamada ao atingir o limite**
- Cada SKU tem contador próprio
- **Concorrência: 10 tentativas simultâneas para limite 5 → exatamente 5 passam**
- Backup JSON não contém nenhum segredo
- CSV neutraliza fórmulas

---

## 3. E2E (Playwright)

Exercitam a aplicação real no navegador. **Playwright nunca é usado para extrair
dados do Google.**

### Preparar

```bash
npx playwright install --with-deps

# Aplicação apontando para um banco de TESTE
npm run build
NODE_ENV=production PORT=3000 npm start

# Em outro terminal
export E2E_BASE_URL=http://127.0.0.1:3000
export E2E_EMAIL=stavodigital123@gmail.com
export E2E_PASSWORD='<senha do admin de teste>'
npm run test:e2e
```

Sem `E2E_PASSWORD` a suíte é ignorada com aviso.

### Jornadas cobertas

1. Rota privada redireciona para login **sem loop**
2. Senha errada mostra erro genérico
3. Entrar e sair
4. Criar serviço → criar lead → ver em Selecionados → mover para Contato realizado
   → registrar tentativa e follow-up → Respondeu → negociar → Aguardando pagamento
   → confirmar venda → dashboard atualizado
5. Duplicidade: o mesmo telefone não cria um segundo card
6. Navegação por teclado no quadro
7. **Fluxo móvel "Mover para…" sem arrastar** (projeto `mobile`)
8. Sem chave do Google, a pesquisa explica em vez de quebrar
9. **CRM continua acessível com o Google fora do ar** (rota abortada)

Dois projetos: `desktop` (Chrome) e `mobile` (Pixel 7).

---

## 4. Portões de qualidade

```bash
npm run lint          # ESLint, zero avisos tolerados
npm run typecheck     # TypeScript strict
npm test              # unitários
npm run build         # build de produção
```

Ou tudo de uma vez:

```bash
npm run check
```

Antes de um deploy real, adicione `npm run test:integration` com o banco de teste
configurado.

---

## 5. Checklist manual de produção

Substitui o que os testes automatizados não alcançam sem credenciais reais.
Percorra após cada deploy — a versão detalhada está em
[deploy-hostinger.md](deploy-hostinger.md#11-verificação-pós-deploy).

**Acesso**
- [ ] HTTPS sem aviso de certificado
- [ ] Login funciona; senha errada dá erro genérico
- [ ] Cookie de sessão com `HttpOnly` e `Secure`
- [ ] Logout encerra a sessão
- [ ] Trocar a senha encerra as outras sessões

**CRM**
- [ ] Criar lead manual
- [ ] Arrastar card no desktop
- [ ] "Mover para…" no celular
- [ ] Card com dados incompletos aparece em vermelho
- [ ] Arquivar preserva o histórico

**Google**
- [ ] Pesquisa de uma página; contador sobe em **1**
- [ ] "Carregar mais" consome mais uma
- [ ] Empresa fora do horário continua aparecendo
- [ ] Instagram como site é classificado como rede social
- [ ] WhatsApp rotulado como **não confirmado**
- [ ] Adicionar ao CRM cria o card; repetir mostra "Já está no CRM"
- [ ] Atribuição do Google visível

**Financeiro**
- [ ] Venda pendente aparece em "Aguardando pagamento", **não** em receita
- [ ] Confirmar recebimento move o valor para receita
- [ ] Estorno mantém o lançamento original visível
- [ ] Recorrência gera uma cobrança por competência

**Importação**
- [ ] CSV UTF-8 com duplicata e linha sem telefone
- [ ] Duplicata ignorada, sem alterar o lead existente
- [ ] Revisão preenche **apenas** campo vazio
- [ ] Relatório fecha a soma das linhas

**Resiliência**
- [ ] Reiniciar a aplicação não perde dados
- [ ] Logs sem senha, token ou chave
- [ ] `/api/health` e `/api/ready` respondem
