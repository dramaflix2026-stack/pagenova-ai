# PageNova AI — troca segura da landing pública (17/11/2026)

## Estado atual e isolamento
- Domínio oficial: `www.pagenovaai.com.br` e `pagenovaai.com.br` ligados ao serviço Railway `pagenova-frontend`, branch `main`.
- Landing aprovada: `pagenova-landing-teste`, branch `feature/landing-hero-modelo1-20261109`.
- Branch de integração baseada na `main`: `migration/nova-lp-20261117`.
- Backup da homepage anterior: `backup/lp-antiga-pre-migracao-20261117`, referência de origem `1ba0957729dc16fd8f53d7a7fa8c1bf6576e2c8c`.
- Backup da nova LP aprovada: `backup/nova-lp-aprovada-20261117`.
- Esta branch traz somente a rota `/teste` e as artes da nova landing, **sem trocar a homepage** nem alterar backend, banco, autenticação, pagamentos ou domínio.

## Inventário de compatibilidade
- Login: `/login` — preservado.
- Cadastro/teste: `/cadastro?trial=1` — CTAs da nova LP apontam para a entrada atual. A criação real do teste é controlada pela plataforma, não pelo parâmetro de URL.
- Teste grátis: 5 dias; validar na conta de QA se o sistema inicia no primeiro acesso, registra a expiração e respeita os limites existentes.
- Planos: antiga LP divulga quatro ciclos de assinatura Kiwify; nova LP divulga produtos Studio, CRM, Apps e Completo e um montador com links Kiwify. É necessário confirmar produtos, valores, checkouts e webhooks reais **antes de substituir a vitrine**.
- Idiomas: nova LP tem seletores internos PT/EN/ES por query `?lang=`; a plataforma oficial já tem rotas `/en` e `/es`. É necessário planejar URLs canônicas e SEO antes da troca.
- Rastreio: a homepage oficial já inicializa Meta Pixel `1051066844418593`. A nova LP usa `2101736870240618` apenas no serviço de testes. Antes de publicar, definir o pixel correto no domínio oficial e evitar `PageView` duplicado. Verificar consentimento.
- Imagens: variantes desktop/mobile de galeria PT/EN/ES e arte da garantia inglesa incluídas.

## Gates antes da troca na main
1. CI em PR: validação estática de cadastro, login, assets, checagem TypeScript e build Next.js.
2. Preview isolada com a branch de migração; comparar visual desktop/mobile com LP aprovada, links, imagens, idioma, menu, garantia e animações.
3. QA autenticação **sem dados reais**: cadastro com e-mail de teste, confirmação, login/logout, recuperação de senha, trial de 120h e redirecionamento ao app.
4. QA pagamentos: cada checkout em Kiwify, webhook, associação de usuário, assinatura ativa e cancelamento/reembolso, sem compra real de cliente.
5. QA segurança: dados, projetos e contas existentes intactos. Sem novas migrações SQL; nenhuma mudança de DNS, domínio ou integração Railway.
6. SEO: indexação da homepage, canonicals, hreflang, redirecionamentos de `/en` e `/es` e manutenção de rotas antigas.
7. Instrumentação: validação de `PageView` e eventos comerciais no Events Manager, sem duplicação.
8. Apenas após todos os gates aprovados: alterar rota `/` no app atual via commit pequeno e publicar `main`; acompanhar Railway Production.

## Reversão rápida
Se a nova homepage falhar no ambiente oficial, reverter **somente o commit de corte da rota raiz** e republicar o `pagenova-frontend` na Railway. A branch de backup da homepage anterior permite comparação e restauração. Não alterar DNS, backend, banco Supabase ou contas para fazer rollback.

A existência de URLs Kiwify no código não valida a disponibilidade, cobrança, webhook ou provisionamento de acesso.
