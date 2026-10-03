# PROMPT MESTRE — SITE COM IA

## Implementação do gerador de sites demonstrativos com IA dentro do CRM existente

> Copie e cole **todo este documento** no Claude Code, aberto na raiz do repositório atual da plataforma. Este documento é uma especificação funcional, técnica e operacional. Não resuma, não transforme em simples protótipo e não implemente apenas telas sem backend.

---

# INÍCIO DO PROMPT PARA O CLAUDE CODE

Quero que você atue como arquiteto de software sênior, product engineer, desenvolvedor full-stack, especialista em sistemas com IA, design systems, web design orientado à conversão, segurança, banco de dados, testes, acessibilidade, performance e implantação na Hostinger.

Sua missão é **adicionar à plataforma existente um módulo funcional chamado “Sites com IA”**, integrado ao CRM e aos cards dos leads. O módulo deve criar sites one-page demonstrativos realmente profissionais, personalizados para cada negócio, editáveis dentro da plataforma, publicáveis em um link público e exportáveis em ZIP estático pronto para hospedagem.

Não quero um gerador que solicite “crie um site bonito” e execute HTML arbitrário retornado por uma IA. Quero um produto confiável, baseado em:

1. direção criativa e copy geradas por IA;
2. saída estruturada e validada por schema;
3. biblioteca real e versionada de componentes profissionais;
4. design tokens por projeto;
5. presets testados de animação e interação;
6. um renderer determinístico;
7. editor visual por seções;
8. publicação pública persistente;
9. exportação estática reproduzível;
10. limites rígidos de custo, tokens, tentativas e concorrência.

Implemente código real, migrações reais, integração real, filas persistentes, estados de erro, testes e documentação. Não entregue pseudocódigo, botões sem função, mocks disfarçados de produção ou uma página bonita desconectada do banco.

---

# 1. CONTEXTO DO SISTEMA EXISTENTE E PRECEDÊNCIA

## 1.1 O sistema já existe

A plataforma/CRM já está implementada e funcionando. Ela possui pesquisa de empresas por APIs oficiais do Google, cards de leads, CRM, autenticação, backend, banco de dados e implantação na Hostinger. O domínio informado da aplicação atual é:

`https://crm.instal.digital.com.br`

A especificação anterior do projeto adotou, entre outras decisões, React + Vite + TypeScript no frontend, Node.js + Express + TypeScript no backend, MySQL e implantação como aplicação Node.js na Hostinger. **Antes de assumir qualquer detalhe, confirme a realidade do repositório.** Se a implementação atual divergir, reutilize a stack real e as convenções existentes, salvo incompatibilidade verdadeira.

## 1.2 Esta é uma extensão, não uma reconstrução

- Não recrie o CRM.
- Não inicialize um novo projeto se o repositório já contiver a aplicação.
- Não migre silenciosamente framework, banco, autenticação, design system ou hospedagem.
- Não altere rotas, tabelas ou comportamentos existentes sem necessidade.
- Não apague nem sobrescreva alterações do usuário.
- Não faça `git reset --hard`, limpeza destrutiva, push, merge ou commit sem autorização.
- Crie migrações incrementais e compatíveis com os dados atuais.
- Preserve o funcionamento das pesquisas, cards, CRM, dashboard, autenticação e demais módulos.

## 1.3 Regra de precedência

Este documento é uma especificação incremental. Caso uma especificação anterior diga “não criar construtor de sites”, “não criar gerador de sites” ou equivalente, **esta nova especificação substitui somente essa proibição**, pois o módulo agora foi explicitamente aprovado.

Na Fase B deste documento, também há uma alteração deliberada no comportamento de persistência de alguns dados do lead. Ela substitui regras anteriores apenas no que estiver expressamente descrito e sempre respeitando os termos atuais do Google Maps Platform.

Todas as demais regras válidas da plataforma existente continuam em vigor.

## 1.4 Prioridade obrigatória

Execute o trabalho nesta ordem:

1. **FASE A — SITE COM IA:** implementar, testar e estabilizar integralmente o módulo prioritário.
2. **FASE B — CORREÇÃO DE DADOS DO LEAD:** somente depois da Fase A estar funcional, implementar a alteração separada descrita no fim deste documento.

Não misture os dois escopos na mesma migração, serviço ou pull request lógico. A Fase B não pode atrasar nem contaminar a arquitetura do gerador.

---

# 2. DECISÕES DE PRODUTO NÃO NEGOCIÁVEIS

As decisões abaixo já foram tomadas. Não as transforme novamente em perguntas.

## 2.1 Finalidade

- O recurso serve prioritariamente para prospecção: criar uma amostra personalizada antes do primeiro contato.
- O site deve causar a percepção de que foi pensado especificamente para aquele negócio.
- O resultado deve parecer um projeto final profissional, e não um template genérico preenchido automaticamente.
- O módulo deve aumentar velocidade e organização sem abrir mão de qualidade visual, copy, UX, acessibilidade, performance e conversão.
- Após fechar com o cliente, o administrador poderá baixar o projeto e implantá-lo manualmente na Netlify, Hostinger ou outro host estático.

## 2.2 Tipos de site da primeira versão

Implemente somente:

1. **Site institucional one-page:** cabeçalho/menu, links âncora e todas as seções na mesma página.
2. **Landing page:** página única focada em conversão, normalmente sem menu completo ou com navegação mínima.

Não implemente nesta fase sites multipágina, blog, e-commerce, área de membros, painel do cliente, banco de dados por site ou formulários que persistam leads.

## 2.3 Aparência do projeto público

- Não exibir banner, selo, watermark, rodapé, modal ou texto dizendo “demo”, “demonstração”, “preview”, “feito por IA” ou equivalente.
- Não usar `demo`, `demonstracao`, `preview` ou palavras equivalentes no slug público.
- O título, Open Graph e preview do WhatsApp devem mostrar o negócio, não a condição de demonstração.
- O link deve parecer exclusivo e pronto.
- O site demonstrativo deve usar `noindex` e não deve aparecer em buscadores, mas isso será apenas técnico e invisível ao prospect.
- O projeto não pode conter informações falsas para parecer mais completo.

## 2.4 Personalização

- Cada projeto deve receber direção criativa, copy, paleta, tipografia, composição, tratamento de imagens, CTAs, ritmo visual e conjunto de animações coerentes com aquele negócio.
- Não escolher clichês automaticamente. Exemplo: uma nutricionista não deve receber obrigatoriamente verde, folhas e frases genéricas.
- A base estrutural pode reutilizar componentes, mas a combinação e a direção devem variar de modo significativo.
- Não criar um único template no qual apenas nome, cores e textos são trocados.
- O administrador poderá informar cor principal, cor de destaque, tema claro/escuro/misto, estilo e instruções livres. A IA também poderá decidir quando a opção “IA decide” estiver selecionada.

## 2.5 Animação e interatividade

- O padrão deve ser profissional, fluido e interativo, sem exagero.
- Usar animações sutis de entrada, scroll, imagens, textos, cards, botões e transições quando fizer sentido.
- Incluir suporte controlado a GSAP e ScrollTrigger.
- Implementar botões com gradientes elegantes, gradiente opcionalmente animado, hover, foco visível e feedback de clique/press.
- Efeitos nunca podem atrapalhar leitura, navegação, conversão, celular ou acessibilidade.
- A experiência deve lembrar o acabamento de sites internacionais premiados, sem copiar sites, sem sacrificar usabilidade e sem transformar toda página em espetáculo pesado.

## 2.6 Imagens

- Não fazer uma avaliação cara, exaustiva e automática de todas as fotos por IA.
- Não gastar chamadas apenas para classificar resolução, orientação ou estética de cada imagem.
- Faça somente validações técnicas determinísticas: arquivo decodificável, MIME real, tamanho, dimensões mínimas quando necessárias e segurança.
- O editor deve facilitar troca, recorte, enquadramento e ponto focal.
- Logo, fotografia do profissional e imagens reais do estabelecimento podem exigir ajuste manual e isso é aceitável.
- Imagens reais e autorizadas têm prioridade. Imagens de apoio podem ser geradas opcionalmente pela API da OpenAI.
- Nunca gere uma pessoa fictícia e apresente-a como se fosse o profissional real, cliente, paciente, funcionário ou proprietário.

## 2.7 Hospedagem e entrega

- Não implementar publicação automática na Netlify nesta fase.
- Não implementar compra, registro, configuração automática de domínio ou DNS.
- Não solicitar acesso à conta Netlify ou Registro.br do cliente.
- A demonstração pública ficará servida pela infraestrutura atual da plataforma/Hostinger.
- O projeto final será baixado em ZIP estático, pronto para implantação manual em Netlify, Hostinger, VPS ou hospedagem equivalente.
- O site exportado não terá backend, banco de dados nem dependência do CRM.

## 2.8 WhatsApp

- O número deve ser obtido do lead quando disponível e poderá ser corrigido manualmente.
- O sistema gerará uma mensagem personalizada de abordagem com o link publicado.
- Na primeira versão, abrir o `wa.me` com texto preenchido; o administrador confirma e envia no WhatsApp.
- Não afirmar que a mensagem foi enviada só porque o link abriu.
- Não implementar disparo em massa, spam ou envio automático pela WhatsApp Cloud API nesta fase.

---

# 3. RESULTADO ESPERADO E DEFINIÇÃO DE PRONTO

O módulo só pode ser considerado pronto quando o administrador conseguir executar esta jornada real:

1. abrir um card do CRM e clicar em **Criar site**;
2. revisar dados preenchidos pelo lead e completar um briefing curto;
3. escolher landing page ou institucional one-page, direção visual, cores, animação e instruções adicionais;
4. iniciar a geração sem manter o navegador preso a uma requisição longa;
5. acompanhar etapas verdadeiras e persistentes do trabalho;
6. sair da tela, voltar depois e encontrar o job no mesmo estado;
7. visualizar o site pronto em desktop e celular;
8. editar textos, cores, logo, imagens, links, componentes, cards e ordem das seções;
9. pedir uma alteração por IA sem regenerar desnecessariamente o projeto inteiro;
10. desfazer, refazer, salvar e recuperar versões anteriores;
11. publicar um snapshot em URL pública sem autenticação e sem identificação visível de demonstração;
12. abrir essa mesma URL em janela anônima e em outro dispositivo;
13. copiar ou abrir no WhatsApp uma mensagem específica com o link;
14. atualizar o projeto e publicar uma nova versão mantendo o mesmo link;
15. reverter a publicação para uma versão anterior;
16. baixar um ZIP estático e abrir o conteúdo por um servidor estático;
17. implantar esse ZIP manualmente na Netlify/Hostinger sem diferença visual ou funcional relevante;
18. consultar custo, tokens, modelo, tentativas e histórico de geração;
19. usar o módulo em modo mock de desenvolvimento quando as chaves não estiverem configuradas;
20. continuar usando todo o CRM existente sem regressões.

Não declare o módulo concluído se qualquer parte crítica estiver simulada, quebrada, dependente de localhost, salva apenas na memória ou protegida pela autenticação do CRM quando deveria ser pública.

---

# 4. PROTOCOLO DE EXECUÇÃO DO CLAUDE CODE

## 4.1 Antes de alterar código

1. Leia este documento integralmente.
2. Inspecione `package.json`, estrutura do frontend/backend, ORM/query layer, migrações, autenticação, rotas, convenções de erro, armazenamento, build, testes e deploy.
3. Verifique `git status` e preserve alterações existentes.
4. Localize as entidades de lead, card, usuário, alertas, configurações, Google Places e uploads.
5. Identifique a versão real do Node, MySQL e o modo de deploy da Hostinger.
6. Execute a suíte atual ou, no mínimo, lint, typecheck, testes essenciais e build para criar uma linha de base.
7. Registre resultados existentes antes de atribuir novos erros ao módulo.
8. Crie ou atualize `IMPLEMENTATION_PLAN_SITE_AI.md` com fases, arquivos prováveis, migrações, riscos e critérios de aceite.
9. Não faça uma reescrita ampla se a integração puder ser incremental.

## 4.2 Durante a implementação

- Trabalhe em fatias verticais pequenas e testáveis.
- Termine backend, frontend, persistência e testes de uma fatia antes de abrir muitas frentes incompletas.
- Reutilize componentes, hooks, clientes HTTP, padrões de validação, logger e design system existentes.
- Use adapters/interfaces nas integrações externas.
- Faça migrações forward-only seguras; forneça rollback apenas se a convenção atual suportar.
- Use feature flag até o fluxo mínimo estar seguro.
- Nunca chame APIs pagas em testes automatizados.
- Não exponha chaves no frontend.
- Não deixe TODOs críticos ou botões falsos.
- Não troque uma decisão deste documento por preferência pessoal sem conflito técnico comprovado.

## 4.3 Eficiência de tokens no próprio desenvolvimento

Evite gastar contexto e tokens do Claude Code desnecessariamente:

- faça uma inspeção inicial organizada e mantenha o plano atualizado;
- não releia repetidamente arquivos grandes sem necessidade;
- pesquise símbolos e trechos específicos antes de abrir arquivos inteiros;
- altere somente arquivos relacionados ao passo atual;
- não regenere documentação redundante a cada etapa;
- use testes focados durante a iteração e a suíte completa nos marcos;
- não copie arquivos inteiros quando um patch pequeno for suficiente;
- não crie múltiplas abstrações para o mesmo problema;
- reporte progresso de forma curta e objetiva;
- não interrompa para pedir informações que o repositório ou este documento já fornecem.

## 4.4 Perguntas permitidas

Só interrompa para perguntar quando houver um bloqueio real, como:

- acesso/segredo indispensável para testar uma integração real;
- decisão de infraestrutura não verificável no repositório ou hPanel;
- conflito irreconciliável com o deploy atual;
- risco de perda de dados;
- requisito mutuamente incompatível.

Quando faltar uma chave de API, implemente primeiro o adapter, o modo mock, a validação e toda a interface. Depois mostre exatamente qual variável deve ser configurada. Nunca peça que uma chave seja colada em código, commit ou chat se ela puder ser cadastrada com segurança no ambiente.

## 4.5 Relatório ao final de cada marco

Informe:

- o que foi implementado;
- arquivos principais alterados;
- migrações criadas;
- comandos executados;
- testes aprovados e falhos;
- integrações testadas em mock;
- integrações testadas de forma real;
- configuração manual pendente;
- riscos e limitações verdadeiras.

---

# 5. ARQUITETURA OBRIGATÓRIA DO SITE COM IA

## 5.1 Princípio central

Use a seguinte separação:

1. **IA de texto/direção:** cria estratégia, direção criativa, copy, plano de seções, tokens visuais, presets de movimento e plano de imagens.
2. **Schema do site:** contrato JSON versionado, estrito e validado.
3. **Biblioteca de componentes:** código real, testado, acessível e responsivo.
4. **Renderer:** transforma o schema validado em página.
5. **Editor:** altera o schema, não código livre.
6. **Publicador:** gera e ativa snapshot estático persistente.
7. **Exportador:** gera pacote estático de produção a partir da mesma fonte.

O fluxo lógico é:

`Briefing confiável -> Orquestrador de IA -> SiteSchema validado -> Renderer -> QA determinístico -> Editor -> Snapshot publicado/ZIP`

## 5.2 O que a IA pode e não pode fazer

A IA pode:

- escolher direção criativa;
- escrever e revisar copy;
- escolher tipos e variantes existentes de seções;
- ordenar seções;
- definir design tokens dentro de limites;
- selecionar presets existentes de animação;
- definir brief de imagens;
- sugerir links e CTAs a partir de dados confirmados;
- retornar patches estruturados para edições.

A IA não pode:

- retornar HTML, CSS ou JavaScript para execução;
- instalar dependências;
- criar componentes arbitrários em produção;
- inserir `<script>`, `iframe` não autorizado, eventos inline ou código executável;
- escolher URLs com protocolos perigosos;
- acessar segredos;
- executar ferramentas no servidor;
- inventar fatos;
- publicar automaticamente sem ação explícita do administrador.

## 5.3 Não usar apenas templates nem apenas prompt

Implemente um sistema híbrido:

- **não** hospedar um único conjunto de páginas fechadas e apenas trocar conteúdo;
- **não** deixar toda a responsabilidade em um texto de prompt;
- construir uma biblioteca interna de seções e primitivas reais;
- manter blueprints de composição somente como ponto de partida, não como páginas imutáveis;
- deixar a IA combinar variantes, tokens, conteúdo, densidade e movimento de forma coerente;
- preservar regras determinísticas de qualidade.

Isso deve permitir variedade real sem código arbitrário e sem custos de geração de código a cada site.

## 5.4 Organização recomendada

Adapte os nomes à estrutura existente, mas mantenha responsabilidades equivalentes:

```text
site-ai/
  domain/
    site-schema/
    validators/
    policies/
    commands/
  ai/
    prompts/
    providers/
    schemas/
    orchestration/
  components/
    primitives/
    sections/
    registry/
  design/
    tokens/
    palettes/
    typography/
    blueprints/
  motion/
    presets/
    runtime/
  renderer/
    preview/
    static/
  editor/
  assets/
  publishing/
  export/
  jobs/
  usage/
  tests/
```

Não crie um pacote separado se isso piorar a integração com o monorepo atual. A separação é conceitual.

## 5.5 Um único renderer como fonte de verdade

- O editor, o preview, a publicação e o ZIP devem consumir o mesmo `SiteSchema` e os mesmos componentes/tokens.
- Evite manter um renderer “de preview” e outro “de exportação” com implementações divergentes.
- Se o frontend atual for React, use componentes React isomórficos e, para o pacote estático, renderização estática/SSR controlada, por exemplo com `react-dom/server`, quando compatível.
- O site exportado deve usar um runtime JavaScript pequeno e genérico para menu, accordion, formulário de WhatsApp e animações por `data-*`; não exija o CRM nem um backend.
- Gere bundles de produção com a ferramenta já usada no projeto ou uma integração mínima com Vite/esbuild.
- O conteúdo principal deve existir no HTML inicial. Não dependa de JavaScript para tornar títulos, textos ou CTAs visíveis.

## 5.6 Versionamento técnico

Todo projeto deve registrar:

- `schemaVersion`;
- `rendererVersion`;
- `promptVersion`;
- versão dos presets/biblioteca quando necessário;
- versão do projeto/draft;
- versão publicada;
- hash do artefato estático.

Uma atualização da biblioteca não pode quebrar sites já publicados. Prefira armazenar artefatos estáticos imutáveis por publicação e ativar um ponteiro para a versão corrente. Implemente migração explícita de schema quando necessária, nunca mutação silenciosa de versões antigas.

# 6. EXPERIÊNCIA DO USUÁRIO E PONTOS DE ENTRADA

## 6.1 No card do CRM

Adicionar uma ação contextual no card e no drawer/detalhe do lead. Reutilize o padrão visual atual e não sobrecarregue o card compacto.

O rótulo deve refletir o estado:

| Estado | Ação principal |
|---|---|
| sem projeto | Criar site |
| job em andamento | Ver andamento |
| site pronto não publicado | Editar site |
| site publicado | Abrir site |
| geração com falha | Retomar geração |

No detalhe do lead, quando existir projeto, mostrar de forma compacta:

- status;
- última atualização;
- link público, quando publicado;
- botões **Editar**, **Publicar/Abrir**, **WhatsApp** e **Baixar ZIP** conforme o estado;
- custo acumulado estimado/registrado;
- falha acionável, se houver.

Não crie etapas novas no Kanban apenas para “site em criação” ou “site pronto”. O projeto é uma entidade relacionada ao lead, não uma etapa obrigatória do funil.

## 6.2 No menu lateral

Adicionar a opção **Sites com IA** ao menu existente. A página deve conter:

- botão **Novo site**;
- busca por negócio/lead;
- filtros por status, data e tipo;
- lista ou cards dos projetos com nome, lead, tipo, status, data, custo e link;
- estados vazios, carregamento e falha;
- ações para continuar edição, abrir, duplicar, arquivar e excluir logicamente;
- indicação clara de projeto em geração;
- paginação ou carregamento eficiente se a lista crescer.

## 6.3 Criação com ou sem lead

Ao clicar em **Novo site**, perguntar:

1. criar para um lead existente; ou
2. criar um projeto avulso.

Se for para lead existente:

- permitir busca/seleção no CRM;
- preencher somente dados disponíveis e permitidos;
- manter vínculo bidirecional entre projeto e lead;
- evitar segundo projeto ativo acidental para o mesmo lead;
- se já houver projeto, oferecer **Continuar projeto**, **Duplicar como nova versão/proposta** ou **Cancelar**.

Se for avulso, permitir vínculo posterior a um lead.

## 6.4 Estados e navegação

- URLs internas devem ser recarregáveis e seguir o roteamento atual.
- Proteger rotas de criação/edição com a autenticação existente.
- A rota pública publicada é a única que não exige login.
- Ao tentar sair com alterações ainda não persistidas, mostrar aviso somente se o autosave realmente não tiver concluído.
- Erros precisam dizer o que ocorreu e oferecer uma ação possível; não usar apenas “algo deu errado”.

---

# 7. BRIEFING DE CRIAÇÃO

Crie um wizard compacto, editável antes da geração, com três etapas. Não transforme o primeiro contato em um formulário interminável. Campos ausentes podem ser decididos pela IA ou omitidos com segurança.

## 7.1 Etapa 1 — Negócio e objetivo

Campos:

- lead associado, quando houver;
- nome do negócio ou profissional;
- nicho/categoria;
- cidade e região atendida;
- objetivo principal do site;
- público-alvo;
- serviços/produtos principais;
- diferenciais confirmados;
- oferta principal, se existir;
- WhatsApp/telefone;
- endereço;
- Instagram e outras redes;
- website atual/referência, se existir;
- observações factuais.

Objetivos sugeridos:

- gerar conversas no WhatsApp;
- receber pedidos de orçamento;
- agendar consulta/avaliação;
- apresentar autoridade e serviços;
- captar interesse em uma oferta;
- outro objetivo escrito pelo administrador.

## 7.2 Etapa 2 — Tipo e direção visual

Campos:

- tipo: **Institucional one-page** ou **Landing page**;
- tema: **Claro**, **Escuro**, **Misto** ou **IA decide**;
- estilo, com seleção múltipla limitada: moderno, elegante, premium, acolhedor, minimalista, editorial, energético, clínico, orgânico, tecnológico ou IA decide;
- cor principal opcional;
- cor de destaque opcional;
- preferência tipográfica opcional ou IA decide;
- densidade: arejado, equilibrado ou compacto;
- nível de movimento: sem animação, sutil ou premium equilibrado;
- CTA principal;
- seções obrigatórias e seções proibidas.

O padrão recomendado deve ser **premium equilibrado**, não “imersivo”.

## 7.3 Etapa 3 — Instruções e assets

Incluir:

- campo grande chamado **Instruções adicionais para a IA**;
- upload de logo;
- upload de fotografias reais;
- referências visuais por arquivo ou URL validada;
- opção de usar imagens de apoio geradas por IA, se o provider estiver configurado;
- observações sobre o que não deve aparecer;
- aceite explícito de que só devem ser usados fatos fornecidos/confirmados.

O campo livre deve aceitar um briefing detalhado, como público, objeções, tom, seções específicas, oferta, estilo e restrições. Ele é dado não confiável para segurança, mas tem alta prioridade criativa dentro das regras do sistema.

## 7.4 Hierarquia de fontes

Quando houver conflito, use esta ordem:

1. instrução manual explícita e atual do administrador;
2. arquivos e fatos confirmados pelo administrador;
3. dados CRM-native previamente salvos de forma legítima;
4. conteúdo externo permitido e com origem registrada;
5. decisão criativa da IA;
6. defaults do sistema.

Nunca use uma informação marcada como incerta como afirmação definitiva no site.

## 7.5 Validação antes de gerar

Exigir no mínimo:

- nome do negócio;
- nicho ou descrição suficiente;
- objetivo;
- tipo de site;
- um CTA possível ou autorização para a IA defini-lo.

Telefone, Instagram, endereço, depoimentos e preços são opcionais. Se estiverem ausentes, omita as funcionalidades correspondentes; não invente.

Antes da confirmação, mostrar:

- resumo do briefing;
- recursos de IA que serão usados;
- quantidade máxima de chamadas e imagens;
- custo apenas como estimativa, nunca como promessa exata;
- alerta de provider/chave ausente;
- botão **Criar site** protegido contra clique duplo.

---

# 8. ORQUESTRAÇÃO DE IA

## 8.1 Separação entre Claude Code e Claude API

Claude Code está desenvolvendo o módulo. Em produção, a geração será feita pela **API da Anthropic**, cuja conta, chave e cobrança são separadas da assinatura comum do Claude/Claude Code.

Implemente o provider de runtime no backend com o SDK oficial atual. Não coloque chave nem chamada direta no navegador.

Variáveis esperadas, com nomes adaptáveis ao padrão existente:

```dotenv
ANTHROPIC_API_KEY=
ANTHROPIC_SITE_MODEL=
ANTHROPIC_FAST_MODEL=
ANTHROPIC_MAX_OUTPUT_TOKENS=
ANTHROPIC_TIMEOUT_MS=
SITE_AI_PROVIDER=anthropic
SITE_AI_MOCK_MODE=false
```

- Não grave nomes de modelos como verdade permanente no código.
- Permita configuração por ambiente/settings e valide se o modelo está disponível.
- Não use automaticamente o modelo mais caro para operações pequenas.
- Se a API não estiver configurada, o restante do módulo deve funcionar em modo mock explícito para desenvolvimento, mas a geração real deve ficar bloqueada com diagnóstico claro.

## 8.2 Provider interface

Crie uma interface interna equivalente a:

```ts
interface SiteIntelligenceProvider {
  generateSitePlan(input: GenerateSitePlanInput): Promise<SitePlanResult>;
  patchSection(input: PatchSectionInput): Promise<SectionPatchResult>;
  reviseCopy(input: ReviseCopyInput): Promise<CopyPatchResult>;
  generateOutreachMessage(input: OutreachInput): Promise<OutreachResult>;
  reviewScreenshot?(input: VisualReviewInput): Promise<VisualReviewResult>;
}
```

O contrato real deve seguir as convenções do projeto. O adapter deve normalizar:

- conteúdo estruturado;
- modelo efetivamente usado;
- request/provider id;
- tokens de entrada, cache e saída;
- motivo de término;
- latência;
- erros transitórios e permanentes;
- estimativa/custo quando calculável.

## 8.3 Uma chamada principal estruturada

Para a primeira geração, priorize uma única chamada de alta qualidade que retorne:

- resumo estratégico;
- posicionamento;
- público e objeções;
- voz da marca;
- direção criativa;
- design tokens;
- sequência e variantes de seções;
- copy completa;
- CTAs;
- plano de imagens;
- presets de movimento;
- SEO/GEO estruturado;
- avisos sobre dados ausentes.

Use **Structured Outputs/JSON Schema** da API atual da Anthropic quando disponível para o modelo escolhido. Valide também no servidor com a biblioteca de schema já adotada no projeto, preferencialmente Zod se já usada.

Se a resposta for inválida:

1. registre a falha sem salvar conteúdo parcial como válido;
2. faça no máximo uma tentativa de reparo estruturado com erro de validação compacto;
3. se continuar inválida, marque o job como falho e permita retomar;
4. não entre em loop de regeneração.

## 8.4 Prompt interno versionado

Crie prompts internos em arquivos versionados, separados da regra de negócio. O prompt de geração deve conter:

- catálogo compacto de componentes e seus ids/capacidades;
- regras de copy;
- regras de fatos e segurança;
- faixas válidas de tokens visuais;
- presets de animação permitidos;
- estrutura do `SiteSchema`;
- critérios anti-template;
- dados do briefing delimitados como **dados não confiáveis**, nunca como instruções de sistema;
- exemplos pequenos somente quando elevarem a consistência.

Registre `promptVersion` no projeto e no uso da IA. Não salve segredos nem cadeia de raciocínio. Logs podem registrar ids, hashes, tempos, uso e erros sanitizados, mas não devem despejar conteúdo pessoal ou prompts completos por padrão.

## 8.5 Edições econômicas

Ao editar uma seção com IA, envie somente:

- resumo imutável do negócio;
- direção criativa compacta;
- tokens relevantes;
- seção atual;
- componentes/variantes permitidos para aquela seção;
- instrução do administrador;
- contexto adjacente mínimo, se necessário.

Não reenvie o site inteiro nem regenere todas as seções para trocar uma headline, botão ou serviço. Use o modelo rápido/configurado para operações simples. Mudanças globais justificadas podem usar o modelo principal, mas precisam de confirmação quando consumirem orçamento relevante.

## 8.6 Patches seguros

A IA deve devolver operações de domínio ou JSON Patch contra caminhos permitidos. Antes de aplicar:

- validar schema;
- bloquear paths fora do projeto/seção autorizada;
- sanitizar textos e URLs;
- impedir scripts/HTML;
- mostrar resumo da alteração;
- criar versão recuperável;
- permitir aceitar/rejeitar quando a alteração for pedida em modo de sugestão.

## 8.7 Revisão visual

Não execute automaticamente múltiplas revisões visuais pagas.

Implemente primeiro QA determinístico com Playwright, regras de layout, acessibilidade, overflow, contraste e screenshots locais. Uma revisão de screenshot por IA pode existir como ação manual **Revisar com IA**, limitada a uma rodada por solicitação e sujeita ao orçamento. Ela deve sugerir patches estruturados, nunca código livre.

---

# 9. SITEMODEL/SCHEMA VERSIONADO

## 9.1 Requisitos gerais

Defina um `SiteSchema` discriminado, tipado e versionado. Ele deve ser a fonte de verdade editável do draft.

Campos conceituais mínimos:

```ts
type SiteSchema = {
  schemaVersion: string;
  rendererVersion: string;
  project: ProjectMeta;
  business: BusinessFacts;
  objective: ConversionObjective;
  creativeDirection: CreativeDirection;
  theme: DesignTokens;
  navigation: NavigationConfig;
  sections: SiteSection[];
  globalCta: GlobalCtaConfig;
  assets: AssetReference[];
  motion: MotionConfig;
  seo: SeoConfig;
  geo: GenerativeOptimizationConfig;
  integrations: PublicSiteIntegrations;
};
```

Use nomes reais coerentes com a base. Não aceite `Record<string, any>` em pontos críticos.

## 9.2 Fatos do negócio

Separar fatos confirmados de decisões criativas. `BusinessFacts` deve registrar, quando disponível:

- nome;
- descrição factual;
- nicho;
- localidade/área atendida;
- serviços;
- diferenciais;
- público;
- telefone/WhatsApp;
- endereço;
- redes;
- credenciais realmente fornecidas;
- preços/ofertas realmente fornecidos;
- proveniência/confirmação dos campos sensíveis.

Não permita que uma geração de copy grave novos fatos no registro principal do lead sem confirmação.

## 9.3 Design tokens

`DesignTokens` deve ser limitado por schema e incluir:

- cores semânticas: background, surface, text, muted, primary, accent, border, success/error quando usadas;
- pares foreground/background com contraste verificável;
- tipografias aprovadas/licenciadas;
- escala fluida de títulos e corpo;
- spacing scale;
- largura de container;
- raios;
- bordas;
- sombras;
- estilo de ícones;
- tratamento de imagem;
- estilo de botões;
- densidade;
- motion tokens.

Não permitir CSS livre. Overrides devem ser campos tipados e limitados.

## 9.4 Seções como união discriminada

Cada seção deve conter:

```ts
type BaseSection = {
  id: string;
  type: SectionType;
  variant: string;
  visible: boolean;
  anchor?: string;
  motionPreset?: MotionPresetId;
  style?: AllowedSectionStyleOverrides;
};
```

Cada `type` deve possuir `props` específicas. Não use props genéricas demais. Exemplos:

- `hero`;
- `about`;
- `services`;
- `benefits`;
- `audience`;
- `authority`;
- `stats`;
- `process`;
- `gallery`;
- `offer`;
- `testimonials`;
- `faq`;
- `cta`;
- `contactMap`;
- `whatsappForm`;
- `footer`.

## 9.5 Regras do schema

- ids estáveis e únicos;
- âncoras únicas e sanitizadas;
- quantidade máxima sensata de seções e itens;
- limites de comprimento por tipo de texto;
- URLs somente `https:`, `http:` quando estritamente necessário, `tel:`, `mailto:` e links WhatsApp gerados internamente;
- sem `javascript:`, `data:` arbitrário ou eventos inline;
- sem HTML arbitrário em textos;
- assets referenciados por id interno, não por caminho fornecido pelo usuário;
- depoimentos somente quando fornecidos;
- estatísticas somente quando confirmadas;
- mapa somente quando houver configuração válida;
- um CTA principal consistente;
- um único H1 renderizado;
- headings seguintes em ordem semântica.

## 9.6 Linter determinístico do projeto

Antes de considerar um `SiteSchema` pronto, execute regras sem IA:

- validação estrutural;
- contraste mínimo;
- links e telefones válidos;
- ausência de conteúdo proibido;
- headline e CTA presentes;
- nenhuma seção vazia;
- nenhum texto de placeholder;
- nenhum fato não confirmado;
- repetição excessiva de frases;
- limites de texto adequados ao componente;
- anchors e menu consistentes;
- assets existentes;
- alt text apropriado;
- compatibilidade da variante com quantidade de itens;
- motion preset disponível;
- configuração SEO coerente.

Falhas bloqueantes impedem publicação. Avisos permitem correção manual consciente.

---

# 10. BIBLIOTECA REAL DE COMPONENTES

## 10.1 Regra de qualidade

Construa componentes reais, não descrições no prompt. Cada variante deve ter diferença material de composição, hierarquia ou comportamento. Não conte como variantes diferentes apenas trocar alinhamento, cor ou raio.

Implemente em etapas, mas não libere a primeira versão como “profissional” com apenas uma ou duas variantes genéricas por seção.

## 10.2 Primitivas mínimas

- `Container`;
- `Section`;
- `Stack`/`Cluster` ou equivalentes;
- `Heading` e texto;
- `Button` e `IconButton`;
- `Badge`;
- `Card`;
- `MediaFrame`;
- `Logo`;
- `Icon`;
- `Accordion` acessível;
- campos de formulário;
- `WhatsAppFloatingButton`;
- navegação desktop/mobile;
- wrappers de motion com progressive enhancement.

## 10.3 Catálogo mínimo para lançamento

Meta mínima de variantes de alta qualidade:

| Família | Variantes mínimas |
|---|---:|
| header/navegação | 5 |
| hero | 8 |
| sobre | 5 |
| público/problemas | 4 |
| serviços | 6 |
| benefícios/diferenciais | 5 |
| autoridade/credenciais | 4 |
| números/prova | 3 |
| processo/passos | 5 |
| galeria/mídia | 4 |
| oferta/preço | 4 |
| depoimentos | 4 |
| FAQ | 4 |
| CTA intermediário/final | 5 |
| contato/mapa | 4 |
| formulário para WhatsApp | 3 |
| rodapé | 5 |

É preferível entregar uma variante realmente acabada e testada antes de duplicá-la superficialmente. Porém, a meta total precisa ser atingida antes de declarar a biblioteca completa.

## 10.4 Registry de componentes

Cada variante deve registrar metadados como:

- id estável;
- tipo;
- descrição curta para a IA;
- quantidade mínima/máxima de itens;
- tons compatíveis;
- densidade;
- capacidade de texto;
- necessidades de imagem;
- suporte a vídeo;
- presets de motion permitidos;
- nichos/objetivos adequados e inadequados;
- suporte a tema claro/escuro;
- versão;
- status experimental/estável.

O prompt recebe uma representação compacta do registry, não o código fonte dos componentes.

## 10.5 Blueprints

Crie blueprints flexíveis para:

- institucional orientado a autoridade;
- institucional local orientado a WhatsApp;
- landing page de agendamento;
- landing page de orçamento;
- landing page de oferta.

Blueprint define regras e possibilidades de sequência, não uma página fechada. A IA pode escolher, omitir ou reorganizar seções dentro das restrições de conversão.

## 10.6 Componentes externos e licenças

- 21st.dev e galerias semelhantes podem servir como referência ou fonte de componentes somente após verificar licença e compatibilidade.
- Não faça scraping dessas plataformas.
- Não use hotlink nem dependência de runtime em um site externo.
- Se adaptar código de terceiros, registre licença/atribuição exigida e converta-o ao design system interno.
- Prefira componentes mantidos no próprio repositório e testados.
- Reutilize o design system atual do CRM no editor, mas o design do site gerado possui tokens próprios.

---

# 11. DIREÇÃO CRIATIVA E SISTEMA VISUAL

## 11.1 Documento criativo interno

Antes de montar a página, a saída estruturada deve definir:

- posicionamento;
- objetivo de conversão;
- público principal;
- dores/objeções permitidas pelos fatos;
- tom de voz;
- conceito visual;
- lógica da paleta;
- lógica tipográfica;
- composição/ritmo;
- tratamento de fotografia;
- estilo de ícones;
- estilo dos CTAs;
- nível de movimento;
- narrativa da página.

Esse documento não precisa aparecer ao prospect, mas deve ser visível de forma resumida no editor.

## 11.2 Anti-template

Implemente mecanismos determinísticos adicionais:

- `creativeSeed` persistente por projeto;
- `designFingerprint` baseado em variantes, tipografia, paleta, composição e motion;
- comparação com projetos recentes do mesmo nicho;
- limite de similaridade configurável;
- seleção alternativa determinística quando a combinação estiver repetitiva;
- não gastar nova chamada de IA apenas para trocar uma variante equivalente.

Não use aleatoriedade caótica. O mesmo projeto deve ser reproduzível a partir da versão e seed.

## 11.3 Paletas

- Gerar paletas semânticas com contraste testado.
- Respeitar cor principal e destaque fornecidas.
- Quando a cor fornecida não tiver contraste, ajustar tonalidade preservando a intenção e informar no editor.
- Evitar excesso de gradientes e glassmorphism.
- Gradientes devem ser intencionais: destaque, botões, pequenos fundos ou elementos decorativos; não cobrir tudo por padrão.
- Tema escuro deve manter legibilidade real, não apenas fundo preto com texto cinza fraco.

## 11.4 Tipografia

- Criar allowlist de famílias gratuitas/licenciadas e adequadas ao export estático.
- Preferir fontes locais/subsetadas no bundle quando a licença permitir; caso use Google Fonts, considerar privacidade, performance e disponibilidade offline no ZIP.
- Limitar a duas famílias por site salvo justificativa excepcional.
- Usar escala fluida com `clamp()` e line-height coerente.
- Evitar textos comprimidos, títulos gigantes cortados ou peso baixo demais.

## 11.5 Ícones e detalhes

- Usar conjunto consistente, por exemplo Lucide quando compatível, convertido/bundled como SVG.
- Não usar emojis como ícones principais de uma interface premium.
- Não buscar ícones de CDN em runtime.
- Manter espessura, tamanho e alinhamento consistentes.

---

# 12. COPY PROFISSIONAL E REGRAS DE VERACIDADE

## 12.1 Idioma e estilo

- Português brasileiro natural.
- Adaptado ao nicho, público, cidade, objetivo e voz do negócio.
- Frases curtas e médias, com ritmo humano.
- Hierarquia clara e escaneável.
- CTAs específicos: “Agendar uma avaliação”, “Pedir orçamento no WhatsApp”, “Ver localização”, por exemplo.
- Trabalhar objeções reais sem manipulação.
- Priorizar clareza e benefício concreto.

## 12.2 Padrões a evitar

- travessões longos usados repetidamente como vício de IA;
- “transforme sua jornada”;
- “eleve sua experiência”;
- “excelência”, “inovação”, “único”, “personalizado” ou “solução completa” sem base;
- parágrafos que dizem muito e informam pouco;
- repetição da mesma promessa em todas as seções;
- urgência falsa, escassez artificial e promessas garantidas;
- excesso de adjetivos premium;
- títulos genéricos como “Sobre nós” quando um título contextual for melhor;
- FAQ inventado apenas para ocupar espaço.

Crie um linter de copy com avisos para clichês, placeholders, repetições e termos proibidos. Não faça um filtro cego que destrua frases legítimas; permita exceção manual registrada.

## 12.3 Proibições factuais

Não inventar:

- formação, registro profissional, CRN/CRM/OAB ou credencial;
- anos de experiência;
- quantidade de clientes;
- avaliações/notas;
- prêmios;
- depoimentos;
- resultados clínicos ou financeiros;
- preço, desconto ou prazo;
- endereço;
- marcas atendidas;
- garantias;
- certificações;
- disponibilidade de agenda.

Em nichos de saúde, não prometer cura, emagrecimento garantido ou resultado médico. Em qualquer nicho regulado, aplicar cautela e mostrar apenas fatos fornecidos.

## 12.4 Dados ausentes

- Se um dado não for necessário, omita a seção/campo.
- Se for essencial para publicar, mostre pendência apenas no editor.
- Nunca publique `[INSERIR TELEFONE]`, lorem ipsum ou conteúdo inventado.
- O site pode ser visualmente completo mesmo com menos seções; qualidade vale mais que preenchimento artificial.

# 13. ASSETS, FOTOS, LOGOS E GERAÇÃO DE IMAGENS

## 13.1 Fontes suportadas

Modele assets com proveniência e direitos. Fontes possíveis:

- upload manual;
- asset previamente salvo e autorizado no CRM;
- imagem gerada pela OpenAI;
- banco de imagens licenciado futuramente;
- referência externa permitida, sem cópia automática;
- integração oficial com Google/Instagram somente nos limites descritos abaixo.

Cada asset deve possuir, quando aplicável:

- id;
- source/provider;
- storage key;
- MIME real;
- largura/altura;
- checksum;
- tamanho;
- alt text;
- ponto focal;
- crop/transformações;
- status de direitos/autorização;
- atribuição;
- metadados do provider;
- data de expiração quando o uso for temporário.

## 13.2 Upload seguro

- Validar magic bytes e MIME, não apenas extensão.
- Definir limites de tamanho e dimensão.
- Aceitar PNG, JPEG, WebP e AVIF conforme suporte real.
- SVG deve ser sanitizado rigorosamente ou rasterizado; nunca executar scripts SVG.
- Corrigir orientação EXIF de forma determinística.
- Remover metadados sensíveis quando apropriado.
- Gerar versões otimizadas com `sharp` ou biblioteca equivalente existente.
- Proteger contra path traversal, zip bombs, decompression bombs e nomes maliciosos.
- Nunca confiar em uma URL externa fornecida pelo usuário sem proteção SSRF.

## 13.3 Tratamento e editor

Para cada imagem, permitir:

- substituir;
- escolher recorte;
- definir ponto focal X/Y;
- ajustar posição;
- editar alt text;
- restaurar enquadramento;
- visualizar desktop e celular;
- escolher fit/ratio apenas entre opções compatíveis com o componente.

Não criar um editor fotográfico completo. O objetivo é ajuste rápido.

## 13.4 OpenAI Images como integração opcional

Implemente um provider de geração/edição de imagens desacoplado. Use o SDK e endpoints oficiais atuais. A aplicação deve continuar funcional sem esta integração.

Variáveis configuráveis:

```dotenv
OPENAI_API_KEY=
OPENAI_IMAGE_PRIMARY_MODEL=
OPENAI_IMAGE_ECONOMY_MODEL=
OPENAI_IMAGE_TIMEOUT_MS=
SITE_IMAGE_PROVIDER=openai
SITE_IMAGE_GENERATION_ENABLED=false
```

Não hardcode preço ou modelo como verdade permanente. A configuração inicial pode recomendar o modelo de imagem atual da OpenAI, mas deve ser substituível sem alteração de código.

## 13.5 Plano de imagens

O provider textual deve retornar um plano estruturado para cada imagem necessária:

- seção/destino;
- função de comunicação;
- estilo;
- proporção;
- ponto focal;
- área de respiro para texto;
- relação com a paleta;
- elementos permitidos/proibidos;
- se precisa ser real, upload ou pode ser gerada;
- qualidade/modo econômico recomendado;
- prompt visual sem texto embutido, salvo necessidade deliberada.

A plataforma decide tamanho, qualidade, formato, compressão e armazenamento com base no orçamento e destino.

## 13.6 Modos de custo

Oferecer presets configuráveis:

| Modo | Comportamento esperado |
|---|---|
| Econômico | nenhuma imagem gerada ou uma imagem de apoio em qualidade econômica |
| Profissional | hero e até duas imagens de apoio dentro do orçamento |
| Premium | conjunto maior somente após confirmação explícita |

Para prospecção, o default deve ser **Econômico**. Defina limites por projeto para quantidade de imagens, tentativas e custo estimado. Regenerar imagem exige ação explícita.

## 13.7 Regras éticas e de credibilidade

- Foto do profissional: usar foto real autorizada.
- Logo: usar logo real, quando fornecida.
- Consultório/loja real: usar fotografia real, quando a seção afirmar que aquele é o local.
- Pessoas geradas podem ser apenas ilustração genérica e nunca identificadas como cliente/paciente/profissional real.
- Não criar antes/depois falso.
- Não criar depoimento visual falso.
- Não alterar rosto/corpo de uma pessoa real de forma que gere falsa representação.
- Marcar internamente a origem AI-generated, sem precisar exibir um selo no site quando não houver obrigação legal; preserve metadados de auditoria.

## 13.8 Google Maps/Perfil da Empresa

O fato de uma imagem ou dado estar publicamente visível no Google não significa autorização irrestrita para copiar, armazenar, redistribuir, alimentar outra IA ou incluir em um ZIP.

Regras obrigatórias:

- usar somente APIs oficiais;
- não raspar Google Maps, HTML, imagens ou endpoints não documentados;
- não remover atribuição;
- não contornar cache, quota ou faturamento;
- não enviar Google Maps Content bruto ao Claude/OpenAI sem permissão expressa dos termos atuais;
- não incorporar automaticamente fotos do Google no ZIP de produção se não houver direito de redistribuição;
- armazenar Place ID conforme permitido e respeitar regras específicas para demais campos/conteúdos;
- documentar a versão da API e os termos verificados.

Implemente uma interface `AssetSourceProvider` que permita uma futura integração oficial. O provider Google deve permanecer atrás de feature flag e só ser ativado depois de verificação jurídica/técnica dos termos aplicáveis à conta e API exatas. Se o uso temporário permitido for implementado, preserve atribuição, expiração e nunca o promova silenciosamente a asset exportável.

Para a primeira versão funcional, priorize upload manual e OpenAI Images opcional.

## 13.9 Instagram

- Não fazer scraping de perfil, feed ou imagens.
- Não burlar login, CORS ou API.
- Permitir salvar o link público e abrir o perfil para seleção manual.
- Integração de mídia só com API/autorização oficial adequada.
- Fotografias baixadas e reenviadas pelo administrador devem exigir confirmação de autorização de uso.

## 13.10 Sem análise visual dispendiosa automática

Não envie cada upload para IA apenas para escolher “a melhor foto”. Use regras determinísticas e permita escolha humana. Uma sugestão visual por IA pode ser acionada manualmente para um conjunto pequeno, com custo informado, mas não faz parte do fluxo obrigatório.

---

# 14. SISTEMA DE ANIMAÇÕES E INTERAÇÕES

## 14.1 Bibliotecas

Use:

- CSS para transições, estados, hover, focus e press simples;
- **GSAP** para animações coordenadas;
- **ScrollTrigger** para animações ligadas ao scroll;
- `gsap.matchMedia()` ou equivalente para breakpoints e `prefers-reduced-motion`;
- Lenis, pacote atual `lenis`, somente se o smooth scroll realmente melhorar o projeto;
- Three.js somente para presets especiais, curados e lazy-loaded;
- outra biblioteca apenas se houver ganho concreto, licença compatível e impacto de bundle medido.

Pin de versões, bundle local e documentação de licenças. Não depender de CDN externo para o funcionamento essencial.

## 14.2 Presets permitidos

Crie registry de motion com presets testados, por exemplo:

- `fade-up-soft`;
- `fade-in`;
- `stagger-cards`;
- `text-lines-reveal`;
- `image-mask-reveal`;
- `parallax-subtle`;
- `counter-on-view`;
- `header-condense-on-scroll`;
- `section-background-shift`;
- `cta-gradient-flow`;
- `button-hover-lift`;
- `button-press`;
- `progress-indicator`;
- `pinned-story-lite`;
- `scroll-video-lite`.

Cada preset deve definir:

- elementos-alvo por data attributes;
- duração/easing;
- gatilho;
- comportamento desktop/mobile;
- fallback reduced-motion;
- cleanup;
- custo/performance;
- componentes compatíveis.

A IA seleciona ids existentes, não escreve timelines GSAP.

## 14.3 Botões premium

Criar variantes reutilizáveis de botão com:

- gradiente estático ou movimento lento opcional;
- transição de cor/posição suave;
- hover com elevação ou brilho discreto;
- `:active` com escala/press curto;
- foco visível por teclado;
- contraste AA;
- área mínima de toque;
- estado disabled/loading;
- nenhum efeito dependente exclusivamente de hover para compreender a ação.

O gradiente não pode reduzir legibilidade nem parecer neon genérico em todos os projetos.

## 14.4 Scroll e movimento

- Animações devem começar quando o conteúdo entra em viewport, sem atrasos longos.
- Não ocultar conteúdo essencial se JavaScript falhar.
- Parallax deve ser discreto e desativado/reduzido em celular quando necessário.
- Pinning deve ser raro, curto e testado em Safari/iOS.
- Não sequestrar rolagem.
- Não usar smooth scroll se ele quebrar âncoras, teclado, back/forward ou acessibilidade.
- Links de menu devem chegar corretamente à seção mesmo com header fixo.

## 14.5 Vídeo controlado por scroll

Quando houver vídeo autorizado e otimizado:

- usar `<video muted playsinline>`;
- nunca iniciar áudio automaticamente;
- usar poster;
- carregar de modo econômico;
- fornecer fallback em celular/reduced-motion;
- pausar fora de viewport;
- somente controlar progresso por scroll se o arquivo, duração e device suportarem;
- impedir travamentos e consumo excessivo;
- não incluir vídeos enormes no ZIP sem aviso de tamanho.

## 14.6 Three.js

- Fora do fluxo padrão.
- Apenas cenas pré-construídas e testadas no registry.
- Lazy-load depois do conteúdo crítico.
- Desativar para devices fracos/reduced-motion e oferecer imagem fallback.
- Nunca aceitar código Three.js gerado livremente pela IA.
- O primeiro lançamento pode marcar presets 3D como experimental, sem bloquear o módulo principal.

## 14.7 Cleanup e preview

No editor, toda montagem/desmontagem deve limpar timelines, ScrollTriggers, observers e listeners. Alterações no schema não podem acumular animações duplicadas. O modo preview precisa oferecer **Reiniciar animações** e alternância de reduced-motion para QA.

---

# 15. RENDERER, PREVIEW E EDITOR

## 15.1 Layout do editor

Estrutura recomendada:

- barra superior;
- painel esquerdo de seções;
- canvas/iframe central;
- painel direito de propriedades;
- campo/comando de IA contextual.

Reutilize padrões visuais do CRM e mantenha a interface em português.

## 15.2 Barra superior

Incluir:

- voltar ao projeto/lead;
- nome do projeto;
- status salvo/salvando/erro;
- undo/redo;
- alternância **Computador** e **Celular** apenas;
- preview sem painéis;
- histórico de versões;
- publicar/atualizar publicação;
- abrir site publicado;
- WhatsApp;
- baixar ZIP.

O usuário não quer seletor visível de tablet. Teste tablet/intermediários automaticamente, mas mantenha a UI simples.

## 15.3 Painel de seções

Permitir:

- selecionar;
- reordenar por drag-and-drop com alternativa de teclado;
- ocultar/mostrar;
- duplicar;
- excluir com confirmação/undo;
- adicionar seção pelo catálogo;
- trocar variante compatível;
- mostrar avisos de conteúdo;
- acessar edição com IA da seção.

Bloquear combinações incompatíveis e explicar o motivo.

## 15.4 Canvas

- Renderizar em ambiente isolado por iframe ou isolamento equivalente.
- Usar exatamente o renderer do projeto.
- Permitir larguras realistas de desktop e celular.
- Zoom somente como ajuda visual; não confundir zoom com responsividade.
- Links externos não devem tirar o administrador do editor sem confirmação.
- Exibir erro de renderização sem derrubar o CRM.
- Incluir recarregar/reiniciar motion.

## 15.5 Painel de propriedades

Conforme a seleção, permitir editar:

- textos;
- headings;
- CTA e link;
- telefone/WhatsApp;
- cards/serviços/itens;
- ícones da allowlist;
- cores e fundos permitidos;
- logo;
- imagem, crop e focal point;
- alinhamento/densidade dentro de opções seguras;
- variante;
- motion preset;
- âncora/menu;
- visibilidade desktop/mobile apenas quando realmente necessária.

Não exponha CSS bruto, JavaScript, HTML ou classes arbitrárias.

## 15.6 Edição de listas e componentes

Permitir adicionar/remover/reordenar:

- serviços;
- benefícios;
- passos;
- perguntas;
- depoimentos fornecidos;
- botões;
- links sociais;
- cards.

Respeitar min/max do registry. A interface deve validar antes de salvar.

## 15.7 Comandos por IA

Adicionar campo de comando para solicitações como:

- “deixe esta hero mais sofisticada”;
- “reduza o texto”;
- “adicione um serviço de avaliação nutricional”;
- “troque esta seção por uma composição mais editorial”;
- “crie uma seção de perguntas frequentes com base apenas nestas informações”.

O comando deve atuar no escopo escolhido. Para ação global, exigir indicação explícita. Mostrar o que mudou e permitir desfazer.

## 15.8 Autosave e concorrência

- Autosave debounced.
- Indicador real de persistência.
- Optimistic locking/version column para impedir sobrescrita acidental.
- Em conflito, não perder edição; oferecer recarregar/mesclar de forma simples.
- Nunca salvar somente no `localStorage`.
- Local draft pode ser apoio temporário, mas o banco é a fonte persistente.

## 15.9 Versões

Criar versão em:

- geração inicial bem-sucedida;
- mudança estrutural importante;
- aplicação de patch por IA;
- publicação;
- ação manual **Criar versão**.

Não criar milhares de snapshots para cada tecla. Agrupe autosaves. Permitir visualizar resumo, autor/origem, data e restaurar.

## 15.10 QA no editor

Mostrar painel de avisos com:

- conteúdo ausente;
- contraste;
- link inválido;
- imagem ausente;
- overflow detectado;
- CTA inconsistente;
- falta de alt;
- SEO incompleto;
- fato não confirmado;
- custo/tamanho do projeto.

Publicação deve bloquear somente erros críticos; avisos precisam de confirmação consciente.

---

# 16. PUBLICAÇÃO DA DEMONSTRAÇÃO NA HOSTINGER

## 16.1 Regra de infraestrutura

O site precisa ficar acessível na internet para qualquer prospect com o link, sem login e sem depender do computador do administrador.

Não publicar em localhost, URL interna, memória do browser ou filesystem temporário.

Use a infraestrutura atual e configure uma origem pública única, por exemplo:

`https://sites.instal.digital.com.br`

O valor real deve vir de:

```dotenv
PUBLIC_SITES_BASE_URL=
PUBLIC_SITES_HOST_ALLOWLIST=
SITE_PUBLIC_STORAGE_DRIVER=local
SITE_PUBLIC_ASSETS_DIR=
```

O nome acima é sugestão. Não crie automaticamente subdomínio por cliente. Oriente uma única configuração manual de DNS/domínio/SSL no hPanel, se a hospedagem atual permitir associar a origem à mesma aplicação. Se não permitir, use uma rota pública neutra na origem existente, como:

`https://crm.instal.digital.com.br/p/nome-do-negocio`

Não mude para VPS, Netlify ou outra arquitetura sem necessidade/autorização.

## 16.2 Slug

- Preferir o nome sanitizado por extenso: `/nome-do-negocio`.
- Sem `demo`, `demonstracao`, `preview` ou termos semelhantes.
- Slug único, minúsculo, com hífens e sem caracteres inseguros.
- Em colisão, tentar nome + cidade; depois usar sufixo neutro curto.
- Permitir edição antes da primeira publicação.
- Depois de compartilhado, manter URL estável; se houver alteração, criar redirect seguro quando possível.
- Não expor ids sequenciais do banco.

## 16.3 Draft versus publicação

- Draft autenticado e mutável.
- Publicação é snapshot imutável.
- Editar draft não altera site público até clicar **Atualizar publicação**.
- Publicar gera artefato completo em diretório/chave versionada e depois troca o ponteiro ativo atomicamente.
- Se a nova publicação falhar, a anterior continua no ar.
- Link público permanece igual.
- Permitir rollback para publicação anterior.
- Permitir despublicar com confirmação; mostrar página 404/indisponível neutra, sem dados internos.

## 16.4 Armazenamento persistente

Crie interface de storage. Para o MVP na Hostinger:

- usar diretório persistente configurável, nunca `/tmp`;
- validar no startup capacidade de escrever, ler e remover arquivo de teste seguro;
- não assumir que a pasta de build/deploy sobrevive a uma nova implantação;
- documentar onde o hPanel preserva uploads no ambiente real;
- salvar metadados e checksums no banco;
- preparar adapter futuro S3-compatible sem exigir S3 nesta fase;
- não armazenar imagens grandes em BLOB no MySQL sem justificativa e medição.

Se não for possível comprovar persistência do filesystem da Hostinger, pare antes da publicação real e apresente a menor alternativa compatível. Todo o restante pode continuar implementado e testado em ambiente local/mocked.

## 16.5 Roteamento público

- A rota pública não passa pelo middleware de autenticação.
- Não expõe API privada, notas do CRM, briefing interno, custos ou prompts.
- Serve apenas o snapshot ativo e assets necessários.
- Recarregar a URL deve funcionar.
- Tratar trailing slash e caminhos de assets.
- Definir cache headers: HTML revalidável; assets com hash e cache longo/imutável.
- Definir CSP compatível com os recursos realmente usados.
- Forçar HTTPS em produção.
- Não permitir directory listing.

## 16.6 Sem indicação visível de demonstração

Não inserir:

- selo “site demonstrativo”;
- banner da agência dizendo que é demo;
- texto “este site é apenas uma prévia”;
- slug com demo;
- meta description dizendo demo;
- watermark.

A marca/agência só aparece se o administrador escolher um crédito discreto como componente opcional. O default é não exibir.

## 16.7 Indexação e privacidade

Para o perfil de demonstração:

- `<meta name="robots" content="noindex,nofollow,noarchive">`;
- header `X-Robots-Tag` equivalente quando possível;
- não incluir em sitemap global;
- não enviar a mecanismos de busca;
- não expor listagem de projetos;
- URL acessível a quem recebeu o link.

`noindex` não é autenticação. Não coloque dados privados/sensíveis na página.

## 16.8 Smoke test obrigatório após publicação

Antes de liberar o botão de copiar/enviar, testar anonimamente:

- status HTTP 200;
- ausência de redirect para login;
- HTML, CSS, JS, fontes e imagens;
- reload da URL;
- menu e âncoras;
- WhatsApp;
- console sem erro crítico;
- desktop e celular;
- meta robots;
- conteúdo igual à versão publicada;
- nenhum vazamento de dados privados.

Se falhar, não substituir a publicação anterior e não informar sucesso.

---

# 17. EXPORTAÇÃO ZIP ESTÁTICA

## 17.1 Objetivo

Gerar um pacote estático pronto para implantação manual em Netlify Drop, Hostinger, VPS ou outro host estático.

O ZIP de entrega deve abrir sem:

- banco de dados;
- API da plataforma;
- Node.js no destino;
- chave Anthropic/OpenAI;
- autenticação do CRM;
- etapa de build obrigatória;
- links absolutos para localhost ou ambiente interno.

## 17.2 Estrutura de saída

Estrutura mínima:

```text
nome-do-negocio.zip
  index.html
  404.html
  favicon.ico ou favicon.svg sanitizado
  robots.txt
  sitemap.xml
  assets/
    css/
    js/
    images/
    fonts/
  README-DEPLOY.txt
```

Não incluir source maps públicos, segredos, prompts, dados de CRM, arquivos de teste, configurações internas ou código de backend.

## 17.3 Perfil de produção versus demonstração

O mesmo projeto possui dois perfis:

- **Demonstração:** noindex, origem pública temporária da agência.
- **Produção/ZIP:** indexável por padrão somente após confirmação; canonical, sitemap e robots baseados no domínio final.

Antes de exportar, solicitar/revisar:

- domínio final, se já existir;
- permitir indexação;
- WhatsApp final;
- nome/descrição final;
- imagem Open Graph;
- analytics/cookies: não incluir por padrão;
- mapa/chave do cliente quando aplicável.

Se o domínio ainda não existir, não gerar canonical falso. O ZIP pode conter instrução de atualização.

## 17.4 Assets e dependências

- Usar caminhos relativos/base-safe.
- Bundle de GSAP, runtime e dependências necessárias.
- Sem CDN frágil para funcionalidade essencial.
- Fontes e ícones legalmente redistribuíveis.
- Imagens em formatos otimizados com fallback quando necessário.
- `srcset`/`sizes` apropriados.
- Preload apenas da imagem/fonte crítica real.
- Lazy loading para conteúdo abaixo da dobra.
- Vídeos com tamanho indicado e fallback.
- Não exportar asset temporário do Google/Instagram sem direito.

## 17.5 Formulário e interações

O formulário deve funcionar inteiramente no navegador:

1. validar campos;
2. montar mensagem;
3. normalizar e codificar;
4. abrir `https://wa.me/...`;
5. não prometer envio.

Menu, FAQ, botões, animações e links devem funcionar sem backend.

## 17.6 Validação do ZIP

Antes de permitir download:

1. gerar em diretório temporário de job com caminho explicitamente seguro;
2. validar manifest/checksums;
3. extrair em outro diretório temporário controlado;
4. servir com servidor estático;
5. executar smoke tests e Playwright em desktop/mobile;
6. procurar segredos, `localhost`, URLs privadas e paths absolutos;
7. verificar tamanho;
8. apagar arquivos temporários após conclusão, sem tocar em diretórios amplos;
9. persistir o ZIP final em storage autorizado com expiração/configuração adequada.

O download deve ser idempotente. Não cobrar nova chamada de IA para exportar um draft que já está válido.

## 17.7 README de implantação

Incluir instruções curtas em português para:

- Netlify Drop: arrastar a pasta/ZIP conforme o fluxo atual suportado;
- Hostinger: enviar/extrair no diretório público;
- configurar domínio;
- atualizar canonical/sitemap se necessário;
- não compartilhar chaves;
- testar HTTPS, WhatsApp e formulário.

Não implementar o deploy; apenas preparar o pacote.

---

# 18. WHATSAPP E ABORDAGEM DO PROSPECT

## 18.1 Número

- Preencher pelo lead quando houver telefone válido.
- Normalizar para E.164 brasileiro sem alterar número estrangeiro válido.
- Exibir número para revisão.
- Se ausente/inválido, permitir preencher manualmente e opcionalmente salvar no lead.
- Não afirmar tecnicamente que o telefone possui conta WhatsApp antes de confirmação.

## 18.2 Mensagem sugerida por IA

Gerar uma mensagem curta, humana e específica que:

- mencione o negócio pelo nome;
- explique de forma simples que foi preparada uma proposta visual para o negócio;
- inclua o link público;
- não use pressão, promessa ou mensagem genérica de massa;
- termine com uma pergunta fácil de responder;
- não diga “disparei uma demo automática”;
- não invente que analisou problemas que não foram verificados.

Permitir:

- editar;
- regenerar;
- encurtar;
- tornar mais direto;
- copiar;
- abrir no WhatsApp.

Use o modelo rápido e um contexto compacto. Não reenvie o SiteSchema completo; use nome, nicho, direção/resumo e URL.

## 18.3 Envio

- Botão principal: **Abrir no WhatsApp** ou **Enviar pelo WhatsApp** com explicação de que a confirmação ocorre no aplicativo.
- Abrir `wa.me` em nova aba/app com mensagem codificada.
- Depois que o administrador voltar, perguntar **A mensagem foi enviada?**.
- Somente com confirmação registrar evento de contato/mensagem e, se a regra atual permitir, sugerir mudança de etapa.
- Não mover automaticamente o lead só porque o deep link foi aberto.

## 18.4 Histórico

Salvar:

- projeto/publicação usada;
- mensagem gerada/editada;
- timestamp de abertura;
- confirmação manual de envio, se dada;
- usuário;
- relação com lead.

Evite armazenar dados além do necessário e siga o padrão de audit log atual.

---

# 19. SEO, SEO LOCAL E GEO/GIO

## 19.1 SEO técnico básico obrigatório

Todo site deve produzir:

- HTML semântico;
- `lang="pt-BR"`;
- um H1;
- hierarquia de headings válida;
- `title` e meta description específicos;
- viewport;
- canonical somente quando houver domínio final conhecido;
- Open Graph e Twitter cards;
- favicon;
- alt text;
- links descritivos;
- robots conforme perfil;
- sitemap no ZIP de produção quando houver URL final;
- JSON-LD compatível com fatos visíveis;
- performance e responsividade;
- status/404 adequados;
- nenhuma keyword stuffing ou texto oculto.

## 19.2 SEO local

Quando houver fatos confirmados:

- nome, endereço e telefone consistentes;
- cidade/bairros/área atendida em contexto natural;
- serviços locais claros;
- seção de localização/contato;
- link oficial do Google Maps;
- `LocalBusiness`, subtipo apropriado, `ProfessionalService` ou `Person` somente quando coerente;
- horários somente se fornecidos;
- geo coordinates somente se permitidas e atuais;
- não inventar reviews/rating.

## 19.3 GEO/GIO — otimização para respostas generativas

Não existe “meta tag mágica” que garanta citação por IA. Implemente fundamentos verificáveis:

- entidade claramente identificada;
- serviços, público e localidade explícitos;
- parágrafos que respondem perguntas diretamente;
- FAQ factual;
- autoridade/credenciais apenas confirmadas;
- estrutura semântica;
- dados estruturados coerentes com o conteúdo visível;
- linguagem específica, não inflada;
- informações de contato consistentes;
- conteúdo acessível no HTML inicial;
- robots configurável para mecanismos/crawlers sem confundir indexador de busca com crawler de treinamento.

Um eventual `llms.txt` deve ser opcional e nunca apresentado como fator garantido. Não gerar conteúdo oculto para IA.

## 19.4 Mapa

- Sempre permitir card de endereço + botão **Ver no Google Maps** quando houver Place ID/endereço permitido.
- Para iframe, usar integração oficial e chave apropriadamente restrita ao domínio.
- Não colocar chave secreta do backend no ZIP.
- Se não houver chave do cliente na exportação, manter endereço e link, ou pedir configuração; não quebrar a página.
- No ambiente da agência, chave browser pode ser usada somente com restrições de domínio/API/quota adequadas.

## 19.5 Validação

Criar validadores para:

- title/description;
- H1;
- headings;
- canonical;
- JSON-LD contra fatos;
- OG asset;
- robots de demo versus produção;
- NAP;
- links quebrados;
- alt text;
- conteúdo indexável no HTML.

# 20. MODELO DE DADOS E MIGRAÇÕES

Adapte aos padrões atuais de id, nomenclatura, ORM e timestamps. Use MySQL `JSON` somente onde fizer sentido e preserve índices/constraints relacionais.

## 20.1 `site_projects`

Campos conceituais:

- id não sequencial exposto, seguindo o padrão interno;
- owner/user id;
- `lead_id` nullable e indexado;
- nome interno;
- nome do negócio;
- tipo do site;
- status;
- slug desejado/ativo;
- `draft_config_json`;
- `schema_version`;
- `renderer_version`;
- `prompt_version`;
- `creative_seed`;
- `design_fingerprint`;
- `current_version_number`;
- `active_publication_id` nullable;
- `lock_version`;
- custo acumulado estimado/registrado;
- created/updated/archived/deleted timestamps.

Status sugeridos:

`briefing`, `queued`, `generating`, `ready`, `published`, `failed`, `archived`.

Use enum somente se a estratégia de migração atual lida bem com evolução; caso contrário, constraint/validação no domínio.

## 20.2 `site_project_versions`

- id;
- project id;
- número único por projeto;
- config JSON validada;
- schema/renderer/prompt versions;
- origem: generation/manual/ai_patch/restore/publication;
- resumo;
- created by;
- created at;
- checksum.

Imutável após criação.

## 20.3 `site_generation_jobs`

- id;
- project id;
- tipo: initial_generation, section_patch, copy_patch, image_generation, visual_review, export, publication_build;
- idempotency key única no escopo;
- status;
- stage atual;
- progresso 0–100 apenas como representação de eventos reais;
- provider/model;
- input snapshot hash;
- attempt/max attempts;
- priority;
- lease owner/expiration quando necessário;
- `cancel_requested_at`;
- started/finished timestamps;
- erro sanitizado, code e retryable;
- resultado/reference id;
- created/updated.

## 20.4 `site_generation_events`

- id;
- job id;
- sequence;
- event type;
- stage;
- mensagem pública em português;
- metadata segura;
- timestamp.

Unique por `(job_id, sequence)`. Eventos alimentam SSE e histórico. Não invente progresso no frontend.

## 20.5 `site_assets`

- id;
- project id;
- source;
- provider/model quando aplicável;
- storage key;
- original filename sanitizado;
- MIME;
- dimensões;
- size;
- checksum;
- alt;
- focal point;
- transforms JSON limitada;
- rights status;
- attribution JSON;
- external reference/provider id;
- expires at;
- created by/at;
- soft delete.

## 20.6 `site_publications`

- id;
- project id;
- project version id;
- número de publicação;
- slug;
- status: building, active, superseded, failed, unpublished;
- artifact storage key;
- manifest/checksum;
- base URL snapshot;
- noindex;
- smoke test result;
- published by/at;
- superseded/unpublished timestamps;
- failure code/message sanitizada.

Garanta no máximo uma publicação ativa por projeto e slug ativo único.

## 20.7 `site_ai_usage`

- id;
- project/job id;
- provider;
- operation;
- model;
- provider request id;
- input tokens;
- cache creation/read tokens, se disponíveis;
- output tokens;
- image count/size/quality;
- cost estimated;
- cost actual quando fornecido/calculável;
- currency;
- pricing version/source;
- status;
- latency;
- created at.

Use decimal com precisão adequada. Nunca use float para dinheiro.

## 20.8 `site_outreach_messages`

- id;
- project/publication/lead ids;
- phone snapshot normalizado;
- message text;
- generated by/model nullable;
- opened at;
- confirmed sent at;
- created by/at.

## 20.9 Configurações

Reutilize `app_settings` se apropriado. Caso contrário, modele settings sem guardar segredos em plaintext no banco. Configurações:

- feature flag;
- providers/model ids;
- concurrency;
- orçamento por projeto e mensal;
- limites de imagem;
- default de qualidade;
- public base URL;
- storage driver/diagnóstico;
- prompt version ativa;
- perfil de motion;
- limites de upload/export;
- preços de referência atualizáveis.

Segredos permanecem em variáveis de ambiente/secrets manager do host.

## 20.10 Invariantes e índices

- foreign keys coerentes com soft delete existente;
- índice por lead/status/updated_at;
- unique de version por projeto;
- unique de idempotency key;
- unique de slug ativo;
- índices de claim da fila;
- jobs não podem ficar eternamente running sem lease/recovery;
- publicação aponta para versão válida;
- projeto não aponta para publication de outro projeto;
- uso de IA é append-only/auditável;
- nenhuma exclusão de lead em cascata deve destruir silenciosamente publicação/usage histórico; siga política atual.

## 20.11 Migrações

- Backup/instrução de backup antes de produção.
- Migrações reproduzíveis e idempotentes conforme ferramenta atual.
- Não editar migrações já aplicadas.
- Testar banco vazio e upgrade de fixture representativa.
- Não bloquear tabelas grandes por mais tempo que necessário.
- Fazer backfill separado e controlado.

---

# 21. API INTERNA E CONTRATOS

Use o padrão atual de rotas, controllers, services, auth, validação e envelope de erros. A lista abaixo é conceitual:

## 21.1 Projetos

```text
GET    /api/site-projects
POST   /api/site-projects
GET    /api/site-projects/:id
PATCH  /api/site-projects/:id
DELETE /api/site-projects/:id
POST   /api/site-projects/:id/archive
POST   /api/site-projects/:id/duplicate
```

## 21.2 Geração e jobs

```text
POST   /api/site-projects/:id/generate
GET    /api/site-jobs/:jobId
GET    /api/site-jobs/:jobId/events
GET    /api/site-jobs/:jobId/stream
POST   /api/site-jobs/:jobId/cancel
POST   /api/site-jobs/:jobId/retry
```

## 21.3 Editor e versões

```text
PATCH  /api/site-projects/:id/config
POST   /api/site-projects/:id/sections
PATCH  /api/site-projects/:id/sections/:sectionId
DELETE /api/site-projects/:id/sections/:sectionId
POST   /api/site-projects/:id/sections/:sectionId/ai-edit
POST   /api/site-projects/:id/ai-edit
GET    /api/site-projects/:id/versions
POST   /api/site-projects/:id/versions/:versionId/restore
```

Uma rota genérica de patch pode substituir rotas granulares se houver allowlist rigorosa e o padrão do projeto favorecer isso.

## 21.4 Assets

```text
POST   /api/site-projects/:id/assets
PATCH  /api/site-projects/:id/assets/:assetId
DELETE /api/site-projects/:id/assets/:assetId
POST   /api/site-projects/:id/assets/generate
```

Uploads devem usar streaming/limites; geração de imagem é job.

## 21.5 Publicação e exportação

```text
POST   /api/site-projects/:id/publish
POST   /api/site-projects/:id/unpublish
POST   /api/site-projects/:id/publications/:publicationId/rollback
GET    /api/site-projects/:id/publications
POST   /api/site-projects/:id/exports
GET    /api/site-exports/:jobId/download
```

## 21.6 WhatsApp

```text
POST   /api/site-projects/:id/outreach/generate
PATCH  /api/site-projects/:id/outreach/:messageId
POST   /api/site-projects/:id/outreach/:messageId/opened
POST   /api/site-projects/:id/outreach/:messageId/confirm-sent
```

## 21.7 Regras de API

- autenticação e autorização em todas as rotas privadas;
- rota pública somente para artefato publicado;
- validação de body/query/params;
- limite de payload;
- idempotency key em generate, publish, export e chamadas caras;
- request id/correlation id;
- status HTTP correto;
- erros estáveis e traduzíveis;
- não retornar stack/secrets;
- rate limiting de chamadas caras;
- transações para mudanças compostas;
- paginação em listas;
- ETag/version para conflito de edição quando útil.

---

# 22. FILA PERSISTENTE, PROGRESSO E RECUPERAÇÃO

## 22.1 Sem dependência obrigatória de Redis

A hospedagem atual não deve depender de Redis ou processo adicional. Implemente uma fila respaldada pelo MySQL, com worker no processo Node existente, salvo se o repositório já possuir solução compatível.

Default:

- concorrência 1 para geração pesada;
- concorrência separada e pequena para export/publication build;
- claim atômico;
- lease com heartbeat;
- recuperação de lease expirado;
- backoff limitado;
- shutdown gracioso;
- retomada após reinício.

Confirme versão do MySQL antes de usar `SKIP LOCKED`; tenha estratégia atômica compatível se não estiver disponível.

## 22.2 Stages reais

Eventos sugeridos, emitidos quando a etapa realmente começa/termina:

1. `validating_briefing` — Organizando as informações do negócio;
2. `planning` — Definindo estratégia e direção criativa;
3. `generating_content` — Criando estrutura e textos;
4. `validating_schema` — Validando o projeto;
5. `preparing_assets` — Preparando imagens e identidade;
6. `rendering` — Montando as seções;
7. `applying_motion` — Configurando interações;
8. `quality_check` — Conferindo responsividade, SEO e qualidade;
9. `saving_version` — Salvando a primeira versão;
10. `completed` — Site pronto para revisão.

Não afirmar “hero finalizada” se o sistema ainda não tem confirmação real dessa unidade. Não usar timers aleatórios para fingir progresso.

## 22.3 Atualização do frontend

- SSE autenticado como principal se compatível;
- polling com backoff como fallback;
- heartbeat e reconnect com last event id;
- estado vindo do banco, não apenas da conexão aberta;
- ao recarregar, buscar snapshot atual e continuar;
- ao sair, job permanece;
- alertar no sistema existente quando concluir/falhar, se houver módulo de alertas reutilizável.

## 22.4 Cancelar/repetir

- Cancelamento marca solicitação e para no próximo ponto seguro.
- Não deixar projeto corrompido.
- Retry reaproveita resultados seguros já obtidos quando possível.
- Não repetir chamada paga se a resposta válida já foi persistida e apenas o renderer falhou.
- Evitar cobrança duplicada em timeout ambíguo usando provider request id/idempotência quando suportado.
- Mensagens de erro públicas devem ser úteis e sanitizadas.

---

# 23. CONTROLE DE TOKENS, CUSTOS E QUOTAS

## 23.1 Princípios

- Custo é parte do produto, não log opcional.
- Não hardcode tabela de preços eterna.
- Registrar uso retornado pelos providers.
- Mostrar estimativa antes de geração e valor registrado depois.
- Diferenciar estimado de confirmado/calculado.
- Orçamento deve bloquear antes da chamada cara.
- Não criar loop autônomo de “melhore até ficar perfeito”.

## 23.2 Limites configuráveis

```dotenv
SITE_AI_MONTHLY_BUDGET_USD=
SITE_AI_DEFAULT_PROJECT_BUDGET_USD=
SITE_AI_MAX_GENERATION_ATTEMPTS=2
SITE_AI_MAX_REPAIR_ATTEMPTS=1
SITE_AI_MAX_IMAGES_ECONOMY=1
SITE_AI_MAX_IMAGES_PROFESSIONAL=3
SITE_AI_MAX_IMAGES_PREMIUM=5
SITE_AI_JOB_CONCURRENCY=1
```

Adapte nomes. Valores sensíveis/monetários podem estar em settings, mas a aplicação precisa de hard caps de segurança no backend.

## 23.3 Estratégias de economia

- uma chamada estruturada principal;
- prompt do sistema estável e versionado;
- prompt caching da Anthropic quando suportado e vantajoso;
- monitorar cache hit/read/create tokens;
- modelo rápido para pequenas revisões e mensagem de prospecção;
- contexto mínimo por seção;
- nenhuma geração de código pela IA;
- nenhuma classificação de todas as fotos;
- revisão visual paga apenas manual;
- imagens limitadas por preset;
- uma única variação inicial;
- cache de resultados idempotentes;
- não regenerar para exportar/publicar;
- interromper após limite de reparo.

## 23.4 UI de consumo

Mostrar no projeto:

- modo escolhido;
- provider/model;
- tokens de entrada/saída/cache;
- imagens;
- custo estimado/registrado;
- número de tentativas;
- orçamento restante;
- aviso antes de ultrapassar limite.

Criar tela/configuração simples de consumo mensal. Não precisa ser sistema financeiro completo.

---

# 24. CONFIGURAÇÃO E DIAGNÓSTICO

## 24.1 Tela de configuração

Adicionar área administrativa de **Sites com IA** com:

- módulo ativo/inativo;
- Anthropic configurada: sim/não;
- OpenAI Images configurada: sim/não;
- ids de modelos efetivos, sem mostrar keys;
- modo padrão de imagens;
- limites de orçamento;
- public base URL;
- diagnóstico do storage;
- status do worker;
- versão do prompt/schema/renderer;
- botão de teste que use operação mínima ou mock e informe se haverá custo;
- links para documentação de configuração.

## 24.2 `.env.example`

Documentar, conforme aplicável:

```dotenv
SITE_AI_ENABLED=false
SITE_AI_MOCK_MODE=false
SITE_AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=
ANTHROPIC_SITE_MODEL=
ANTHROPIC_FAST_MODEL=
ANTHROPIC_MAX_OUTPUT_TOKENS=
ANTHROPIC_TIMEOUT_MS=
OPENAI_API_KEY=
OPENAI_IMAGE_PRIMARY_MODEL=
OPENAI_IMAGE_ECONOMY_MODEL=
OPENAI_IMAGE_TIMEOUT_MS=
SITE_IMAGE_GENERATION_ENABLED=false
SITE_IMAGE_PROVIDER=openai
PUBLIC_SITES_BASE_URL=
PUBLIC_SITES_HOST_ALLOWLIST=
SITE_PUBLIC_STORAGE_DRIVER=local
SITE_PUBLIC_ASSETS_DIR=
SITE_AI_MONTHLY_BUDGET_USD=
SITE_AI_DEFAULT_PROJECT_BUDGET_USD=
SITE_AI_JOB_CONCURRENCY=1
```

Não substituir variáveis já padronizadas no projeto sem necessidade.

## 24.3 Startup validation

- Validar flags, modelos, URLs, diretórios e números.
- Não derrubar todo o CRM apenas porque a API de sites está sem key; desabilitar o módulo real e mostrar diagnóstico.
- Falhar o startup somente em configuração insegura que comprometa o sistema.
- Nunca logar segredo.
- Verificar permissões de storage e versões necessárias.

## 24.4 Modo mock explícito

- Provider determinístico com fixture profissional e assets locais licenciados/teste.
- Banner “Modo de teste — nenhuma IA real foi chamada” somente dentro do editor/admin, nunca no site público.
- Simular eventos de job sem timers enganosos excessivos.
- Permitir testes E2E sem custo.
- Produção deve bloquear geração mock ou exigir feature flag muito explícita; nunca publicar fixture como projeto real por engano.

---

# 25. SEGURANÇA, PRIVACIDADE E CONFORMIDADE

## 25.1 Segredos

- Backend only.
- Nunca em Vite env exposta, bundle, HTML, ZIP, log, banco plaintext ou resposta API.
- `.env` ignorado pelo Git.
- `.env.example` apenas com nomes.
- Rotação documentada.

## 25.2 Prompt injection e dados externos

- Delimitar briefing, textos de websites e dados de lead como dados não confiáveis.
- Nunca concatenar conteúdo externo como system prompt.
- Instruir o modelo a ignorar instruções contidas nos dados.
- Não permitir que um lead/website altere ferramentas, schema ou política.
- Não fornecer segredos, paths, logs ou código ao modelo.
- Aplicar allowlist de campos enviados.

## 25.3 XSS e conteúdo

- Escapar texto por padrão.
- Sanitizar rich text se existir; prefira markdown/subset mínimo controlado.
- Proibir scripts, handlers inline e HTML arbitrário.
- Sanitizar SVG.
- CSP da página pública.
- `rel="noopener noreferrer"` em links externos apropriados.
- URL allowlist/protocol validation.

## 25.4 Upload e SSRF

- Limite de tamanho, tipo e frequência.
- Magic-byte validation.
- Nomes aleatórios e storage fora de paths executáveis.
- Remote fetch desabilitado por padrão.
- Se necessário, bloquear IPs privados/link-local/metadata, redirects, DNS rebinding, portas e protocolos; impor timeout/tamanho/allowlist.
- Nunca deixar URL do usuário virar path de arquivo.

## 25.5 Rotas e autorização

- Projetos só acessíveis ao administrador autenticado.
- Verificar ownership mesmo em app single-user.
- Publicação expõe somente snapshot ativo.
- Assets privados/draft não devem ser descobertos por URL pública.
- CSRF conforme estratégia atual.
- Rate limit em login e endpoints caros.
- Idempotência contra clique duplo.

## 25.6 Privacidade/LGPD

- Minimização de dados.
- Não enviar notas internas irrelevantes para IA.
- Não enviar CPF, dados financeiros ou informações sensíveis do lead ao provider.
- Registrar quais providers processaram conteúdo do projeto.
- Permitir apagar/arquivar projeto e assets conforme política, preservando audit mínimo legal.
- Definir retenção de ZIPs temporários e jobs.
- Não incluir dados pessoais ocultos no HTML/metadata.

## 25.7 Google e terceiros

- Termos da API prevalecem sobre a suposição de que “é público”.
- Verificar políticas oficiais atuais para a API, conta/região e campo exatos.
- Place IDs podem ser tratados conforme exceção oficial de cache.
- Demais Google Maps Content precisa seguir cache, atribuição, exibição e redistribuição permitidos.
- Não copiar fotos/avaliações para treinar/abastecer IA sem permissão.
- Não raspar Instagram ou Google.
- Registrar source e expiry quando exigidos.

## 25.8 Dependências

- Auditoria de licença e vulnerabilidade.
- Fixar versões/reprodutibilidade.
- Não adicionar biblioteca grande para um efeito simples.
- GSAP/ScrollTrigger, Lenis, Three.js e componentes externos devem ter licenças atuais verificadas antes de produção.
- Não executar código remoto.

---

# 26. PERFORMANCE, RESPONSIVIDADE E ACESSIBILIDADE

## 26.1 Responsividade

Editor visível em dois modos: computador e celular. Testes automáticos em:

- 320px;
- 360px;
- 390px;
- 768px;
- 1024px;
- 1440px.

Requisitos:

- sem overflow horizontal;
- menu móvel funcional;
- texto sem corte;
- botões tocáveis;
- imagens com crop correto;
- grid que se reorganiza;
- vídeo/3D com fallback;
- animações ajustadas;
- formulário utilizável;
- anchors corretas.

## 26.2 Metas de performance

Em fixture representativa e ambiente de teste consistente, buscar:

- LCP <= 2,5s;
- CLS <= 0,1;
- INP em faixa saudável;
- Lighthouse Performance mobile >= 85, com ressalva documentada para mapas/vídeo;
- Accessibility, Best Practices e SEO >= 90;
- bundle JS inicial comprimido <= 250 KB sempre que viável, excluindo módulos opcionais lazy-loaded medidos separadamente.

Não manipular teste escondendo conteúdo. Reportar ambiente e limitações.

## 26.3 Estratégias

- HTML inicial com conteúdo;
- CSS crítico enxuto;
- imagens dimensionadas;
- WebP/AVIF e fallback quando necessário;
- `srcset`;
- lazy load abaixo da dobra;
- preload apenas de recurso crítico;
- fontes subsetadas e `font-display` adequado;
- GSAP tree/bundle consciente;
- Three.js/vídeo lazy;
- mapa abaixo da dobra e lazy;
- cache de assets com hash;
- sem trackers por padrão.

## 26.4 Acessibilidade

- HTML semântico;
- navegação por teclado;
- ordem de foco;
- skip link;
- foco visível;
- contraste WCAG AA;
- labels e mensagens de erro;
- accordion com ARIA/teclado corretos;
- menu móvel com focus management;
- alt adequado;
- ícones decorativos ocultos de leitores;
- touch targets;
- `prefers-reduced-motion`;
- não depender de cor/hover/movimento para significado;
- formulários anunciando validações;
- título da página e landmarks.

# 27. ESTRATÉGIA DE TESTES

Use a infraestrutura de testes atual. Se estiver ausente, adicione a menor combinação sustentável, preferencialmente testes unitários/integrados no stack atual e Playwright para jornadas E2E.

## 27.1 Linha de base e regressão

- Executar testes/build antes de mudanças.
- Registrar falhas preexistentes.
- Manter ou elevar cobertura de módulos tocados.
- Testar login, CRM, pesquisa e cards essenciais após integração.
- Nenhuma chamada paga real em CI/teste automatizado.

## 27.2 Testes unitários

Cobrir:

- schemas e migrations de versão;
- validators/sanitizers;
- URLs e protocolos;
- normalização de telefone/WhatsApp;
- slug/collision;
- design tokens e contraste;
- copy linter;
- regras de fatos confirmados;
- registry e compatibilidade de variantes;
- motion registry/reduced-motion;
- cálculo/limite de custos;
- idempotency;
- state machines de projeto/job/publicação;
- manifest/checksum de exportação;
- source/rights/expiry de assets;
- patch allowlist;
- SEO/JSON-LD.

## 27.3 Testes de componentes

Para cada família/variante estável:

- render com mínimo e máximo de conteúdo;
- conteúdo longo em português;
- ausência de item opcional;
- tema claro/escuro compatível;
- teclado e acessibilidade;
- snapshots/visual regression representativos;
- mobile/desktop;
- reduced-motion;
- sem erro quando asset falha.

Não use snapshot gigantesco como único teste.

## 27.4 Testes de providers

Com mocks/fixtures:

- resposta estruturada válida;
- JSON inválido e um reparo;
- segundo erro bloqueia sem loop;
- timeout;
- 429/rate limit;
- 5xx transitório;
- autenticação/crédito/quota;
- modelo indisponível;
- uso/custo registrado;
- resposta parcial;
- prompt injection em dado do lead;
- imagem gerada/erro/moderação;
- nenhuma key chega ao frontend/log.

Um teste real pequeno e manual pode ser documentado quando as chaves existirem. Não o torne requisito de CI.

## 27.5 Testes da fila

- claim concorrente não duplica job;
- restart recupera job elegível;
- lease expira;
- cancelamento;
- retry idempotente;
- clique duplo;
- evento em ordem;
- SSE reconnect/poll fallback;
- falha após chamada válida reaproveita resultado;
- limite mensal bloqueia antes de chamar provider.

## 27.6 Testes do editor

- manual edit/autosave;
- reorder/add/remove/duplicate/hide;
- trocar variante;
- upload/troca/crop/focal;
- AI patch de seção sem alterar outras;
- patch rejeitado;
- undo/redo;
- restore version;
- conflito de lock;
- reload mantém draft;
- viewport computador/celular;
- cleanup de GSAP sem duplicação.

## 27.7 E2E principais

1. Criar projeto a partir de card com provider mock.
2. Criar projeto avulso pelo menu e vincular depois.
3. Recarregar durante geração e continuar acompanhando.
4. Editar site e restaurar versão.
5. Publicar e abrir anonimamente.
6. Atualizar publicação mantendo URL.
7. Falhar nova publicação e manter anterior.
8. Rollback.
9. Gerar mensagem e abrir `wa.me`.
10. Confirmar envio e registrar histórico.
11. Exportar ZIP, extrair, servir e testar.
12. Testar site sem JavaScript: conteúdo principal continua legível.
13. Testar reduced-motion.
14. Testar ausência de keys e modo mock.
15. Testar regressão do CRM.

## 27.8 Teste público real

Em staging/produção controlada, verificar a partir de origem externa/anônima:

- DNS/HTTPS;
- URL não exige login;
- assets não retornam 403/404;
- Open Graph acessível;
- noindex correto;
- celular real quando possível;
- URL compartilhada abre o mesmo snapshot;
- nenhum path localhost.

## 27.9 Comandos finais

Execute os comandos equivalentes existentes para:

- lint;
- typecheck;
- unit/integration;
- E2E relevante;
- build frontend/backend;
- migration test;
- audit de dependências/licenças;
- smoke do artefato estático.

Não declare sucesso se um comando crítico falhar. Diferencie “não executado por falta de ambiente” de “aprovado”.

---

# 28. ORDEM DE IMPLEMENTAÇÃO OBRIGATÓRIA — FASE A

Execute as etapas em sequência. Dentro de cada uma, entregue uma fatia integrada e teste antes de avançar.

## Etapa A0 — Auditoria e plano

- inspecionar repositório/infra;
- levantar linha de base;
- mapear entidades e pontos de integração;
- verificar conflitos com especificações antigas;
- criar plano;
- não alterar arquitetura ainda.

**Saída:** plano técnico e riscos confirmados.

## Etapa A1 — Feature flag, domínio e migrações base

- criar tipos/state machines;
- criar tabelas/migrações/índices;
- feature flag;
- repositories/services;
- testes de persistência e upgrade.

**Saída:** projetos/jobs/versions persistem sem UI completa.

## Etapa A2 — SiteSchema, policies e linter

- schema versionado;
- design tokens;
- union de seções;
- validators/sanitizers;
- fact policy;
- copy/SEO linter;
- migration strategy de schema;
- fixtures.

**Saída:** config válida pode ser criada, persistida e rejeita dados perigosos.

## Etapa A3 — Primitivas, registry e primeiro renderer vertical

- primitivas acessíveis;
- registry;
- um conjunto vertical completo de seções;
- renderer preview/static compartilhado;
- testes de HTML inicial;
- tema/tokens.

**Saída:** fixture profissional renderiza no navegador e estaticamente.

## Etapa A4 — Biblioteca profissional completa

- expandir famílias e variantes até metas;
- blueprints;
- visual regression;
- conteúdo longo/mínimo;
- anti-template fingerprint.

**Saída:** variedade real, não duplicações cosméticas.

## Etapa A5 — Motion system

- CSS microinteractions;
- GSAP/ScrollTrigger;
- matchMedia/reduced-motion;
- gradient/hover/press;
- presets;
- cleanup;
- vídeo leve;
- Lenis/Three.js somente se justificados.

**Saída:** animações profissionais e degradáveis.

## Etapa A6 — Providers e modo mock

- provider interface;
- adapter Anthropic;
- structured output;
- prompt versionado;
- usage capture;
- mock determinístico;
- erros/reparo limitado;
- env diagnostics.

**Saída:** geração estruturada funciona em mock e está pronta para key real.

## Etapa A7 — Fila persistente e progresso

- jobs MySQL;
- worker;
- events;
- SSE + polling;
- cancel/retry/recovery;
- locks/idempotency;
- alertas internos.

**Saída:** job sobrevive a reload/restart simulado.

## Etapa A8 — Fluxo de criação

- ação no card;
- menu Sites com IA;
- seleção de lead/avulso;
- wizard;
- prefill e validação;
- custo/limites;
- tela de progresso.

**Saída:** jornada completa até projeto pronto em mock.

## Etapa A9 — Editor e versionamento

- canvas;
- desktop/mobile;
- painéis;
- manual edits;
- add/reorder/delete/variant;
- autosave;
- undo/redo;
- versions/restore;
- AI patches econômicos.

**Saída:** administrador ajusta projeto sem código.

## Etapa A10 — Assets e imagens opcionais

- storage adapter;
- uploads seguros;
- transforms;
- focal/crop;
- provider OpenAI opcional;
- modes/budgets;
- rights/source/expiry;
- fallbacks.

**Saída:** site utiliza assets reais/gerados com controle.

## Etapa A11 — SEO/GEO e QA determinístico

- metadata/JSON-LD;
- demo vs production profile;
- Playwright/screenshots;
- overflow/links/contraste;
- performance/accessibility checks;
- painel de avisos.

**Saída:** projeto válido e bloqueios de publicação confiáveis.

## Etapa A12 — Publicação Hostinger

- publicação snapshot;
- storage persistente;
- rota pública;
- slug;
- noindex invisível;
- atomic switch;
- rollback/unpublish;
- smoke anônimo;
- setup manual da origem pública documentado.

**Saída:** prospect abre o mesmo site em outro dispositivo sem login.

## Etapa A13 — Exportação ZIP

- static artifact profile;
- assets relativos/bundled;
- robots/sitemap/canonical;
- export job;
- ZIP scanning;
- extract/serve/E2E;
- README deploy.

**Saída:** ZIP pronto para Netlify/Hostinger sem backend.

## Etapa A14 — WhatsApp e CRM integration polish

- mensagem por IA;
- deep link;
- confirmação manual;
- histórico;
- estados no card;
- listagem/filtros;
- custo/usage UI.

**Saída:** fluxo de prospecção completo.

## Etapa A15 — Hardening e produção

- segurança;
- budgets;
- error paths;
- audit/licenças;
- testes completos;
- build;
- migration rehearsal;
- documentação Hostinger/API keys;
- feature flag rollout.

**Saída:** Fase A pronta com evidências.

Somente após A15, iniciar a Fase B.

---

# 29. CRITÉRIOS DE ACEITE — FASE A

Considere cada item uma verificação objetiva.

## Integração e fluxo

- [ ] O CRM existente continua funcionando.
- [ ] O card mostra ação contextual correta.
- [ ] O menu Sites com IA lista projetos persistidos.
- [ ] É possível criar com lead ou avulso.
- [ ] Prefill não inventa nem sobrescreve dado manual.
- [ ] Segundo projeto ativo não é criado por engano.
- [ ] Wizard possui tipos, estilo, cores, movimento e instrução livre.
- [ ] Clique duplo não duplica job/custo.

## Geração e IA

- [ ] A key da Anthropic fica apenas no backend.
- [ ] Assinatura Claude/Claude Code não é tratada como API key.
- [ ] Provider e modelo são configuráveis.
- [ ] Modo mock é claramente identificado no admin.
- [ ] A IA retorna schema, não código executável.
- [ ] Structured output é validado novamente no servidor.
- [ ] Há no máximo um reparo de schema.
- [ ] Edição de uma seção não envia/regenera o site inteiro.
- [ ] Uso, modelo, tokens e tentativas são registrados.
- [ ] Budget bloqueia antes de chamada cara.
- [ ] Não existe loop automático de refinamento.
- [ ] Prompt injection de dados externos é mitigada.

## Qualidade visual

- [ ] Biblioteca real e versionada existe.
- [ ] Metas de variantes foram atendidas ou diferenças pendentes estão explicitamente marcadas, sem alegar conclusão.
- [ ] Variantes não são duplicações cosméticas.
- [ ] Cada site tem design tokens e direção criativa próprios.
- [ ] Fingerprint evita repetição excessiva.
- [ ] Tema claro/escuro possui contraste.
- [ ] Copy é específica e natural.
- [ ] Nenhum depoimento, credencial ou resultado foi inventado.
- [ ] Nenhum placeholder é publicado.

## Animações

- [ ] GSAP/ScrollTrigger estão bundlados e versionados.
- [ ] Presets, não código de IA, controlam movimento.
- [ ] Botões possuem hover/focus/press acessíveis.
- [ ] Gradientes são sutis e configuráveis.
- [ ] Scroll não é sequestrado.
- [ ] Reduced-motion funciona.
- [ ] Conteúdo continua visível se JS falhar.
- [ ] Mobile reduz efeitos pesados.
- [ ] Timelines/listeners são limpos no editor.

## Editor

- [ ] Preview usa a mesma fonte do site final.
- [ ] Modos Computador e Celular funcionam.
- [ ] Texto, cor, logo, imagem e links são editáveis.
- [ ] Seções podem ser adicionadas/reordenadas/ocultadas/excluídas.
- [ ] Cards/serviços/FAQ podem ser editados.
- [ ] AI patch é validado e reversível.
- [ ] Autosave é persistente.
- [ ] Conflito de versão não perde conteúdo.
- [ ] Undo/redo e histórico funcionam.
- [ ] Restaurar versão não apaga histórico.

## Assets

- [ ] Upload valida conteúdo real e segurança.
- [ ] Imagem permite troca/crop/focal point.
- [ ] Não há avaliação visual paga automática de cada foto.
- [ ] OpenAI Images é opcional.
- [ ] Limite de imagem/custo é aplicado.
- [ ] Pessoas reais não são falsificadas.
- [ ] Source/direitos/atribuição são registrados.
- [ ] Google/Instagram não são raspados.
- [ ] Asset sem direito não entra no ZIP.

## Jobs

- [ ] Job persiste no MySQL.
- [ ] Recarregar a página mantém estado.
- [ ] Eventos refletem stages reais.
- [ ] Cancelamento/retry são seguros.
- [ ] Worker recupera lease expirado.
- [ ] Falha não deixa projeto preso eternamente.
- [ ] SSE reconecta e polling é fallback.

## Publicação

- [ ] Link público abre sem login.
- [ ] Não contém demo/demonstração/preview.
- [ ] Não existe banner/watermark de demo.
- [ ] Slug usa o nome do negócio.
- [ ] Site publicado usa noindex invisível.
- [ ] Não há listagem pública de projetos.
- [ ] Publicação é snapshot.
- [ ] Atualização mantém link.
- [ ] Falha mantém versão anterior.
- [ ] Rollback e unpublish funcionam.
- [ ] Assets persistem após restart/deploy conforme ambiente validado.
- [ ] Smoke test anônimo bloqueia link quebrado.

## ZIP

- [ ] ZIP não contém secrets/CRM/prompts.
- [ ] `index.html` está na raiz.
- [ ] Paths são relativos/base-safe.
- [ ] Bibliotecas essenciais estão bundladas.
- [ ] Site funciona sem backend.
- [ ] Formulário abre WhatsApp.
- [ ] SEO de produção é distinto de noindex demo.
- [ ] ZIP é extraído e testado antes do download.
- [ ] Não há localhost/path interno.
- [ ] README orienta Netlify e Hostinger.

## WhatsApp

- [ ] Número é revisável e normalizado.
- [ ] Mensagem é específica e editável.
- [ ] Link publicado está incluído.
- [ ] `wa.me` abre com encoding correto.
- [ ] Sistema não registra envio automaticamente.
- [ ] Confirmação manual cria histórico sem duplicar contato.

## SEO, performance e acessibilidade

- [ ] HTML principal é semântico e server/static rendered.
- [ ] Há um H1 e headings válidos.
- [ ] Metadata/OG/JSON-LD usam fatos.
- [ ] Canonical só existe com domínio conhecido.
- [ ] GEO/GIO é conteúdo factual, não texto oculto.
- [ ] Sem overflow nas larguras testadas.
- [ ] Menu, formulário e accordion funcionam por teclado.
- [ ] Contraste AA e foco visível.
- [ ] Metas de performance são medidas e reportadas honestamente.

## Segurança e operação

- [ ] Rotas privadas exigem auth.
- [ ] Rota pública não vaza dados internos.
- [ ] XSS, SVG, upload, SSRF e path traversal estão tratados.
- [ ] CSP está configurada.
- [ ] Logs não contêm keys ou prompts sensíveis.
- [ ] Migrações foram testadas com upgrade.
- [ ] Testes/build passam.
- [ ] Configuração Hostinger e APIs está documentada.
- [ ] O que depende de credencial real está claramente diferenciado de mock.

---

# 30. FASE B — CORREÇÃO SEPARADA DOS DADOS DO LEAD

**Somente iniciar depois que a Fase A estiver implementada e estabilizada.** Esta fase não faz parte do renderer/site builder; é uma correção do fluxo de pesquisa e CRM.

## 30.1 Problema atual

Ao pesquisar empresas pela integração oficial do Google e adicionar uma empresa ao CRM, o card não mantém de forma útil todos os links/contatos necessários. Depois, o administrador precisa consultar novamente o Google.

O objetivo é, no momento de **Adicionar ao CRM**, salvar ou referenciar de forma permitida:

- Place ID;
- link do Google Maps;
- telefone;
- WhatsApp derivado do telefone, sem afirmar que a conta existe;
- website;
- Instagram, quando realmente encontrado por fonte permitida;
- source e data de consulta/validação.

O card/drawer deve exibir essas ações sem fazer nova chamada apenas por abrir.

## 30.2 Atenção jurídica/técnica obrigatória

“Está público no Google” não elimina os Termos do Google Maps Platform.

Antes de implementar persistência, identifique:

- API exata usada: Places API New/Legacy, Maps JavaScript etc.;
- campos solicitados e SKUs;
- conta/região/termos aplicáveis;
- política atual de caching, atribuição, exibição e redistribuição para cada campo.

Regras:

- Place ID pode ser persistido conforme a exceção oficial atual e deve ser a identidade principal do Google.
- Gerar o link do Maps com Maps URL oficial e Place ID, sem nova chamada quando possível.
- Para outros Google Maps Content, respeitar retenção/expiração atual; não presumir persistência indefinida.
- Se um valor não puder ser retido indefinidamente como conteúdo Google, salve-o em cache com `source`, `fetched_at` e `expires_at`, ou peça confirmação/edição do administrador para promovê-lo a dado CRM-native independente, quando juridicamente apropriado.
- Não esconder essa limitação com código.
- Não armazenar resposta completa/raw JSON se não for necessário.
- Não raspar Google Maps ou Instagram.
- Exibir atribuição Google quando exigida.

## 30.3 Modelo de dados

Reutilize `lead_contacts`, `lead_links`, identity keys e source metadata existentes antes de criar colunas duplicadas. A modelagem deve representar:

- `google_place_id`;
- `google_maps_url` derivada;
- `phone_raw`;
- `phone_e164` nullable;
- `whatsapp_url` derivada;
- `website_url`;
- `instagram_url`;
- `data_source` por valor;
- `fetched_at`;
- `expires_at` quando aplicável;
- `confirmed_by_user_at` quando o administrador confirmar/promover;
- `last_verified_at`;
- confidence/status para link social quando necessário.

Não grave `whatsapp_available=true` apenas porque existe telefone.

## 30.4 Inserção e merge

Ao adicionar resultado ao CRM:

1. iniciar transação;
2. deduplicar primeiro por Place ID;
3. depois usar chaves fortes existentes, como telefone normalizado e domínio, com regras conservadoras;
4. criar lead se não existir;
5. salvar campos permitidos/source/TTL;
6. se já existir, preencher apenas campos vazios ou expirados quando a política permitir;
7. nunca sobrescrever valor manual/confirmado com resultado automático;
8. nunca alterar etapa, notas, serviços, valores ou histórico;
9. registrar audit/evento;
10. finalizar sem segunda consulta desnecessária.

Cliques repetidos devem ser idempotentes e nunca criar segundo card.

## 30.5 Instagram

A Places API normalmente não fornece um campo universal dedicado de Instagram. Portanto:

- salvar se a URL vier explicitamente de fonte permitida já disponível;
- se `websiteUri` for o próprio Instagram, classificar como Instagram e não como website institucional;
- permitir entrada/correção manual;
- não adivinhar handle pelo nome;
- não buscar/raspar o Google Maps HTML;
- não afirmar correspondência sem evidência.

## 30.6 UI no card/drawer

Mostrar ações clicáveis quando disponíveis:

- **Ligar**;
- **Abrir WhatsApp**;
- **Instagram**;
- **Site**;
- **Google Maps**;
- copiar número/link;
- badge discreto para dado temporário, desatualizado ou não confirmado;
- editar/confirmar valor.

Não sobrecarregar card compacto. Links detalhados podem ficar no drawer, com ícones/ações rápidas no card conforme espaço.

## 30.7 Consultar novamente

- Abrir o card não chama Google.
- **Consultar novamente** fica disponível somente por ação explícita e quando houver dado ausente/expirado ou desejo de atualização.
- Mostrar que a consulta pode consumir quota/custo.
- Pedir somente fields necessários.
- Atualizar com merge conservador.
- Não apagar dado manual.
- Refresh de Place ID deve seguir recomendação/política atual.

## 30.8 Leads existentes

- Não executar backfill pago em massa automaticamente.
- Se houver Place IDs já salvos, oferecer backfill controlado/manual de campos faltantes, com estimativa, rate limit, pausa e relatório.
- Preferir derivar Maps URL localmente do Place ID.
- Não reconsultar leads completos apenas para renderizar cards.

## 30.9 Testes da Fase B

- novo lead salva valores permitidos;
- lead duplicado não cria card;
- manual vence automático;
- expirado é tratado conforme política;
- abrir drawer gera zero chamadas Google;
- Maps URL derivada aponta para Place ID correto;
- telefone normaliza sem corromper número;
- `wa.me` não implica conta confirmada;
- website e Instagram são classificados corretamente;
- raw payload não é persistido desnecessariamente;
- atribuição/source aparecem quando exigidos;
- retry/idempotência;
- nenhuma chamada real paga em CI;
- regressão de pesquisa/filtros/CRM.

## 30.10 Critérios de aceite da Fase B

- [ ] Place ID e Maps URL ficam acessíveis no lead.
- [ ] Telefone/WhatsApp, website e Instagram aparecem quando legitimamente disponíveis.
- [ ] O card não consulta novamente ao abrir.
- [ ] Dados manuais não são sobrescritos.
- [ ] Duplicatas não são criadas.
- [ ] O sistema não raspa Google/Instagram.
- [ ] Termos/TTL/atribuição do provider são respeitados.
- [ ] Consultar novamente é explícito e econômico.
- [ ] Testes e build continuam aprovados.

---

# 31. ENTREGÁVEIS FINAIS

Ao terminar, entregue no repositório:

1. código completo da Fase A;
2. código separado da Fase B;
3. migrações;
4. fixtures/mock provider;
5. testes;
6. `.env.example` atualizado;
7. `IMPLEMENTATION_PLAN_SITE_AI.md` atualizado com status real;
8. documentação de arquitetura e decisões;
9. guia de configuração Anthropic;
10. guia opcional OpenAI Images;
11. guia de configuração única da origem pública na Hostinger;
12. guia de storage persistente/backup;
13. guia de exportação e implantação Netlify/Hostinger;
14. runbook de falhas, fila, orçamento e rotação de keys;
15. relatório final com arquivos, comandos, testes e limitações.

Não crie documentação para aparentar completude. Ela deve corresponder ao código real.

---

# 32. FORMATO DO RELATÓRIO FINAL DO CLAUDE CODE

Ao final, responda com:

## Resultado

- resumo objetivo do que está funcional;
- o que foi implementado na Fase A;
- o que foi implementado na Fase B.

## Arquitetura efetiva

- stack confirmada;
- renderer;
- fila;
- storage;
- providers;
- publicação;
- exportação.

## Arquivos e migrações

- arquivos principais;
- migrações e ordem;
- dados/backfills.

## Variáveis/configuração

- nomes das variáveis;
- quais são obrigatórias;
- onde configurar no hPanel;
- sem exibir valores secretos.

## Verificação

- comandos executados;
- testes aprovados;
- resultados de build/lint/typecheck;
- smoke público;
- teste do ZIP;
- o que foi testado em mock;
- o que foi testado com provider real.

## Ações manuais restantes

- somente ações realmente necessárias, em ordem;
- DNS/SSL/origem pública;
- API keys/créditos;
- diretório persistente;
- migration/deploy.

## Limitações verdadeiras

- não declare como pronto o que não foi testado;
- não esconda dependência de credencial ou hPanel;
- não chame mock de integração real;
- não invente percentual de conclusão.

---

# 33. REFERÊNCIAS OFICIAIS A VERIFICAR NA IMPLEMENTAÇÃO

Use documentação oficial atual. Não copie exemplos sem adaptar à versão instalada.

- Anthropic Structured Outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
- Anthropic Prompt Caching: https://platform.claude.com/docs/en/build-with-claude/prompt-caching
- Anthropic Pricing: https://platform.claude.com/docs/en/about-claude/pricing
- Anthropic Models API: https://platform.claude.com/docs/en/api/models/list
- OpenAI Image Generation: https://developers.openai.com/api/docs/guides/image-generation
- OpenAI GPT Image models: https://developers.openai.com/api/docs/models
- GSAP ScrollTrigger: https://gsap.com/docs/v3/Plugins/ScrollTrigger/
- GSAP matchMedia/reduced-motion: https://gsap.com/docs/v3/GSAP/gsap.matchMedia%28%29/
- Google Maps Place IDs: https://developers.google.com/maps/documentation/places/web-service/place-id
- Google Places policies: https://developers.google.com/maps/documentation/places/web-service/policies
- Google Maps Platform Service Specific Terms: https://cloud.google.com/maps-platform/terms/maps-service-terms
- Google Maps URLs: https://developers.google.com/maps/documentation/urls/get-started
- Hostinger subdomains: https://www.hostinger.com/support/1583405-how-to-create-and-delete-subdomains-in-hostinger/
- Hostinger Node custom domain: https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/
- Hostinger SSL limitations: https://www.hostinger.com/support/1583278-introduction-to-ssl-at-hostinger/
- Netlify Drop: https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/

Se preço, modelo, API, licença ou política tiver mudado, adapte a implementação e documente a diferença. Nunca mantenha uma suposição antiga apenas porque está escrita neste prompt.

---

# INSTRUÇÃO FINAL

Comece agora pela **Etapa A0 — Auditoria e plano**. Depois prossiga sequencialmente pelas etapas da Fase A, sem reconstruir o CRM e sem me interromper para decisões já tomadas. Use modo mock quando faltar credencial, mas deixe a integração real pronta e indique a configuração necessária. Só considere o módulo concluído quando os critérios objetivos estiverem verificados. Depois de estabilizar a Fase A, implemente a Fase B como alteração separada.

# FIM DO PROMPT PARA O CLAUDE CODE
