# PageNova AI — Memória central do Motor Universal 1

**Decisão do produto (12/11/2026):** o Motor Universal 1 deve incluir, de forma permanente, edição universal, execução atômica de comandos compostos, validação do resultado, memória persistente de testes e aprendizado contínuo orientado por feedback. Esta é uma obrigação de arquitetura, não uma sugestão de teste.

## Escopo e restrições
- 133 nichos, 10 famílias visuais e 3 modelos por nicho; nenhuma melhoria deve depender de um nicho ou template específico.
- Preservar templates e layouts já homologados; alterações no motor devem ser isoladas e cobertas por regressão.
- Não afirmar que uma edição foi aplicada se apenas parte do pedido foi executada; diferenciar alteração efetiva, estado já correto, falha e operação não interpretada.
- Comandos compostos: planejar TODAS as operações, validar escopo e pré-condições, aplicar atomicamente e conferir pós-condições. Se qualquer parte falhar, não persistir sucesso parcial.
- Registrar no Supabase, com isolamento por usuário e RLS: instrução, contexto (nicho/família/modelo), plano, operações, estado anterior e posterior minimizado, validação e feedback explícito aprovado/reprovado.
- Reutilizar apenas experiências aprovadas como exemplos orientadores, com limites de escopo e proteção contra regressões; experiências reprovadas servem como sinais negativos, nunca como regras aprovadas.
- Começar com aprendizado por recuperação de experiências e feedback, auditável; não chamar isso de retreinamento automático de modelo. ML estatístico/fine-tuning somente após dados e avaliações suficientes.
- Privacidade: não guardar dados sensíveis desnecessários, segredos, tokens nem conteúdo de outros usuários; retenção e acesso devem ser controlados.

## Situação dos testes
- Teste 5B aprovado em produção no commit ba241203: título principal e títulos de cards centralizados; descrições à esquerda; ordem preservada.
- Teste 6 reprovado em 12/11/2026: pedido composto para renomear «Nosso Processo Criativo» para «Nosso Método de Criação» e mudar cor dos títulos dos cards para #234638; UI afirmou «1 bloco» mas prévia continuou com título antigo. Corrigir interpretação, execução e validação.

## Sequência de implementação
1. Planejamento e execução transacional de instruções compostas com validação de pós-condições.
2. Persistência segura dos registros de execução e feedback no Supabase.
3. Consulta de experiências aprovadas/reprovadas para orientar novas operações, com controle de versão, avaliação e fallback.
4. Testes de regressão por nicho/família e métricas reais de aprovação; habilitar aprendizado gradualmente.

**Critério de pronto:** código integrado, testes passando, Supabase/RLS verificados, deploy em produção confirmado e testes visuais aprovados. Não confundir documento de arquitetura com implementação concluída.
