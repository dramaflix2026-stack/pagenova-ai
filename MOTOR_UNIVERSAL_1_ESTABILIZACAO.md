# PageNova AI — Motor Universal 1: estabilização obrigatória

Status: BLOQUEADO PARA NOVOS TESTES DE USUÁRIO até concluir os critérios abaixo. Decisão do proprietário em 2026-11-11.

## Regra permanente de continuidade entre chats
A PageNova possui um **Motor Universal 1** de edição de sites. Quando houver erros de edição, **voltar à estabilização do próprio motor**, não fazer apenas remendos pontuais em templates. Prioridades inseparáveis: (1) edição completa de textos, cores, imagens, seções, ordem, botões, layout, etc. em todos os nichos e modelos; (2) aprendizado contínuo com resultados verificados. Não avançar para testes de usuário antes de concluir e verificar todos os itens abaixo. Preservar templates já aprovados, dados de usuários, sincronização local/nuvem e Production.

## Evidências dos testes 2026-11-11
- Alterar título da Hero: sucesso visual.
- Alterar cores dos botões: resposta de sucesso, resultado visual não comprovado.
- Trocar imagem da Hero por mansão com piscina: falhou com 'não foi possível identificar fotografia real e imagem editável'.
- Adicionar seção antes de depoimentos: falhou com 'Seção de referência não encontrada: s depoimentos'.
- Editar título dos depoimentos: alegou alterar 1 bloco, mas a prévia não comprova.
- Há risco de resposta de sucesso sem persistência ou mudança efetiva.

## Critérios de conclusão (nenhum presumido)
- [ ] Auditar fluxo completo: interpretação, identificação de alvo, plano estruturado, execução, persistência, re-render e resposta.
- [ ] Inventariar os componentes e criar endereçamento semântico universal de todos os elementos editáveis; aliases em português e identificação por intenção, não apenas por string.
- [ ] Implementar edição de texto, estilo, cores, imagens de capa e internas, botões, seções (adicionar/remover/reordenar), mantendo responsividade.
- [ ] Para imagens, resolver o alvo existente, escolher URL real verificável, preservar outras imagens e confirmar atualização renderizada; nunca afirmar sucesso sem resultado.
- [ ] Implementar operações transacionais com validação pós-aplicação, rollback/erro explícito e persistência local + nuvem; verificar F5 e conflito entre dispositivos.
- [ ] Implementar memória de casos de sucesso/fracasso, feedback, recuperação de soluções e métricas; não afirmar que há treinamento de modelo sem pipeline de treinamento real.
- [ ] Construir suíte automatizada de regressão com comandos reais, variantes de template, nichos, desktop/mobile, sem regressões em templates aprovados.
- [ ] Obter resultados medidos e revisar falhas antes de liberar nova rodada de testes; meta de referência >=95% em amostra representativa, não promessa.
- [ ] Validar build, testes e deploy em Production dos serviços pertinentes.

## Política de entrega
Registrar evidência objetiva (arquivo/commit/teste/deploy) para cada item. Não declarar 'finalizado' por ter apenas escrito plano ou alterado componentes isolados. Não solicitar novos testes ao usuário enquanto existir item pendente. Sempre que abrir novo chat, recuperar este documento e retomar Motor Universal 1 primeiro.
