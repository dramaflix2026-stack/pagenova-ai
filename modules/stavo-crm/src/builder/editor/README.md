# editor

Regras do editor visual que não dependem de React: aplicar uma alteração no
rascunho, validar contra o schema, versionar e desfazer.

Vazio de propósito. Hoje essa lógica está dividida entre o router
(`src/server/modules/site-ai/router.ts`) e os componentes de tela
(`src/client/components/site-ai/editor/`). Ao extrair, ela vem para cá.
