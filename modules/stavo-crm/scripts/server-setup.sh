#!/usr/bin/env bash
#
# Sequencia de implantacao executada NO SERVIDOR da Hostinger, via SSH.
#
# Pre-requisitos (feitos antes, no painel):
#   - banco MySQL criado
#   - aplicacao Node.js criada, apontando para dist/server/index.js
#   - variaveis de ambiente configuradas
#   - codigo enviado (GitHub ou ZIP)
#
# Uso:
#   cd ~/domains/SEUDOMINIO/crm
#   bash scripts/server-setup.sh
#
# O script para na primeira falha e NUNCA imprime segredo.

set -euo pipefail

passo() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
ok()    { printf '\033[0;32m    OK: %s\033[0m\n' "$1"; }
erro()  { printf '\033[0;31m    ERRO: %s\033[0m\n' "$1" >&2; exit 1; }

# -----------------------------------------------------------------------------
passo "1/7 Verificando o ambiente"

command -v node >/dev/null 2>&1 || erro "Node.js nao encontrado no PATH."

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 22 ] || erro "Node $NODE_MAJOR encontrado. A aplicacao exige Node 22 ou superior."
ok "Node $(node -v)"

[ -f package.json ] || erro "package.json nao encontrado. Voce esta na raiz da aplicacao?"
ok "Raiz da aplicacao confirmada"

# Confere as variaveis obrigatorias SEM revelar os valores.
faltando=""
for var in NODE_ENV DB_HOST DB_NAME DB_USER DB_PASSWORD SESSION_SECRET APP_URL; do
  if [ -z "${!var:-}" ]; then faltando="$faltando $var"; fi
done
[ -z "$faltando" ] || erro "Variaveis ausentes no ambiente:$faltando"
ok "Variaveis obrigatorias presentes"

[ "${NODE_ENV}" = "production" ] || erro "NODE_ENV deve ser 'production' (atual: ${NODE_ENV})."
case "${APP_URL}" in
  https://*) ok "APP_URL usa HTTPS" ;;
  *) erro "APP_URL precisa usar https:// (atual comeca com outro esquema)." ;;
esac

if [ "${#SESSION_SECRET}" -lt 32 ]; then
  erro "SESSION_SECRET tem menos de 32 caracteres."
fi
ok "SESSION_SECRET com tamanho adequado"

# -----------------------------------------------------------------------------
passo "2/7 Instalando dependencias"
npm ci --omit=dev --no-audit --no-fund 2>&1 | tail -3 || erro "Falha em npm ci."
# As devDependencies sao necessarias para compilar; instala tudo em seguida.
npm ci --no-audit --no-fund 2>&1 | tail -3 || erro "Falha em npm ci (completo)."
ok "Dependencias instaladas"

# -----------------------------------------------------------------------------
passo "3/7 Compilando"
npm run build 2>&1 | tail -5 || erro "Falha no build."
[ -f dist/server/index.js ] || erro "dist/server/index.js nao foi gerado."
[ -f dist/client/index.html ] || erro "dist/client/index.html nao foi gerado."
ok "Frontend e backend compilados"

# -----------------------------------------------------------------------------
passo "4/7 Aplicando migracoes"
echo "    Faca backup do banco antes, se ele ja tiver dados."
npm run db:migrate || erro "Migracoes falharam. NADA a seguir foi executado. Restaure o backup."
ok "Schema aplicado"

# -----------------------------------------------------------------------------
passo "5/7 Seed (idempotente)"
npm run db:seed || erro "Seed falhou."
ok "Etapas, origens, motivos e preferencias no lugar"

# -----------------------------------------------------------------------------
passo "6/7 Administrador"
if [ -n "${ADMIN_INITIAL_PASSWORD:-}" ]; then
  npm run admin:bootstrap || erro "Bootstrap do administrador falhou."
  ok "Administrador verificado (a senha nao foi exibida)"
else
  echo "    ADMIN_INITIAL_PASSWORD ausente."
  echo "    Se o administrador ja existe, isso esta correto."
  echo "    Se ainda nao existe, defina a variavel e rode: npm run admin:bootstrap"
fi

# -----------------------------------------------------------------------------
passo "7/7 Conferencia final"
npm audit --omit=dev 2>&1 | tail -2 || true

if grep -rlE "AIza[0-9A-Za-z_-]{20,}" dist/client/ >/dev/null 2>&1; then
  erro "Uma chave de API foi encontrada no bundle do cliente. NAO publique."
fi
ok "Nenhuma chave de API no bundle do cliente"

printf '\n\033[1;32mPreparacao concluida.\033[0m\n\n'
echo "Proximos passos, no painel da Hostinger:"
echo "  1. Inicie (ou reinicie) a aplicacao Node.js."
echo "  2. Abre ${APP_URL}/api/health   -> deve responder {\"status\":\"ok\"}"
echo "  3. Abre ${APP_URL}/api/ready    -> deve responder {\"database\":\"ok\"}"
echo "  4. Faca o primeiro login."
echo "  5. REMOVA ADMIN_INITIAL_PASSWORD do painel e reinicie."
echo ""
echo "Checklist completo: docs/deploy-hostinger.md (secao 11)."
