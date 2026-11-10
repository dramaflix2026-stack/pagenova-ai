# PageNova AI — inventário do motor universal de edição
**Data:** 10/11/2026 · **Código analisado:** `main` em `39edb65a8405d032fc4ca25dad1117d4b56685bf`
**Escopo desta rodada:** inventariar o que já existe antes de acrescentar qualquer função; proteger layouts. **Nenhuma funcionalidade nova do editor foi implementada nesta rodada.**

## 1. Arquitetura já existente

| Camada | Implementação encontrada | Observação |
| --- | --- | --- |
| Interface do Studio | `frontend/src/app/app/builder-v2/page.tsx` | Orquestra comandos, prévia, attachments, persistência e publicação. Antes do servidor, tenta interpretadores locais para várias edições. |
| API de chat/edição | `frontend/src/app/api/builder-v2/chat/route.ts` | Encaminha para editores especializados, operação estruturada, copy/card, linguagem natural e fallback de IA com patch; criação de site é outro caminho. |
| Linguagem natural | `frontend/src/lib/builder-v2-universal-language.ts` | Inclui divisão em cláusulas, aliases/identificadores, alterações atômicas e recusa conservadora quando não encontra alvo seguro. |
| Operações atômicas | `frontend/src/lib/builder-v2-universal-operations.ts` | Atualizar, adicionar, remover e mover blocos; remover, mover e restaurar seções; validação de entradas e links. |
| Seleção de alvo | `builder-v2-universal-targets.ts`, `builder-v2-universal-visible-slots.ts` | Resolve nomes de seção e posições editáveis, inclusive slots que só aparecem no JSX. |
| Texto e títulos | `builder-v2-universal-copy-edits.ts`, `builder-v2-universal-heading-batches.ts` | H1, parágrafos, subtítulos, botões, vários títulos em transação, reescrita pontual com IA; evita mudança em blocos não solicitados. |
| Cards | `builder-v2-universal-card-edits.ts` | Card ordinal/nomeado: título e descrição com atualização conjunta e alvo estável. |
| Paleta e aparência | `builder-v2-universal-palette.ts`, `builder-v2-universal-practical-edits.ts` | Paleta global; cor do fundo de seção e títulos, alinhamentos e alguns efeitos, espaçamento/raio de cards. |
| Imagens | `builder-v2-institutional-images.ts`, `builder-v2-image-intent.ts`, `builder-v2-hero-banner-edits.ts` | Troca de imagem, upload, imagem da hero e dos cards, banners múltiplos, galeria, enquadramento, versões mobile e ordenação em fluxos suportados. |
| Caminho TP6 | `builder-v2-tp6-edit-bridge.ts` | Edições de varejo vinculadas ao estado visual `tp6RetailEdits` quando a operação é reconhecida. |
| Renderização | `frontend/src/components/builder-v2-site.tsx` e componentes `builder-v2-tp*` / `template*` | Muitos templates especializados; exibir uma alteração depende de o componente realmente ler o campo/bloco alterado. |
| Persistência e versões | `page.tsx`, `frontend/src/app/api/builder-v2/versions/route.ts` | IndexedDB, fallback local, histórico de rascunhos e endpoint Supabase com autenticação. Confirmar recuperações/reconciliação com testes de ponta a ponta. |
| Editor visual anterior | `editor-dom-bridge.ts`, `site-builder-live-editor.ts` | Edição DOM/direta em fluxo diferente; **não** duplicar no motor do Builder 2.0 sem necessidade demonstrada. |

## 2. Funcionalidades que NÃO devem ser reimplementadas

- Edição de **texto da hero, parágrafos, títulos e rótulos de botões** (inclui intenções de reescrita com IA).
- Mudança de **cor, paleta, alinhamento, fonte, tamanho, bordas/raio** nos caminhos já cobertos.
- **CTA e links**, inclusive destino interno validado e segundo botão em cenários reconhecidos.
- Edição de **cards** por posição/nome: título, descrição, inserção e exclusão quando o modelo suporta.
- **Adicionar, remover e mover seções** e **reordenar passos/cards** em comandos reconhecidos.
- **Substituir e adicionar fotografias**, upload do cliente, hero, imagens específicas, galeria, mobile e enquadramento em fluxos já suportados.
- **Comandos múltiplos com aplicação atômica**; não aplicar parcialmente uma edição composta se uma parte falhar.
- **Proteções existentes:** IDs estáveis, validação de links e propriedades, rejeição de ambiguidades, preservação dos blocos alheios, isolamento de copy.
- **Salvar projeto/rascunho e histórico** (há implementação; robustez ainda precisa ser homologada).

## 3. Lacunas observadas e riscos de regressão

1. **Mutação de dados ≠ edição visual comprovada.** Alguns modelos desenham textos, cards ou imagens de constantes no componente. O motor pode mudar `site.blocks` e confirmar sucesso sem o renderizador consumir esse valor. É o principal risco relatado em testes de comandos variados.
2. **Cobertura de bindings irregular.** A solução já criou slots virtuais, `universalSectionStyles` e ponte específica TP6, mas isso não prova cobertura de todos os elementos visíveis em todos os modelos.
3. **Roteamento por regras/fallback duplicados.** Existem interpretadores na interface, na API e em helpers especializados. Uma regra mais genérica pode interceptar uma frase antes da regra apropriada; a precedência deve ser testada.
4. **Linguagem natural fora dos padrões previstos.** Instruções sem nome técnico/seção, inserção em posição implícita e referências contextuais podem cair em recusa ou fallback de IA; não tratar erro honesto como sucesso.
5. **Verificação real de entrega.** Precisamos cruzar comando, IDs alterados, DOM da prévia, publicação, F5 e edição entre sessões; os testes atuais são fortes em vários contratos, mas não constituem uma prova visual completa de todos os nichos.
6. **Persistência em dispositivos/conflitos.** Há IndexedDB/local e endpoint cloud para versões, mas a estratégia completa de conflito, migração e sincronização precisa de avaliação própria antes da certificação.
7. **Segurança de conteúdo:** preservar fotos originais e dados reais, não fabricar depoimentos/clientes/horários/endereço; exigir rótulo inequívoco para exemplos fictícios.

## 4. Ordem exata para continuar o motor universal

**Fase A — Auditoria de capacidade (sem criar features):**
- Para cada um dos 10 grupos de template, testar os modelos 1, 2 e 3 com: alteração de título, subtítulo, CTA, card, imagem, cor, nova seção, remoção/reordenação. Começar com uma amostra de 30 combinações; depois ampliar por nicho.
- Em cada teste validar **antes/depois de renderização**, não apenas resposta do chat. A UI só pode afirmar “feito” quando o componente visível realmente mudou.
- Repetir no Preview, F5 e página pública. Verificar que o resto permaneceu idêntico. Separar suporte confirmado, parcial e ausente.

**Fase B — Fechar lacunas de integração existentes:**
- Conectar slots/blocos existentes aos renderizadores que ainda ignoram os valores; **não adicionar outro parser/engine** para um comando já compreendido.
- Unificar o resultado verificável da edição, incluindo seção/elemento alterado e aviso claro quando não houver binding visual.
- Corrigir precedência de interpretadores somente nos casos reprovados; manter validação atômica.
- Testar comandos em linguagem comum, sem exigir “TP”, número do modelo ou ID da seção.

**Fase C — Segurança operacional:**
- Testes de F5/salvamento, versões/rollback, sincronização entre dispositivos, conflitos e publicação vs preview.
- Testes automatizados de regressão contra o congelamento visual aprovado.
- Só então decidir **quais recursos verdadeiramente inexistentes** merecem desenvolvimento.

## 5. Política de congelamento aprovada

- Código integral preservado no ramo **`baseline/approved-templates-20261110`**, commit `39edb65a8405d032fc4ca25dad1117d4b56685bf`.
- `frontend/quality/approved-templates-baseline.json`: SHA Git de cada arquivo visual protegido.
- `frontend/scripts/check-approved-template-freeze.mjs`: teste de integridade que falha se uma fonte protegida divergir do baseline.
- O teste integra **build** e **GitHub Quality Checks**. Qualquer alteração intencional de layout aprovado exige autorização explícita, revisão visual e atualização consciente do baseline; nunca atualize hashes automaticamente.
- O baseline contém componentes atualmente existentes, inclusive alguns que não foram homologados individualmente. Ele registra a **fotografia técnica do estado atual**, não é certificado universal de aprovação dos 133 nichos.
- Alterar somente o motor de edição não autoriza redesenhar o tema aprovado.

**Próxima execução recomendada:** ensaio real de edição **texto → card → cor → imagem → seção** em uma amostra de modelos preservados, com evidência do DOM e do site publicado. Não iniciar um novo editor.
