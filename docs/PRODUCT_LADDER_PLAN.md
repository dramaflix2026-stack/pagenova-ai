# PageNova AI — proposta de esteira comercial

**Status: PLANEJAMENTO APENAS.** Nenhuma alteração em checkout, Kiwify, preços ou acesso está autorizada por este documento.

## Princípio
Vender somente capacidades que passaram pela homologação. O importador de HTML não deve ser prometido como clonagem pixel a pixel. O construtor local de Apps/Sistemas entrega starters, não aplicativos prontos para a App Store. Um eBook local é um conteúdo editável e pode exigir revisão factual e editorial.

## Escada sugerida (valores para validação, não ativos)
| Etapa | Produto | Preço proposto | Condição para lançamento |
| --- | --- | --- | --- |
| 0. Demonstração | Modelos demonstrativos de LP / formulário / quiz | Gratuito, limitado e sem coleta real de clientes | Demo protegida e isolada de assinantes |
| 1. Entrada | Pacote de templates + guia de aplicação (download) | R$ 29,90 a R$ 49,90 único | Acervo próprio licenciado e instruções verificadas |
| 2. Order bump | Pack adicional de layouts / checklists | R$ 19,90 a R$ 29,90 único | Pacote entregue automaticamente e sem produto fictício |
| 3. Upsell | PageNova AI assinatura | **R$ 147/mês (preço já definido)** | Jornada Kiwify → login → créditos → geração → edição → publicação homologada |
| 4. Continuidade | Trimestral, semestral e anual | **R$ 397 / R$ 747 / R$ 1.297** (verificar cadastro real na Kiwify) | Tokens e webhooks separados; renovação e cancelamento testados; regra de créditos definida |
| 5. Oferta futura | Importador editável / Clonador, se produto standalone | R$ 49,90 único (hipótese) | Testes de URL, fidelidade, direitos de uso, editor e publicação concluídos |

O valor único do Clonador não dá direito automático ao SaaS de assinatura. Exige um **entitlement** e escopo de produto próprios antes de ser oferecido.

## Regras de margem
- Identificar todos os custos pagos: OpenAI para geração de sites/imagens e eventual edição conversacional, Google Places, Vercel, Railway, Supabase, armazenamento e distribuição.
- Registar custo por organização/projeto/ação, respeitar cotas e idempotência.
- Preço mensal não autoriza chamadas ilimitadas de APIs pagas. Edição manual/local é separada de edição por modelos pagos.
- Nunca consumir créditos por falha de geração; reconciliação e idempotência precisam de prova.
- Definir explicitamente quotas para trimestral, semestral e anual: mensalmente renovadas ou quota única por compra? Não presumir.

## Sequência de conversão proposta
1. Tráfego em caso de uso comprovado, com exemplos reais (não screenshots fictícios de geração perfeita).
2. Demonstração clara dos resultados e suas limitações; formulário de interesse opcional e consentimento.
3. Oferta de entrada com entrega imediata e instrução de aplicação.
4. Order bump opcional e transparente, com preço exibido sem pré-seleção.
5. Upsell PageNova AI com benefícios e limites concretos.
6. Onboarding: confirmar pagamento, criar/recuperar senha, usar 1 crédito em projeto real, editar e publicar.
7. Retenção: lembretes de créditos, melhorias do produto, ciclo de renovação e suporte.
8. Cancelamento: manter período pago conforme contrato; impedir acesso depois da data verificada de expiração. Não tratar cancelamento como reembolso.

## Critérios de go/no-go
- **Bloqueio para tráfego pago em escala:** Kiwify com todos os planos/eventos; monitor de expiração; quota de créditos para todas as licenças e períodos; geração, edição, publicação e leads validados em produção.
- **Bloqueio do Clonador standalone:** edição e publicação sem perda de mídias em pelo menos três páginas de teste autorizadas.
- **Bloqueio dos eBooks premium:** geração sob briefing não culinário, fotos coerentes, PDF A4 sem corte e revisão editorial.
- **Bloqueio de Apps/Sistemas como produto avançado:** implementação de requisitos arbitrários, teste automatizado do código gerado e deploy real.

## Próxima decisão comercial
Definir a regra de **créditos dos planos trimestral/semestral/anual** antes de ligar a régua de renovação. Confirmar os nomes e IDs dos produtos na Kiwify; nunca vincular permissões apenas a semelhança do nome.
