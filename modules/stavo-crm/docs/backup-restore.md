# Backup, restauração e rollback

Os dados comerciais e financeiros são o ativo mais importante da plataforma.
Nada é apagado pelo sistema — mas isso não substitui backup.

---

## 1. Camadas de proteção

| Camada | O que cobre | Frequência |
| --- | --- | --- |
| Backup automático da Hostinger | Arquivos e banco | Diário (confirme no hPanel) |
| Exportação lógica (JSON) | Todos os dados próprios do CRM | Semanal, manual |
| Dump MySQL | Banco completo, restaurável | Antes de cada migração |
| Variáveis de ambiente | Segredos | Gerenciador de senhas, **fora** do repositório |

---

## 2. Exportação lógica pela interface

**Configurações → Exportação**

- **Backup completo (JSON)** — todos os dados próprios em um arquivo.
- **Listas em CSV** — leads, contatos, links, atividades, follow-ups, serviços,
  propostas, vendas, itens, recebíveis, pagamentos, assinaturas, metas e
  histórico de etapas.

### O que a exportação NÃO contém

- Senha ou `password_hash`
- Tokens de sessão
- `SESSION_SECRET`, `GOOGLE_MAPS_API_KEY`, credenciais do MySQL
- Conteúdo transitório do Google

O CSV é protegido contra **formula injection**: células iniciadas por `=`, `+`,
`-` ou `@` recebem um apóstrofo, para que Excel e Sheets não executem nada.

---

## 3. Dump completo do MySQL

**Gerar**

```bash
mysqldump \
  -h "$DB_HOST" -u "$DB_USER" -p \
  --single-transaction --routines --triggers --default-character-set=utf8mb4 \
  "$DB_NAME" > backup-$(date +%F).sql
```

`--single-transaction` gera um dump consistente sem travar a aplicação.

**Restaurar**

```bash
# 1. PARE a aplicação pelo painel
# 2. Restaure
mysql -h "$DB_HOST" -u "$DB_USER" -p "$DB_NAME" < backup-2026-08-21.sql
# 3. Reinicie e valide
curl https://crm.seudominio.com.br/api/ready
```

> Restaurar **sobrescreve** o banco atual. Faça um dump do estado corrente antes,
> mesmo que ele pareça errado — ele pode conter dados que o backup antigo não tem.

Pelo hPanel: **Bancos de Dados → phpMyAdmin → Importar** também funciona para
bancos pequenos.

---

## 4. Testar a restauração

Um backup nunca testado não é um backup.

**A cada três meses:**

1. Crie um banco de teste (`uXXXXX_stavo_teste`).
2. Restaure o dump mais recente nele.
3. Aponte uma cópia local da aplicação para esse banco.
4. Confirme: login, quadro do CRM, dashboard, financeiro.
5. Apague o banco de teste.

Anote a data do último teste bem-sucedido.

---

## 5. Antes de qualquer migração

```bash
# 1. Backup obrigatório
mysqldump ... > pre-migracao-$(date +%F).sql

# 2. Revise o SQL que será aplicado
cat drizzle/000X_*.sql

# 3. Aplique
npm run db:migrate
```

As migrações **param na primeira falha** — nenhuma etapa seguinte é executada.
Se falharem, restaure o backup antes de tentar de novo.

Não existe `down` automático. O caminho de volta é a restauração do dump.

---

## 6. Restauração administrativa a partir do JSON

A primeira versão **não** possui restaurador completo pela interface — importar um
backup lógico por tela seria uma operação destrutiva difícil de tornar segura.

Para reconstruir a partir do JSON exportado:

1. Restaure o **dump MySQL** (caminho preferencial e completo).
2. Se só houver o JSON, use-o como fonte de consulta e reinsira os dados por
   SQL, respeitando a ordem das chaves estrangeiras descrita em
   [data-model.md](data-model.md).

Para migrar leads de outra base, prefira a **importação CSV** da interface: ela
passa por deduplicação e validação.

---

## 6.1 Sites com IA: dois diretórios além do banco

O dump do MySQL cobre as 8 tabelas do módulo (`site_projects` e as demais),
mas **não** cobre os arquivos em disco. Faça backup também de:

- `SITE_PUBLIC_ASSETS_DIR` — o HTML/imagens de cada site publicado; sem isso,
  um restore de banco aponta para publicações cujo arquivo não existe mais;
- `SITE_ASSETS_DIR` — as fotos que o cliente enviou antes de publicar.

Sem esses diretórios, restaurar o banco sozinho deixa o link público
(`/p/:slug`) respondendo 404 mesmo com a linha `ACTIVE` intacta na tabela.

---

## 7. Segredos

Guarde em um gerenciador de senhas, **nunca** no repositório:

- `SESSION_SECRET` — perdê-lo apenas encerra as sessões abertas
- `DB_PASSWORD` — sem ele a aplicação não sobe
- `GOOGLE_MAPS_API_KEY` — pode ser recriada no Google Cloud
- `CRON_SECRET` — pode ser recriado
- Senha do administrador — recuperável pelo [procedimento de reset](admin-password-reset.md)

---

## 8. Retenção sugerida

| Item | Manter |
| --- | --- |
| Backup diário da Hostinger | Conforme o plano |
| Dump antes de migração | 6 meses |
| Exportação JSON semanal | 12 meses |
| Dump mensal arquivado | 24 meses |
