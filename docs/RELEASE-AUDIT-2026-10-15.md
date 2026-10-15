# Auditoria PageNova AI — 15/10/2026

Este documento registra a rodada de estabilização, as alterações confirmadas no código e as limitações que ainda exigem validação real. **Build aprovado não equivale a teste de uma compra, geração ou publicação real.**

## 1. Kiwify, login e créditos

- Webhook assinado com HMAC-SHA1, validação de status pago, bloqueio de produtos fictícios e tratamento de reembolso/chargeback e renovação no código.
- Novas opções de variáveis de assinatura por produto: `KIWIFY_WEBHOOK_TOKEN_MONTHLY`, `_PRESALE`, `_QUARTERLY`, `_SEMIANNUAL`, `_ANNUAL`. O token global é mantido como fallback até migrar cada integração.
- **Não expor os tokens em logs, arquivos ou mensagens.** Configurar cada segredo na Vercel em Production, testar os webhooks reais correspondentes e só depois retirar o segredo global.
- No Supabase, o pedido legítimo antigo pago de setembro teve um ciclo ativo criado de forma idempotente. Verificação: três acessos ativos, três ciclos ativos, zero assinaturas ativas sem ciclo correspondente.
- Pendente: testar compra, renovação, cancelamento, reembolso e chargeback com eventos reais de **cada** plano (mensal, pré-venda, trimestral, semestral, anual); validar registro da conta, confirmação e recuperação de senha.

## 2. Gerador de sites e editor

- O Site AI do CRM já dispõe de validação de plano, renderer compartilhado, recuperação de imagens, histórico de versões e publicação.
- Edição por seção no CRM **ainda utiliza OpenAI** e tem custo estimado. Foi adicionado `generationLimiter` à rota de edição; isso reduz abuso, mas não elimina o custo.
- O editor do importador agora salva no IndexedDB além de usar sessionStorage como fallback. Publicação gera HTML saneado com CSP sandbox, rota pública `/c/[slug]` e link de visualização.
- Pendente: medir geração e edição, preservar imagens em preview e publicação, testar upload, drag/resize, desktop/mobile, acessibilidade, custom domain e regressão por template.

## 3. Gerador de eBooks

- Biblioteca de 50 receitas com ingredientes e modo de preparo; planos culinários geram 50 receitas + páginas editoriais, com verificação de itens e fotos irrelevantes bloqueadas.
- A geração de guias gerais usa templates locais. Ela **não** compõe livros factuais livres sobre qualquer assunto com qualidade de modelo generativo.
- Pendente: gerar e inspecionar PDF real de 54 páginas, pesquisar overflow da tipografia e validar exportação em Android/Desktop; ampliar bases editoriais por gênero; não prometer imagens para todas as receitas enquanto não houver acervo próprio e licenciado.

## 4. Clonador

- `/api/cloner/analyze` implementado: URL HTTPS pública, controle de tamanho, extração de HTML, reconstrução editável e limpeza de scripts externos.
- Frontend agora usa rota autenticada da própria PageNova e grava projeto no IndexedDB.
- Editor recebeu publicação e link de visualização; `/api/cloner/publish` envia HTML saneado ao storage privado; `/c/[slug]` serve a versão publicada com CSP de sandbox e scripts bloqueados.
- Esse MVP importa estrutura e conteúdo, **não** reproduz pixel a pixel o design de qualquer site.
- Foi adicionada a conexão HTTPS ao IP público previamente validado para mitigar rebinding DNS. Pendente: teste E2E com URLs públicas autorizadas; redirecionamentos, imagens, edição, publicação e validação de segurança sob volume.

## 5. Landing Pages, Formulários e Quizzes

- Landing: presets locais, correções de contraste e textos; publicação em `/lp/`.
- Formulários: reconhecimento local adicional de Instagram, faturamento, investimento disponível, cidade, profissão e site; publicação `/f/`.
- Quizzes: até 15 perguntas distintas sem repetição textual automática das primeiras seis; publicação `/q/`.
- Pendente: teste de captura de lead, consentimento, validações, antifraude e responsividade em cada publicação. Não anunciar IA geradora livre nos módulos locais.

## 6. CRM + Google Places

- Endpoint de buscas com `googleRateLimit`, histórico sem reconsulta e captura de leads explícita.
- Cache de detalhes no cliente por 5 minutos evita parte das consultas repetidas.
- Pendente: testes reais de pesquisa, detalhes, consumo de Google Places, importação CSV e vinculação de leads/site com contas de teste; não realizar varreduras pagas não autorizadas.

## 7. Aplicativos e Sistemas

- Mantidos modelos iniciais Expo/React Native e Next.js em modo sem API paga.
- Navegação e interface agora os identificam como **Protótipos**; não prometer código arbitrário, app store ou hospedagem automática.
- Pendente: homologar ZIP e builds de cada template, definir eventual produto avançado com provedores/infraestrutura e orçamento próprios.

## 8. Custos, segurança e testes finais

- Código contém reserva e liquidação de créditos para geração de sites e páginas de busca; PDFs, histórico e edição visual não entram no mesmo medidor.
- A edição por IA no CRM e a análise de anexos de sites podem usar OpenAI e precisam de **limite financeiro separado**. `PAGENOVA_CREDITS_ENFORCE` deve ser validado em Production, pois o fallback no código é desativado quando a variável está ausente.
- O script `scripts/validate-platform.mjs` foi criado para regressão estática e separado do build obrigatório após uma falha inicial. O workflow `.github/workflows/pagenova-quality.yml` executa esse script e o teste de eBooks isoladamente; acompanhar o resultado da ação antes de declarar esse teste aprovado.
- A conexão Vercel usada nesta auditoria não autorizou leitura direta de deployments ou segredos (403). Validar por status GitHub/Railway e testes no painel autorizado.

## 9. Esteira comercial — PROPOSTA, NÃO IMPLEMENTADA

O produto pago mais forte atualmente é a assinatura PageNova AI (R$147/mês). Proposta inicial, sujeita a análise de CAC, despesas de infraestrutura, churn e ticket por canal:
1. Entrada **Formulário + Quiz**: testar R$27–R$47 uma vez, com escopo/quantidades e suporte simples.
2. Order bump **Landing Page local**: testar +R$27–R$47 com modelo pré-definido e publicação.
3. Upsell **Assinatura PageNova AI**: manter referência R$147/mês, com limites por ciclo claramente visíveis.
4. Upsell opcional **Clonador**: só após testes E2E e confirmação de custo, direitos de uso e limitações técnicas.
5. Retenção: e-mail de onboarding, primeiro projeto guiado, uso de créditos, renovação e resgate de projetos.

**Ainda não criar checkouts distintos nem entitlements para ofertas avulsas**, pois o modelo atual de acesso está ligado ao produto `pagenova-ai`. Primeiro mapear contratos de acesso, limites, entrega, reembolso e custos dos SKUs.

## Matriz de homologação (obrigatória para fechar a rodada)

- [ ] Compra real mensal -> cadastro -> login -> primeiro uso -> renovação -> créditos.
- [ ] Pré-venda e planos trimestral, semestral e anual via webhooks com segredos isolados.
- [ ] Reembolso, chargeback e reenvio idempotente sem reativação indevida.
- [ ] Geração e publicação de site Studio/CRM em desktop/mobile, upload e edição visual sem perda.
- [ ] Livro de 50 receitas exportado em PDF, 50 fichas distintas e 54 páginas sem recortes.
- [ ] Clonador: importar -> editar -> salvar -> publicar -> abrir link público.
- [ ] Formulário: publicar -> enviar resposta -> ver lead; Quiz: publicar -> responder -> resultado -> capturar lead.
- [ ] CRM: Google Places (uma pesquisa controlada), importação de CSV, geração de site vinculada ao lead.
- [ ] Apps/Sistemas: exportar ZIP -> instalar dependências -> compilar protótipos.
- [ ] Validação de custos e chamada de API por usuário/ação; regressão automática e logs de erro.
