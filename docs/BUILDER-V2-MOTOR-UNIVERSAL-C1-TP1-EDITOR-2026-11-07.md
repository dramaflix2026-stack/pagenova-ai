# Builder 2.0 — Fase C1: conectar o editor ao TP1 Modelo 3

**Base:** PR #72 (registro central), branch isolada `feature/builder-v2-tp1-editor-bridge-20261107`.  
**Escopo:** vínculo de atualizações *explícitas* de blocos ao Modelo 3 TP1, sem reestilizar templates ou migrar bancos.

## Implementado
- `src/lib/builder-v2-tp1-editor-bridge.ts`: localiza blocos por seção e aliases, lê `textExplicit`/`srcExplicit`/`userUploaded`, declara slots efetivamente renderizados e faz `prepareTP1Model3VisibleEdit` atômico.
- `src/components/builder-v2-tp1-model3.tsx`: a Hero passa a consumir alterações explícitas de H1, descrição, CTA (texto/link) e foto sem substituir fotos curadas ou estilos da geração original.
- `src/components/builder-v2-tp1-model3-sections.tsx`: copy e fotos explicitamente editadas para Sobre, Serviços, Diferenciais, Experiência, Galeria, FAQ, Contato, Trajetória e rodapé. Conteúdo original permanece como fallback quando não editado.
- `src/app/app/builder-v2/page.tsx`: antes de registrar histórico/salvar e alegar sucesso nas operações locais, verifica se **todos** os blocos alterados têm um slot representável no TP1 M3. Se qualquer alteração é incompatível, o lote é rejeitado, e o site permanece intacto.
- `scripts/test-builder-v2-tp1-editor-bridge.mjs`: fixtures de edições localizadas, operações inseguras, rollback, FAQ, fotos e isolamento de outros modelos.

## Limites conscientes
1. **Somente o caminho local do editor** (que já é acionado antes dos atalhos legados) passa por esse gate. Respostas remotas da IA e ações de upload que não usam o caminho universal ainda exigem uma segunda etapa de validação.
2. **Mudanças estruturais de seção, estilo/cor global, remoção de cards e ordem de seções** são explicitamente recusadas no TP1 M3 pelo gate local. Não afirmar suporte universal nesses comandos ainda.
3. Os componentes M1 e M2 conservam sua implementação anterior, inclusive regras compartilhadas de contato, mapa, depoimentos e estética. O novo registro continua paralelo, sem participar do dispatcher em Production.
4. `srcExplicit` e `textExplicit` são *metadados locais no bloco* carimbados depois da validação; não são `userUploaded`, não modificam o significado de conteúdo demonstrativo nem inventam endereços ou avaliações.
5. A origem de mídia externa e a existência real do arquivo precisam ser verificadas em QA. URL segura não garante retorno HTTP 200.
6. **Não publicar ou mesclar** antes de TypeScript, build e regressão visual no navegador autenticado.

## Execução
```bash
cd frontend
node --experimental-strip-types --test scripts/test-builder-v2-tp1-editor-bridge.mjs
```
CI continua com falhas de execução antes de iniciar jobs em outras branches, não considerar teste aprovado sem execução real.

## Próximos blocos
- C1.1: marcar e validar também os resultados remotos da IA e os uploads de imagem.
- C1.2: resolver os alvos dos cards por ID semântico, não somente índice.
- C1.3: medir suporte real para remover/adicionar/mover seções e controlar cores com tokens de seção.
- C2: estender o mesmo gate aos Modelos 1 e 2 e depois demais TPs, com fixtures visuais de 390/768/1440 px.
