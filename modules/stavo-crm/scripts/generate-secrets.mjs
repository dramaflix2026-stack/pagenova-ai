/**
 * Gera os segredos do deploy em um arquivo LOCAL, fora do Git.
 *
 * Os valores nao sao impressos no terminal de proposito: o historico do shell
 * e o log da sessao ficariam com os segredos. Eles vao para um arquivo que voce
 * abre, copia para o painel da Hostinger e depois apaga.
 *
 *   node scripts/generate-secrets.mjs
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';

const secret = (bytes) => randomBytes(bytes).toString('base64url');

const arquivo = `deploy-secrets.${new Date().toISOString().slice(0, 10)}.txt`;

const conteudo = `# =============================================================================
# SEGREDOS DO DEPLOY - Stavo Digital
# Gerado em ${new Date().toISOString()}
#
# COMO USAR
#   1. Abra este arquivo.
#   2. Copie cada valor para o painel de variaveis de ambiente da Hostinger.
#   3. APAGUE este arquivo depois de configurar.
#
# Este arquivo esta no .gitignore e NUNCA deve ser enviado ao GitHub,
# colado em chat, e-mail ou mensagem.
# =============================================================================

SESSION_SECRET=${secret(48)}
CRON_SECRET=${secret(32)}

# -----------------------------------------------------------------------------
# Sugestao de senha inicial do administrador.
# Use esta ou escolha a sua (minimo de 12 caracteres, com variedade).
# Ela e TEMPORARIA: apos o primeiro login, remova ADMIN_INITIAL_PASSWORD
# do painel e reinicie a aplicacao.
# -----------------------------------------------------------------------------

ADMIN_INITIAL_PASSWORD=${secret(12)}

# -----------------------------------------------------------------------------
# Os valores abaixo VOCE preenche no painel da Hostinger / Google Cloud.
# Eles nao podem ser gerados aqui.
# -----------------------------------------------------------------------------

# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=uXXXXX_stavo_crm
# DB_USER=uXXXXX_stavo
# DB_PASSWORD=<senha do banco criada no hPanel>
# GOOGLE_MAPS_API_KEY=<chave restrita criada no Google Cloud>
# APP_URL=https://crm.seudominio.com.br
`;

writeFileSync(arquivo, conteudo, { encoding: 'utf-8', mode: 0o600 });

console.log(`Segredos gravados em: ${arquivo}`);
console.log('');
console.log('Os valores NAO foram exibidos aqui de proposito.');
console.log('Abra o arquivo, copie para o painel da Hostinger e apague em seguida.');
console.log('');
console.log('Nunca cole esses valores em chat, e-mail ou mensagem.');
