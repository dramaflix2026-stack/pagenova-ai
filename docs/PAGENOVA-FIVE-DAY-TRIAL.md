# PageNova AI — teste grátis de 5 dias (16/10/2026)

## Oferta

- Duração: 120 horas desde o **primeiro acesso ao painel** com e-mail confirmado.
- Sem cartão e sem cobrança automática.
- 2 gerações iniciais de sites **pelo CRM** (não pela rota legada de IA do Studio).
- 5 páginas de pesquisa Google Places.
- Landing Pages, formulários, quizzes, eBooks locais, edição e histórico disponíveis enquanto o teste estiver ativo.
- Custos extras de IA pagos, reprocessamento/retry, enriquecimento e exports caros do CRM bloqueados durante o teste.
- Checkout mensal existente: https://pay.kiwify.com.br/a13pNpS (R$ 147/mês).
- A assinatura paga com o mesmo e-mail prevalece sobre a avaliação, sem alterar créditos históricos nem apagar projetos.

## Segurança

- Migração em `supabase/migrations/20261016_pagenova_five_day_trials.sql`: duas tabelas privadas, RLS ativado, sem grants públicos; `SECURITY DEFINER` só executável com `service_role`.
- `pagenova_trial_access` só é chamada pelo backend a partir de um usuário Supabase autenticado e com `email_confirmed_at`. Com `p_start=false`, consultar saldo não cria avaliação nova.
- E-mail e owner ID são únicos; reentradas não reiniciam o prazo. Trocar de e-mail de uma conta com teste existente não transfere a avaliação.
- Créditos trial: reserva sob lock, idempotência por operação, estorno em falhas e callback assinado para o estado final dos jobs.
- As reservas do trial **não** dependem de `PAGENOVA_CREDITS_ENFORCE`. A conciliação comercial histórica pendente permanece inalterada.
- `PAGENOVA_TRIAL_ENABLED=0` desabilita acesso a avaliações em caso de emergência. O padrão é habilitado.
- A prevenção cobre reutilização de um e-mail; **não** impede uso de e-mails descartáveis, aliases ou contas diferentes por uma mesma pessoa. Antes de escalar tráfego, habilitar confirmação de e-mail e CAPTCHA/Turnstile no Supabase Auth, além de proteção de bot/rate-limit em CDN.
- O uso de recursos de armazenamento e publicação também deve ser acompanhado; o MVP não impõe um limite total de projetos locais criados.
- Projetos são preservados após expiração. A reativação para edição depende de assinatura; disponibilidade pública de páginas já publicadas exige política comercial separada.
- Segurança de senha vazada: ainda resta aviso do Supabase Auth Advisor, que requer habilitação no painel do projeto.

## Jornadas homologáveis

1. Usuário novo -> cadastro -> confirmar e-mail -> entrar -> ativar automaticamente o teste -> verificar prazo e 2/5 no painel.
2. F5 e segundo login não reiniciam a avaliação.
3. No CRM, gerar 2 sites; terceiro retorna limite gratuito, sem atingir o provedor.
4. Google Places: 5 páginas; sexta bloqueada.
5. Falha de job libera reserva após evento assinado, sem duplicar estorno.
6. API legada de OpenAI, análise visual extra e operações caras de CRM não ficam acessíveis no teste.
7. Terminar 120 horas -> bloquear APIs e mostrar upgrade.
8. Comprar na Kiwify com mesmo e-mail -> entitlement pago passa a prevalecer; projetos continuam vinculados ao workspace.
9. Conta paga antiga não perde acesso e não recebe limites 2/5.

O build Vercel executa `frontend/scripts/test-trial-runtime.mjs` e o gate estático `frontend/scripts/validate-platform.mjs`.

## Pendências para lançamento em massa

- Teste real de cadastro e confirmação e-mail em navegador, incluindo recuperação de senha.
- Teste real de geração do CRM/Google Places com conta de teste (envolve chamadas pagas).
- Ativar proteção contra bots em Supabase Auth (captcha), configuração externa, e testar e-mails descartáveis.
- O funil de disparos comerciais D1/D2/D4/D5/D6 **não foi configurado**: requer serviço de mensagens consentidas e configuração de envio.
- Não há integração automática de cobrança pós-teste; conversão é via checkout Kiwify e webhook pago existente.
