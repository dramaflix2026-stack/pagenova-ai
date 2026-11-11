# PageNova AI — contrato obrigatório de continuidade do motor universal

Atualizado: 2026-11-11. **Ler este arquivo ao iniciar qualquer conversa, correção, teste ou deploy do Builder 2.0.** Fonte de verdade operacional no repositório; memória de conversa não substitui versionamento.

## Objetivo inegociável
O motor de edição por linguagem natural deve operar sobre os 133 nichos e seus modelos, sem depender de exceções por nicho. Nunca perder comportamentos homologados; preservar templates aprovados e identidade visual. Não declarar uma edição bem-sucedida apenas porque a rotina retornou sucesso: conferir mudança no elemento efetivamente renderizado, escopo das alterações e persistência após F5. Produção Railway somente após build e QA.

## Contrato de cada operação
1. Interpretar **intenção**, **seção**, **alvo/card**, **propriedade**, **novo valor** e **restrições negativas** (preserve/não altere).
2. Resolver o alvo real no site, incluindo componentes de template dedicados. Se o alvo não existe ou não é editável, rejeitar claramente sem modificar outros elementos.
3. Aplicar um patch mínimo; nunca acionar rotinas de troca em lote quando o usuário pedir uma única imagem. Nunca interpretar 'preserve a fotografia' como comando de troca.
4. Verificar antes/depois, contagem de alvos e efeito no renderer; se a validação falhar, reverter, informar e registrar reprovação.
5. Persistir o estado e testar F5, desktop/mobile. Não mudar imagens, texto, cores ou seções fora do escopo.
6. Registrar comando, nicho, modelo, estado anterior/posterior, resultado automático, aprovação humana, erro e correção; somente **aprovação humana** autoriza exemplo positivo de treinamento.
7. Converter cada falha corrigida em teste de regressão executado em no mínimo dois nichos de famílias diferentes.

## Homologação de 2026-11-11
- Engenharia: mudança de título, cor de seção e descrição individual de card aprovadas. Layout de três cards de Nossa Abordagem, três cards de Compromisso com a Qualidade e quatro cards de Nossa Metodologia aprovado após normalização de estilo. Troca individual de foto teve correção de código, mas **não foi homologada visualmente** após deploy.
- VittaPet veterinária: teste 01 **reprovado** (título da Hero confundido com imagem); teste 02 **aprovado visualmente** (fundo #123C46); teste 03 **reprovado** (terceiro card Serviços não alterado); teste 04 **não executável** (Metodologia sem fotografias); teste 05 **reprovado** (criação de três cards rejeitada). Cabeçalho: nome quebra em desktop e composição mobile inadequada.
- 2026-11-11: commit 9d9ccc0c corrige falso positivo de troca de imagem no atalho veterinário, **ainda sem homologação pós-deploy**.

## Lacunas atuais — não alegar que estão resolvidas
- Existem atalhos específicos de veterinária no page.tsx e rotinas de templates dedicados; precisam ser migrados para operações universais verificáveis.
- O registro `recordEditorLearningEvent` mantém até 150 eventos locais e envia telemetria, mas `outcome=applied` não significa aprovação visual. **Não há comprovação de treinamento automático de modelo de ML**.
- Falta dataset versionado de pares comando/antes/depois/avaliação, teste de regressão cruzada e validação do renderer.

## Próxima ordem de trabalho
1. Corrigir roteamento de edição de título Hero sem afetar foto em todos os nichos.
2. Resolver edição de card específico em templates dedicados; validar alteração realmente renderizada.
3. Criar seção de N cards com títulos exatos, descrições distintas e posição correta; não rejeitar falsamente.
4. Troca individual de imagem com alvo explícito, sem fallback de substituição em lote.
5. Corrigir cabeçalho desktop/mobile VittaPet, mantendo identidade e layout aprovados.
6. Implementar dataset e avaliações de aprovação/reprovação com testes automáticos entre famílias.

## Regras de continuidade entre conversas
Ao retomar: consultar este documento, status GitHub/Railway e último teste homologado. Nunca reiniciar trabalho do zero, sobrescrever aprovações ou afirmar que houve machine learning treinado sem evidência. Atualizar este documento a cada ciclo de homologação.


## Homologação 2026-11-11 — VittaPet e validação entre nichos
- VittaPet teste 01 (título da Hero): APROVADO pelo usuário.
- VittaPet teste 02 (cor de fundo de seção): APROVADO pelo usuário.
- VittaPet teste 03 (terceiro card de Nossos Serviços, título e descrição): APROVADO pelo usuário após commits 6115716b e cff4aec9, deploy Railway de ambos os serviços SUCCESS.
- Teste 04 (troca de imagem específica): PENDENTE; o teste anterior em Nossa Metodologia não se aplicava porque a seção não tinha imagens. Selecionar seção com imagem realmente visível.
- Teste 05 (adicionar seção Nosso Compromisso antes do FAQ com três cards): REPROVADO anteriormente, ainda não retestado.
- Regra de QA: repetir cinco classes de edição em nichos estruturalmente diferentes (imobiliária, gastronomia, educação, varejo etc.), registrar resultado visual, persistência após F5, responsividade e preservação de conteúdo não solicitado.
- Não declarar 'machine learning treinado' sem pipeline real de coleta de feedback, avaliações e treinamento/otimização. O motor atual usa interpretação por IA e regras universais.
- Próxima rodada sugerida: imobiliária de alto padrão; não alterar modelos aprovados sem autorização.
