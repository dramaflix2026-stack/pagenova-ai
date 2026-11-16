# MVP Vendedor IA PageNova → Convya

## Escopo desta alteração

A PageNova **não** muda o mecanismo universal de edição, seus modelos, o CRM, a geração de sites ou o publicador existente.

No Builder V2, quando há um `site.publishedUrl` e a flag `NEXT_PUBLIC_CONVYA_AGENT_MVP=enabled`, surge **Aprovar site e testar Vendedor IA**.

O clique:
1. pede aprovação explícita do operador;
2. faz `POST /api/convya/handoff` autenticado, sem passar telefone nem dados de lead;
3. o servidor consulta `pagenova_site_publications` por `owner_id` **e** `project_id`; rejeita sites que não estejam publicados;
4. emite uma autorização HMAC-SHA256 de até 10 minutos (nome do site, ID, URL /p/... e expiração);
5. abre a caixa de testes `/whatsapp.html` na Convya, que **revalida** a assinatura e exige senha administrativa.

**Não** existe busca de contatos, disparo em lote, agendamento automático, cobrança ou contato com cliente na PageNova neste fluxo. Apenas uma ação de homologação ligada a um site publicado.

## Configuração para habilitar (após revisão)

No serviço PageNova, adicione:
- `PAGENOVA_CONVYA_HANDOFF_SECRET`: segredo aleatório de **no mínimo 32 caracteres**; o **mesmo** valor no serviço Convya;
- `NEXT_PUBLIC_CONVYA_AGENT_MVP=enabled`: mostra somente o botão de aprovação.

Não coloque essas variáveis no código ou no chat. A API responde 503 sem segredo e a interface não mostra o botão sem a flag.

O serviço Convya precisa de um único `CONVYA_TEST_PHONE` autorizado (seu número), senha admin, WhatsApp Cloud API e OpenAI API configuradas apenas no servidor. Veja o README do repositório `dramaflix2026-stack/convya-ai`.

## Critérios de aceite

- Site não publicado → rejeita a autorização (409).
- Usuário diferente do proprietário → não encontra publicação daquele usuário (409).
- Ausência de segredo → 503 (sem afetar publicação).
- Handoff alterado/expirado → rejeitado na Convya.
- Aprovação não envia mensagem. O primeiro envio real de teste é **manual** pelo operador para o único telefone permitido, depois de opt-in.
- Mensagem recebida do telefone de teste → IA responde dentro da janela de atendimento.
- Solicitação de preço, contrato, pagamento ou humano → agente para e transfere à pessoa; opt-out → pausa.
- Sem resposta recebida, o agente não inicia disparo ou follow-up.

## Status

Implementação proposta em branch isolada; ainda **não** publicada na PageNova Production. Não há evidência de teste ponta a ponta com a Meta porque não estão configurados os tokens e o serviço Convya anterior não foi encontrado na Railway na última inspeção.
