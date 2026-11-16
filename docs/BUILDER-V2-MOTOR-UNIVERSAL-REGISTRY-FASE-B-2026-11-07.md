# Builder 2.0 — Fase B: registry paralelo de nichos e modelos

**Base:** `main` (`bb6f8f0023be00fc81360184a38b70eb52a7225f`).  
**Branch:** `feature/builder-v2-template-registry-shadow-20261107`.  
**Referência:** auditoria PR #71.

## O que foi implementado

- Arquivo puro `frontend/src/lib/builder-v2-template-registry.ts`.
- Inventário imutável **derivado** de `BRIEFING_TEMPLATE_FAMILIES`: 10 famílias e os 139 nichos cadastrados (não copia catálogo).
- Três modelos estáticos por família: **417 combinações**, com IDs estáveis `tp{familyId}:static:{01|02|03}` e labels `Modelo 1/2/3`.
- `resolveBuilderV2RegistryRoute(niche, modelId)`: usa **o mesmo** `resolveBriefingFamily` do Builder e preserva a diferença entre correspondência exata e alias/inferência legada.
- `getBuilderV2RegistryFamily` / `getBuilderV2RegistryModel`: recuperação sem fallback implícito para família 1 ou Modelo 1.
- Manifesto inicial de **TP1**: seções *observadas* para cada modelo e capacidade auditada explicitamente como `source-observed`, `partial` ou `not-audited`. Modelo 1 é `mixed-classic-specialized`; Modelos 2/3 são `specialized`. Isso impede declarar suporte universal que o renderer ainda não comprovou.
- Novo teste `frontend/scripts/test-builder-v2-template-registry.mjs`, com matriz 139 × 3, aliases, imutabilidade, diferenças de Estética/Dermatologia, lacunas de capacidade e garantia de funcionamento em paralelo.

## O que NÃO foi modificado

Nenhuma importação do registry na UI, no endpoint de geração/edição, nos renderizadores TP ou no publicador; sem alteração de CSS, fotos, depoimentos, mapa, WhatsApp, dados ou versões existentes. Nenhum deploy de Production.

**Não é migração de contratos em produção.** O registro existe em modo de sombra para comparar decisões antes de trocar o dispatcher. A matriz 417 testa identidade/roteamento, NÃO testa visual, mídia real, IA ou capacidade de edição por modelo.

## Comando de teste

```bash
cd frontend
node --experimental-strip-types --test scripts/test-builder-v2-template-registry.mjs
```

Revisar no PR a conclusão de GitHub Actions. Falhas de job iniciadas sem qualquer etapa (`steps=[]`, `runner_id=0`) não demonstram falha do código e devem ser investigadas no gerenciamento do GitHub Actions antes de interpretar os resultados.

## Próximos passos

1. **Fase B2:** mapear capacidades dos renderizadores TP2–TP10 e 3D, sem atribuir `source-observed` por suposição.
2. **Fase C1:** criar adapter de TP1 com verificação de alterações refletidas na prévia, incluindo texto/imagem, cores, depoimentos, mapa e ordem; erros atômicos se o adapter não suportar a operação.
3. **Fase C2:** conectar o registry em modo `shadow assert` ao dispatcher atual, sem mudar o roteamento; medir divergências, depois avaliar ativação gradual por feature flag.
4. **Fase D:** centralizar geração de seções, conteúdos e imagens baseados nos manifests, preservando variantes e templates aprovados.
5. **Fase E:** homologar **separadamente** o PR #15 de sync; não antecipar merge de dados do usuário.

## Decisões pendentes

- Confirmar se a meta comercial continuará em 133 nichos: o catálogo real tem 139, sem duplicação detectada na auditoria. **Não excluir 6 automaticamente.**
- Dermatologia/Estética: `Dermatologia` está no TP1; `Dermatologia clínica` no TP4. O novo registry não altera essa escolha nem migra sites antigos.
