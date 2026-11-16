# PageNova AI — Missão 01: auditoria do motor universal

**Data:** 07/11/2026  
**Base:** `main`, commit `bb6f8f0023be00fc81360184a38b70eb52a7225f`  
**Escopo:** geração, roteamento, edição por IA, renderização, salvamento, publicação e testes do Builder 2.0.  
**Regra:** diagnóstico e testes em branch isolada; nenhuma mudança nos templates aprovados ou em Production.

## Resultado

A PageNova possui componentes universais reais, porém **não há ainda um contrato único, aplicado e comprovado de ponta a ponta para todas as famílias e variantes**. O fluxo combina regras por família, atalhos por nicho, fallback clássico e edição híbrida local/API. Como consequência, um comando de alteração pode modificar o estado `blocks`, mas não necessariamente ser refletido pelo componente especializado que renderiza a página.

### Inventário encontrado

| Família | Nichos cadastrados |
|---|---:|
| TP1 — Beleza e Serviços Premium | 11 |
| TP2 — Engenharia/Corporativo | 15 |
| TP3 — Gastronomia | 14 |
| TP4 — Saúde | 21 |
| TP5 — Marketing/Tecnologia | 15 |
| TP6 — Varejo | 15 |
| TP7 — Imobiliário | 12 |
| TP8 — Hotelaria | 12 |
| TP9 — Automotivo | 12 |
| TP10 — Educação | 12 |
| **Total** | **139** |

O objetivo comercial anterior era **133 nichos**: há uma diferença de **6**. **Não excluir, adicionar ou remapear nichos automaticamente**. `Dermatologia` e `Clínica de estética` estão no TP1; `Dermatologia clínica` está no TP4. Antes de reorganizar Dermatologia, preservar projetos já criados e aprovar uma migração explícita.

- UI principal: `frontend/src/app/app/builder-v2/page.tsx` (~148 KB, 1.491 linhas).
- API principal: `frontend/src/app/api/builder-v2/chat/route.ts` (~129 KB, 1.324 linhas).
- Despacho/renderização: `frontend/src/components/builder-v2-site.tsx` (~446 KB, 2.236 linhas).
- Catálogo/aliases: `frontend/src/lib/briefing-template-families.ts`.
- Operações validadas: `frontend/src/lib/builder-v2-universal-operations.ts`; linguagem: `builder-v2-universal-language.ts`; alvos: `builder-v2-universal-targets.ts`.
- Integração parcial de componentes: `builder-v2-universal-bindings.tsx` e `builder-v2-universal-sections.tsx`.
- Persistência atual: `frontend/src/lib/pagenova-project-store.ts` (IndexedDB) e cache legado localStorage; versões nomeadas via `/api/builder-v2/versions`.
- Backup automático em nuvem: **PR #15 aberto, não mesclado à main auditada**. Contém API `/api/builder-v2/projects`, contratos de sync e migração SQL; requer homologação isolada.
- Publicação: `frontend/src/app/api/builder-v2/publish/route.ts` grava snapshot em Supabase Storage, com índice de publicações.

## Mapa do fluxo real

```text
Seleção de nicho / briefing
  → resolveBriefingFamily() e briefingLayoutVariant (page.tsx)
  → /api/builder-v2/chat (autenticação, créditos, criação por IA)
  → Site { blocks[], niche, templateId, briefingLayoutVariant, ... }
  → imagens (biblioteca de nicho, URLs e geração, conforme caminho)
  → BuilderV2Site (família/modelo → componentes especializados ou fallback)
  → IndexedDB + localStorage + histórico
  → /api/builder-v2/publish → snapshot público
```

```text
Comando de edição
  → applyUniversalNaturalLanguage() no navegador
  → atalhos locais especializados ou /api/builder-v2/chat
  → operações validadas + edições específicas + fallback de IA
  → alteração de Site/blocks → re-renderização → histórico/autosave
```

Há também `frontend/src/lib/site-builder-universal.ts` e a rota `/api/templates/universal/generate`, mas são fluxos distintos do endpoint principal do Builder 2.0. A existência desses arquivos não comprova que os 30 modelos compartilhem um único motor de geração.

## Achados priorizados

**P0 — Edição aplicada ao JSON mas não necessariamente à composição.** Os adaptadores `universal-bindings` e `universal-sections` já protegem mudanças explícitas e movimento de seções em caminhos integrados. Entretanto, muitos componentes TP continuam com seções/dados e estilos próprios. Exigir prova por família/modelo antes de afirmar universalidade.

**P0 — Regressão visual por escopo incorreto.** Alterações de cor em Estética demonstraram que regras abrangentes de CSS podem afetar legibilidade de títulos sobre fotografias e desfigurar áreas escuras. O motor não deve editar o CSS global para atender um pedido local: tokens com escopo `familyId + variantId + sectionId` e teste de contraste são obrigatórios.

**P0 — Backup remoto pendente.** `readPageNovaProject/savePageNovaProject` existem e o editor protege a hidratação antes de sobrescrever rascunhos locais; o PR #15 permanece separado e requer testes de RLS, conflitos, offline e duas sessões. Versões nomeadas em nuvem não equivalem a autosync completo.

**P1 — Orquestração concentrada.** A UI e a API têm múltiplas regras de geração e edição; dificultam transação única, localização de bugs e testes isolados. Extrair orquestração sem reescrever templates aprovados.

**P1 — Conteúdo demonstrativo e mídia.** Depoimentos/endereços de prévia devem ter origem e visibilidade próprias; nunca publicar fatos inventados. Mídia deve respeitar nicho, evitar duplicação/quebras, preservar imagens reais em modelos estáticos e usar 3D somente quando solicitado.

**P1 — Catálogo 139 vs meta 133.** Reconciliar oficialmente sem perder projetos existentes, sem forçar 133 por exclusão. Não alterar a posição de Dermatologia com base apenas em intenção visual.

**P2 — Lacuna de QA:** os testes existentes não são uma demonstração integral de **139 nichos × 3 modelos × operações por chat × F5 × publicação** com mídia real e usuário autenticado.

## Contrato técnico proposto

1. **Registry único:** ID imutável de nicho, aliases e familyId; chave de modelo 01/02/03; versão do manifest. O renderizador recebe familyId decidido na criação; nunca reinterpreta o nome da marca para trocar silenciosamente o template.
2. **Manifest por família/modelo:** seções obrigatórias/permitidas, blocos e campos editáveis, capacidades de cor, imagem, depoimentos, mapa, WhatsApp, galeria, FAQ, remoção e ordenação.
3. **SiteDocument versionado:** IDs estáveis `sectionId/blockId`, role semântica, estilos alterados explicitamente, origem dos dados (`customer/verified/demo/ai`) e marcação `previewOnly`.
4. **Pipeline de geração:** briefing → família → manifesto → plano estrutural → IA gera conteúdo estruturado → valida factualidade/quantidade/mídia → renderer. A estética específica continua nos componentes aprovados.
5. **Pipeline de edição:** interpretar comando → resolver alvo de modo não ambíguo → validar operação + capacidade de renderer → aplicar atomicamente → diff verificável → undo/redo → salvar → renderizar. Ao falhar, preservar tudo e retornar erro claro.
6. **Adapter para cada modelo:** consumir o mesmo contrato e declarar suporte real; nunca sinalizar sucesso quando a composição não aplica a alteração. Estender `UniversalTemplateSections` e `universalBlockProps` onde fizer sentido.
7. **Sync como trilha separada:** adotar PR #15 somente após homologia específica; conflitos não podem sobrescrever alterações locais; rollback deve preservar dados.

## Plano seguro de implementação

| Fase | Entrega | Gate |
|---|---|---|
| A — esta missão | Auditoria + testes de contrato sem mudanças visuais | PR revisado, sem deploy |
| B | Registry/manifesto **em paralelo** ao roteador existente | 139 rotas, 3 variantes, sem fallback legado indevido |
| C | Adapters universais de edição começando por TP1, depois TP3/TP4 e demais famílias/3D | Operações válidas observáveis; inválidas com rollback |
| D | Geração baseada no manifesto, com mídia e factualidade validadas | Modelos distintos, seções completas, imagens corretas |
| E | Rebase/homologação do PR #15 | RLS, offline, dois dispositivos, F5, conflitos |
| F | Geração → edição → F5 → publicação em sessão de teste | desktop/tablet/mobile, provas por família/modelo |

### Matriz de testes para fases B–F

Para cada combinação família × variante, testar: gerar site, trocar título, trocar descrição, editar CTA e URL, trocar Hero, trocar card, adicionar/remover/mover seção, FAQ, depoimentos, mapa/WhatsApp, cor apenas da seção solicitada, desfazer/refazer, F5, imagens não repetidas e publicação de snapshot. Em telas 390/768/1440 px, validar overflow e contraste.

Na prévia, exemplos fictícios devem ser identificados. Sem cadastro, endereço e avaliação fictícios não podem aparecer como dados reais na publicação.

## Evidência de regressão adicionada

`frontend/scripts/test-builder-v2-core-contract.mjs`: famílias/nichos/variantes, contrato do despachante, edição atômica/imutável, rejeição de URLs inseguras e existência dos guardas de F5/publicação. Executar a partir de `frontend`:

```bash
node --experimental-strip-types --test scripts/test-builder-v2-core-contract.mjs
```

O teste **não substitui** validação de UX real, visual, mídia externa nem a sessão autenticada. Esta missão **não altera runtime**, não toca dados de usuários e não faz merge ou deploy em Production.

**Próxima implementação recomendada:** registry e manifesto das 10 famílias, começando por TP1, com roteamento duplo de verificação e sem mudar a escolha efetiva de modelo enquanto não houver aprovação dos testes.
