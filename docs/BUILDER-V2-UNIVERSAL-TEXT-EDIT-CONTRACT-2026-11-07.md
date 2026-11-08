# Builder V2 — Contrato de edição universal de textos

## Regra inegociável

O motor **não contém exceções por nicho**. Todo comando de edição deve ser interpretado como intenção + seção + elemento + índice semântico, preservando o bloco original e suas demais propriedades. Cada renderizador liga seus elementos reais ao contrato e declara slots exibidos que não têm bloco persistido (legado). Não é permitido responder "alterado" quando a modificação não aparece na prévia.

## Contratos implementados

- `src/lib/builder-v2-universal-copy-edits.ts`: interpretação de subtítulo, rótulo do CTA principal e reescrita de parágrafo; validação de ID e isolamento; leitura `universalEditedTextSlot`; persistência de `textExplicit` e `universalCopyOverrides`.
- `src/lib/builder-v2-universal-visible-slots.ts`: registry de lacunas declaradas. O motor não presume que uma posição sem bloco corresponde a um elemento renderizado. Adapters declaram esse vínculo; o primeiro adaptador registrado é o segundo parágrafo de Sobre em TP1 M3. Este registry deve crescer conforme auditoria visual.
- `src/lib/builder-v2-universal-language.ts` e API de chat: roteamento prioritário antes de atalhos de imagens, banners e links. Reescrita por IA é restrita ao único elemento selecionado e validada no cliente antes do histórico/salvamento.
- `src/components/builder-v2-tp1-model3.tsx` e `...-sections.tsx`: consumo do contrato com fallback **para o texto original aprovado** quando não há edição explícita.

## Testes de regressão

```sh
cd frontend
node --experimental-strip-types --test scripts/test-builder-v2-universal-card-edits.mjs scripts/test-builder-v2-universal-copy-edits.mjs
```

Os três prompts exatos dos prints devem passar:
1. "Altere somente o subtítulo da primeira seção ... Não modifique ... imagem..."
2. "Troque o texto do botão principal da capa ... Preserve o link..."
3. "Na seção Sobre a clínica, reescreva o segundo parágrafo ... Preserve o primeiro..."

Não rejeitar o pedido por mencionar foto, URL ou banner em uma **cláusula de preservação**.

## Homologação transversal

Para cada modelo visual M1/M2/M3 das 10 famílias:
- Verificar se o bloco gerado e o elemento renderizado possuem o mesmo ID/slot;
- Alterar primeiro e segundo parágrafos, CTA, título e card sem mudanças fora do alvo;
- Testar CTA com bloco e CTA do header sem bloco;
- Rejeitar destinos não declarados sem salvar;
- Confirmar resultado **visível** em 390/768/1440 px, salvar, atualizar com F5 e recuperar o projeto;
- Preservar cores, fontes, cards, fotos, depoimentos, localização, responsividade e identidade do nicho;
- Repetir após sincronização e edição remota.

**Estado:** implementação inicial na PR #74; o registry não implica que todos os templates já estão integrados. PR #73 (TP1 Model3 preflight) deve reconciliar metadados de override antes de merge. Proibido promover à Production sem testes reais, TypeScript/build e QA autenticado. Os jobs GitHub Actions continuam falhando antes de expor etapas/logs, não marcar PASS.
