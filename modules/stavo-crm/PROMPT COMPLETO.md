# PROMPT MESTRE PARA O CLAUDE CODE

## Plataforma privada de captação de leads, CRM, prospecção, vendas e gestão financeira da Stavo Digital

Copie todo o conteúdo deste documento e envie ao Claude Code. Este texto é a especificação funcional, técnica, visual e operacional do projeto. Ele deve ser tratado como a fonte de verdade do desenvolvimento.

---

# INÍCIO DO PROMPT PARA O CLAUDE CODE

Quero que você atue como arquiteto de software sênior, product engineer, desenvolvedor full-stack, especialista em banco de dados, segurança, UX/UI, testes e implantação. Sua missão é construir uma aplicação web privada, completa, funcional, segura, testada e pronta para produção para a Stavo Digital.

Não produza apenas uma demonstração visual, um protótipo estático ou telas desconectadas. Entregue um sistema real, com frontend, backend, banco de dados, autenticação, integrações, regras de negócio, validações, migrações, testes, documentação e processo de implantação.

O sistema será uma central privada de:

- descoberta e seleção de leads;
- pesquisa de empresas por meio da API oficial do Google Places;
- cadastro manual e importação de leads;
- organização do processo comercial em um CRM Kanban semelhante ao Trello;
- registro de primeiros contatos, respostas e follow-ups;
- acompanhamento de negociações, recusas, pagamentos e vendas;
- cadastro de serviços com cobrança única ou recorrente;
- controle de contas a receber e receitas recorrentes;
- atualização automática de métricas e metas em um dashboard;
- preservação do histórico comercial e financeiro.

O sistema será utilizado exclusivamente por uma pessoa, para o próprio negócio. Não é um SaaS público, não será vendido nesta primeira versão e não precisa de arquitetura multiempresa ou multiusuário.

O administrador único utilizará este e-mail:

    stavodigital123@gmail.com

O e-mail é apenas a identificação de acesso. Não implemente login com Google, OAuth do Gmail ou envio de e-mail nesta versão.

## Regra máxima de execução

Implemente o projeto por etapas, exatamente na ordem lógica definida neste prompt. Em cada etapa:

1. Leia todos os requisitos relacionados antes de alterar arquivos.
2. Inspecione o repositório e preserve qualquer trabalho válido já existente.
3. Apresente um resumo breve do que será feito naquela etapa.
4. Implemente código real e integrado, não pseudocódigo.
5. Crie ou atualize as migrações e os testes correspondentes.
6. Execute lint, verificação de tipos, testes aplicáveis e build.
7. Corrija os erros encontrados antes de declarar a etapa concluída.
8. Ao finalizar, informe os arquivos principais alterados, comandos executados, testes aprovados e qualquer bloqueio verdadeiro.
9. Só peça informações ao usuário quando elas forem realmente indispensáveis e ainda não estiverem definidas neste prompt.
10. Não interrompa o desenvolvimento para perguntar preferências que já estão especificadas.

Se encontrar uma incompatibilidade técnica real entre o ambiente existente e esta especificação, explique objetivamente o conflito, apresente a alternativa menos invasiva e aguarde autorização antes de mudar uma decisão estrutural.

Não troque silenciosamente tecnologia, regra de negócio, hospedagem, fluxo comercial, aparência ou escopo.

---

# 1. DECISÕES FIXAS E FONTE DE VERDADE

As decisões abaixo já foram tomadas. Não volte a discuti-las como perguntas abertas.

## 1.1 Uso e acesso

- Aplicação privada para uso individual.
- Apenas um administrador.
- Sem cadastro público.
- Sem convite de usuários.
- Sem permissões por equipe.
- Sem organizações, workspaces ou tenants.
- Sem página comercial ou plano de assinatura da própria plataforma.
- A rota da aplicação deve exigir autenticação, exceto login, saúde do sistema e páginas legais estritamente necessárias.
- E-mail fixo do administrador: stavodigital123@gmail.com.
- A senha inicial será fornecida apenas no momento apropriado da configuração.
- A senha nunca pode ser gravada em código, Git, migração, seed público, log ou documentação.
- A senha deve ser armazenada apenas como hash forte.
- Deve existir alteração de senha para o administrador autenticado.
- Não deve existir “Esqueci minha senha” na primeira versão.
- Não deve existir SMTP, envio de e-mail, recuperação por e-mail ou código mágico na primeira versão.
- Deve existir um procedimento administrativo manual, seguro e documentado para redefinição emergencial da senha no servidor.

## 1.2 Arquitetura e hospedagem

A arquitetura de produção da primeira versão é:

- frontend: React com Vite e TypeScript;
- backend: Node.js 22 com Express e TypeScript;
- banco de dados: MySQL da hospedagem Hostinger;
- hospedagem: plano Business Web Hosting da Hostinger;
- implantação como uma única aplicação Node.js;
- frontend compilado e servido pela própria aplicação Express em produção;
- repositório GitHub privado ou pacote ZIP como alternativas de implantação;
- domínio ou subdomínio personalizado com HTTPS;
- segredos configurados por variáveis de ambiente no painel da hospedagem.

Requisitos operacionais da Hostinger:

- escutar em 0.0.0.0;
- utilizar process.env.PORT;
- respeitar o proxy reverso da hospedagem;
- executar em Node.js 22;
- não depender de acesso root;
- não depender de Docker;
- não depender de Redis;
- não depender de PostgreSQL;
- não depender de systemd;
- não depender de processos residentes adicionais fora da aplicação Node;
- suportar MySQL por conexão configurada em variáveis de ambiente.

Antes da implantação, verifique com o usuário no painel da Hostinger se a vaga disponível para aplicação Node.js está livre. Se estiver ocupada, não migre para Vercel nem altere a arquitetura sem pedir decisão ao usuário.

Não use Supabase nesta arquitetura. O MySQL da Hostinger será o banco persistente do sistema.

## 1.3 Idioma, moeda e tempo

- Toda a interface deve estar em português do Brasil.
- Textos técnicos internos e nomes de arquivos podem estar em inglês, mas a experiência do usuário deve estar em português claro.
- Moeda padrão: BRL.
- Valores devem aparecer no formato brasileiro, por exemplo R$ 1.234,56.
- Fuso operacional: America/Sao_Paulo.
- Armazene timestamps no banco em UTC e converta para America/Sao_Paulo na apresentação e nos cálculos de período.
- Datas visíveis devem seguir o padrão brasileiro.
- Semana e períodos de metas devem ser calculados de forma consistente e documentada.

## 1.4 Princípios do produto

O sistema deve:

- reduzir o tempo gasto para localizar, avaliar e organizar leads;
- evitar leads duplicados;
- separar primeiro contato de follow-up;
- manter histórico imutável das movimentações importantes;
- atualizar o dashboard a partir de eventos reais do CRM;
- distinguir situação atual do funil e atividade histórica do período;
- facilitar decisões com pouco esforço cognitivo;
- destacar o que exige ação hoje;
- preservar dados comerciais e financeiros importantes;
- ser rápido, responsivo, acessível e confiável;
- continuar útil mesmo quando a API do Google estiver temporariamente indisponível ou sem quota.

---

# 2. O QUE NÃO DEVE SER CONSTRUÍDO

Esta seção é obrigatória. Não implemente itens abaixo como “melhorias” não solicitadas.

- Não criar SaaS público.
- Não criar arquitetura multiusuário ou multiempresa.
- Não criar cadastro público.
- Não criar planos, checkout ou cobrança pelo uso da plataforma.
- Não criar recuperação de senha por e-mail.
- Não configurar SMTP.
- Não criar login social ou Google OAuth.
- Não integrar diretamente com Google Sheets por OAuth na primeira versão.
- Não exigir API do Google Sheets.
- Não criar integração com gateway de pagamento.
- Não cobrar automaticamente clientes.
- Não confirmar automaticamente que uma mensalidade foi paga.
- Não enviar mensagens de WhatsApp.
- Não automatizar spam, disparos em massa ou prospecção automática.
- Não afirmar que um telefone possui WhatsApp.
- Não garantir que um Instagram encontrado pertence à empresa sem sinalização adequada.
- Não usar scraping do site público do Google Maps.
- Não usar Puppeteer, Playwright ou navegador automatizado para extrair resultados do Google Maps.
- Não contornar CAPTCHA, limites, bloqueios ou políticas do Google.
- Não armazenar permanentemente uma cópia completa dos resultados do Google Places.
- Não salvar automaticamente nome, endereço, telefone, nota, avaliações ou website do Google como snapshot permanente do CRM.
- Não esconder empresa porque está “fechada agora”.
- Não aplicar filtro openNow.
- Não tratar “fechado fora do horário comercial” como empresa encerrada.
- Não criar as etapas “Site em criação” ou “Site pronto”.
- Não criar uma coluna separada “Aguardando resposta”: “Contato realizado” já representa que a primeira abordagem foi feita e que o retorno pode estar pendente.
- Não criar construtor de sites, gerador automático de sites ou hospedagem de sites de clientes dentro desta ferramenta.
- Não fazer a plataforma exclusivamente para venda de sites.
- Não criar um novo contato quando o mesmo lead entra em follow-up.
- Não aumentar métricas de primeiro contato quando houver várias tentativas com o mesmo lead.
- Não criar um segundo card para lead duplicado.
- Não sobrescrever silenciosamente anotações, valores, serviços, etapa, histórico ou qualquer dado existente durante importações.
- Não apagar definitivamente histórico comercial ou financeiro relevante.
- Não usar exclusão física como padrão para leads, serviços com histórico, vendas, pagamentos ou eventos.
- Não expor chaves de API, senha ou segredo no frontend.
- Não armazenar tokens de sessão em localStorage.
- Não usar Vercel como destino padrão desta versão.
- Não usar Supabase, Firebase, PostgreSQL, Redis ou Docker.
- Não entregar somente uma interface bonita sem backend real.
- Não deixar dados essenciais apenas em memória.
- Não usar dados fictícios como se fossem produção.
- Não realizar chamadas reais pagas ao Google durante testes automatizados.
- Não deixar tarefas, TODOs, mocks ou botões sem função na versão considerada concluída.

---

# 3. DEFINIÇÃO DE PRONTO DO PROJETO

O projeto só pode ser considerado concluído quando:

- login privado funciona com sessão segura;
- administrador único consegue alterar a senha;
- banco MySQL é criado por migrações reproduzíveis;
- dados sobrevivem a reinício da aplicação;
- CRM Kanban funciona em desktop e celular;
- todas as etapas padrão existem e alimentam corretamente métricas;
- movimentações não duplicam eventos históricos;
- pesquisa oficial do Google Places funciona pelo backend;
- consumo da API é contabilizado e limitado;
- resultados do Google exibem atribuição apropriada;
- Google e CRM seguem o modelo de persistência definido neste prompt;
- lead existente é reconhecido e não duplicado;
- importação CSV e XLSX funciona com mapeamento de colunas;
- cadastro manual funciona;
- serviços únicos e recorrentes funcionam;
- contas a receber e confirmação manual de recebimento funcionam;
- recorrências mensais são geradas sem duplicação;
- cancelamentos e estornos preservam histórico;
- dashboard exibe métricas corretas a partir dos eventos;
- metas diária, semanal e mensal funcionam;
- interface está em português, responsiva e acessível;
- erros, carregamentos, estados vazios e falhas externas possuem tratamento;
- testes essenciais passam;
- build de produção passa;
- aplicação inicia nas condições da Hostinger;
- documentação de implantação, backup, restauração e redefinição de senha está pronta;
- não há segredos no repositório;
- não há funcionalidade crítica simulada.

---

# PASSO 1 — INSPEÇÃO INICIAL, PLANO E GUARDA DE DECISÕES

## Objetivo

Entender o estado do repositório, registrar a arquitetura e impedir que o desenvolvimento avance sobre premissas erradas.

## Ações

1. Inspecione a estrutura do repositório, package.json, arquivos de configuração, histórico Git disponível e alterações não commitadas.
2. Preserve alterações válidas existentes e não apague trabalho do usuário.
3. Se o repositório estiver vazio, inicialize o projeto.
4. Se houver stack equivalente parcialmente construída, avalie o reaproveitamento antes de reescrever.
5. Crie um documento de decisões arquiteturais contendo:
   - arquitetura da aplicação única;
   - React + Vite + TypeScript;
   - Express + Node 22;
   - MySQL;
   - Hostinger;
   - autenticação por sessão;
   - integração oficial Google Places;
   - política de persistência de dados do Google;
   - modelo orientado a eventos para métricas;
   - regras de deduplicação;
   - exclusões de escopo.
6. Crie uma lista de riscos e como serão mitigados:
   - quota e custo do Google;
   - indisponibilidade da API;
   - duplicidade;
   - movimentos repetidos no CRM;
   - concorrência em pagamentos;
   - recorrências duplicadas;
   - importações inválidas;
   - exposição de segredos;
   - limitações da Hostinger;
   - perda de dados.
7. Defina marcos de implementação compatíveis com os passos deste prompt.

## Perguntas permitidas neste passo

Não pergunte novamente requisitos funcionais. Se necessário, pergunte apenas:

- qual nome definitivo será exibido na plataforma, caso “Stavo Digital” não deva ser usado;
- qual subdomínio será usado, se isso já for necessário para configurar produção;
- se o repositório fornecido deve ser inicializado ou preserva código existente.

Se essas informações ainda não forem necessárias, use nomes configuráveis e continue.

## Critérios de aceite

- Arquitetura registrada.
- Nenhuma decisão fixa foi alterada.
- Riscos técnicos identificados.
- Plano de execução coerente com as dependências.
- Nenhuma credencial foi solicitada prematuramente.

---

# PASSO 2 — FUNDAÇÃO TÉCNICA E ESTRUTURA DO PROJETO

## Objetivo

Criar uma base sustentável, compatível com uma única aplicação Node na Hostinger e simples de manter.

## Estrutura recomendada

Use TypeScript em modo strict em todo o projeto. Organize o repositório de forma que exista separação clara entre:

- frontend React;
- backend Express;
- domínio e regras de negócio;
- acesso ao banco;
- integração Google;
- tarefas administrativas;
- migrações;
- testes;
- documentação.

Pode ser um monorepositório simples ou um único package com pastas bem separadas. Evite complexidade operacional desnecessária. Em produção, um único processo Express deve:

- expor a API;
- servir os arquivos compilados do frontend;
- responder à rota de saúde;
- fazer fallback de SPA sem interceptar rotas da API;
- iniciar com um comando documentado.

## Bibliotecas e escolhas técnicas

Use versões estáveis e compatíveis com Node.js 22. Como referência técnica, prefira:

- React;
- Vite;
- React Router;
- TanStack Query para estado de servidor;
- React Hook Form;
- Zod para validação compartilhável;
- dnd-kit para arrastar cards com acessibilidade;
- uma solução estável de tabelas quando necessário;
- Recharts ou solução equivalente para gráficos simples;
- Tailwind CSS;
- componentes acessíveis baseados em Radix ou solução equivalente;
- Lucide ou biblioteca consistente de ícones;
- Express;
- MySQL2;
- Drizzle ORM e migrações, ou alternativa MySQL madura equivalente se já houver uma no repositório;
- libphonenumber-js para normalização de telefones;
- biblioteca madura para XLSX;
- parser robusto de CSV;
- ferramenta de testes unitários compatível com Vite;
- Supertest ou equivalente para API;
- Playwright apenas para testes E2E da própria aplicação, nunca para scraping do Google.

Não inclua uma biblioteca apenas por conveniência se ela trouxer binários incompatíveis com a Hostinger. Prefira dependências portáveis.

## Qualidade de código

Configure:

- TypeScript strict;
- ESLint;
- Prettier;
- aliases de importação claros;
- tratamento centralizado de erros;
- logging estruturado sem segredos;
- validação de variáveis de ambiente na inicialização;
- contratos de API tipados;
- separação entre controllers, services, repositories e regras puras quando isso reduzir acoplamento;
- scripts de desenvolvimento, build, start, lint, typecheck, test, test:integration e test:e2e;
- arquivo .env.example sem valores secretos;
- .gitignore correto;
- migrations e seed de desenvolvimento;
- dados demonstrativos apenas no ambiente de desenvolvimento.

## Configuração de produção

A aplicação deve:

- usar process.env.PORT;
- escutar em 0.0.0.0;
- confiar no proxy somente conforme configuração explícita;
- usar cookies secure em produção;
- ter desligamento gracioso;
- encerrar conexão MySQL corretamente;
- ter endpoint GET /api/health sem segredos;
- ter endpoint opcional de readiness que teste o banco sem revelar credenciais;
- limitar tamanho de body e uploads;
- servir assets com cache apropriado;
- não guardar estado crítico na memória do processo.

## Variáveis de ambiente esperadas

Prepare e documente pelo menos:

    NODE_ENV
    PORT
    HOST
    APP_URL
    APP_TIMEZONE
    DB_HOST
    DB_PORT
    DB_NAME
    DB_USER
    DB_PASSWORD
    DB_SSL
    SESSION_SECRET
    ADMIN_EMAIL
    ADMIN_INITIAL_PASSWORD
    GOOGLE_MAPS_API_KEY
    GOOGLE_PLACES_LANGUAGE
    GOOGLE_PLACES_REGION
    GOOGLE_TEXT_SEARCH_MONTHLY_HARD_LIMIT
    GOOGLE_DETAILS_MONTHLY_HARD_LIMIT
    GOOGLE_USAGE_WARNING_PERCENT
    MAX_IMPORT_FILE_MB
    CRON_SECRET

Regras:

- APP_TIMEZONE deve assumir America/Sao_Paulo.
- ADMIN_EMAIL deve assumir stavodigital123@gmail.com.
- ADMIN_INITIAL_PASSWORD é um segredo de bootstrap temporário e não pode permanecer necessário depois da criação do administrador.
- O sistema deve recusar inicialização em produção quando um segredo obrigatório for fraco, ausente ou igual ao exemplo.
- Não coloque valores reais no arquivo .env.example.

## Critérios de aceite

- Desenvolvimento local sobe com comandos documentados.
- Build gera frontend e backend utilizáveis em um único deploy.
- API e SPA não conflitam.
- Ambiente inválido falha de forma clara e segura.
- Lint e typecheck passam.

---

# PASSO 3 — MODELO DE DADOS, MIGRAÇÕES E INVARIANTES

## Objetivo

Criar um banco normalizado que preserve histórico, evite duplicações e sustente métricas corretas.

## Princípios obrigatórios

- Não derive todas as métricas apenas da coluna atual do card.
- Mantenha estado atual e eventos históricos separados.
- Eventos comerciais e financeiros importantes devem ser imutáveis.
- Correções devem ser representadas por eventos de reversão ou cancelamento.
- Use transações em operações que alteram mais de uma entidade.
- Use chaves de idempotência em movimentações críticas.
- Valores monetários devem usar DECIMAL, nunca float.
- Registre created_at e updated_at quando aplicável.
- Registre occurred_at nos eventos.
- Use UTC no banco.
- Arquive leads em vez de apagá-los.
- Desative serviços com histórico em vez de apagá-los.

## Entidades mínimas

Implemente um modelo equivalente às entidades abaixo. Os nomes físicos podem variar, mas as responsabilidades e invariantes não.

### users

- id;
- email único;
- password_hash;
- active;
- last_login_at;
- password_changed_at;
- created_at;
- updated_at.

Existe apenas um usuário, mas não codifique autenticação insegura por causa disso.

### auth_sessions

- id ou hash do token;
- user_id;
- expires_at;
- last_seen_at;
- created_at;
- revoked_at;
- metadados mínimos de segurança, sem armazenar dados excessivos.

### app_settings

- chave;
- valor tipado ou JSON validado;
- updated_at.

Armazene preferências não secretas, nunca chaves de API ou senha.

### lead_sources

- id;
- name;
- slug;
- is_system;
- active;
- created_at;
- updated_at.

Seed inicial sugerido:

- Google Maps;
- Planilha;
- Instagram;
- Facebook;
- Indicação;
- Manual;
- Outro.

O usuário pode criar outras origens e desativar origens sem histórico.

### stages

- id;
- name;
- semantic_key;
- color;
- position;
- active;
- is_system;
- created_at;
- updated_at.

semantic_key deve representar o significado interno, independentemente do nome visível:

- SELECTED;
- FIRST_CONTACT;
- FOLLOW_UP;
- REPLIED;
- NEGOTIATION;
- AWAITING_PAYMENT;
- WON;
- LOST;
- AUXILIARY.

O nome, a cor e a ordem podem mudar. O significado interno continua alimentando o dashboard.

### leads

Campos mínimos:

- id;
- origin_type: GOOGLE_PLACE, IMPORTED ou MANUAL;
- source_id;
- current_stage_id;
- internal_name;
- place_id, apenas quando a origem for Google;
- prospecting_niche;
- prospecting_country;
- prospecting_state;
- prospecting_city;
- campaign_or_search_context opcional;
- status;
- incomplete_level;
- archived_at;
- created_at;
- updated_at.

Regras:

- place_id pode ser guardado por tempo indeterminado e deve ser único quando não nulo.
- internal_name é um rótulo próprio do CRM definido pelo usuário.
- Para lead do Google, não salve automaticamente o objeto completo retornado pela API.
- Niche, cidade e contexto digitados pelo usuário na pesquisa são metadados próprios da campanha e podem ser guardados.
- O card deve continuar identificável sem depender da disponibilidade momentânea do Google.

### lead_contacts

Para dados próprios, importados ou explicitamente confirmados pelo usuário:

- id;
- lead_id;
- type: PHONE, WHATSAPP, EMAIL ou OTHER;
- value;
- normalized_value;
- origin: MANUAL, IMPORT, USER_CONFIRMED;
- is_primary;
- is_confirmed;
- created_at;
- updated_at.

Não insira automaticamente como contato persistido o telefone recebido ao vivo do Google. Ofereça uma ação explícita “Salvar como contato confirmado” caso o usuário queira convertê-lo em dado próprio.

### lead_links

- id;
- lead_id;
- type: WEBSITE, DEMO_OR_PROPOSAL, INSTAGRAM, FACEBOOK, WHATSAPP, MAPS, DIRECTORY, LINK_IN_BIO ou OTHER;
- url;
- normalized_host;
- origin: MANUAL, IMPORT, USER_CONFIRMED;
- is_primary;
- created_at;
- updated_at.

Para origem Google, o Maps deve ser reaberto pelo place_id ou pelos dados ao vivo. Não grave silenciosamente links retornados pelo Google como snapshot.

DEMO_OR_PROPOSAL representa um link próprio da Stavo Digital, como uma demonstração já preparada para apresentar ao lead. Esse dado pertence ao CRM e pode ser armazenado normalmente.

### lead_identity_keys e memberships

Crie uma estrutura de identidades normalizadas para impedir duplicações e permitir uma exceção humana documentada para unidades reais que compartilham telefone ou domínio.

lead_identity_keys:

- id;
- key_type: PLACE_ID, PHONE, OWN_DOMAIN, NAME_ADDRESS;
- key_hash ou valor normalizado;
- is_shared_exception;
- exception_reason;
- created_at;
- updated_at.

lead_identity_memberships:

- identity_key_id;
- lead_id;
- created_at.

Regras:

- key_type + key_hash é único na tabela de chaves;
- identity_key_id + lead_id é único nas associações;
- place_id também permanece único diretamente em leads e nunca pode ser compartilhado;
- por padrão, uma chave já pertencente a outro lead bloqueia criação automática;
- somente a decisão explícita “São leads diferentes” pode transformar telefone ou domínio compartilhado em exceção;
- a exceção guarda motivo e auditoria;
- uma chave compartilhada nunca autoriza uma terceira importação automática: ela volta para revisão;
- criação e atualização das chaves acontecem na mesma transação do lead.

### services

- id;
- name;
- description;
- billing_type: ONE_TIME ou RECURRING_MONTHLY;
- default_price;
- active;
- created_at;
- updated_at.

Nenhum serviço é fixo. Os exemplos de site ou manutenção são apenas exemplos e devem ser editáveis.

### lead_service_interests ou opportunities

Permita vários serviços por lead:

- id;
- lead_id;
- service_id;
- proposed_price;
- billing_type_snapshot;
- notes;
- status;
- created_at;
- updated_at.

### lead_events

Log imutável de eventos:

- id;
- lead_id;
- event_type;
- idempotency_key único quando fornecido;
- actor_user_id;
- occurred_at;
- payload JSON validado e versionado;
- created_at.

O payload não pode ser usado para guardar snapshots proibidos do Google.

Eventos mínimos:

- LEAD_CREATED;
- LEAD_ARCHIVED;
- STAGE_MOVED;
- FIRST_CONTACT_RECORDED;
- CONTACT_ATTEMPT_RECORDED;
- FOLLOW_UP_SCHEDULED;
- FOLLOW_UP_COMPLETED;
- FIRST_RESPONSE_RECORDED;
- NEGOTIATION_STARTED;
- LOSS_RECORDED;
- AWAITING_PAYMENT_RECORDED;
- SALE_RECORDED;
- SALE_REVERSED;
- RECEIVABLE_GENERATED;
- PAYMENT_RECEIVED;
- PAYMENT_REVERSED;
- SUBSCRIPTION_STARTED;
- SUBSCRIPTION_CHANGED;
- SUBSCRIPTION_CANCELED;
- DATA_CONFIRMED;
- IMPORT_COMPLETED.

### stage_history

- id;
- lead_id;
- stage_id;
- entered_at;
- exited_at;
- movement_event_id.

Deve ser possível calcular tempo em cada etapa e o estado atual sem apagar passagens antigas.

### activities

- id;
- lead_id;
- activity_type: NOTE, CALL, WHATSAPP_ATTEMPT, CONTACT_ATTEMPT, MEETING, OTHER;
- body;
- occurred_at;
- created_by;
- created_at;
- updated_at quando a nota for editável.

Anotações não devem ser sobrescritas por importação.

### follow_ups

- id;
- lead_id;
- due_at;
- status: PENDING, COMPLETED, CANCELED;
- note;
- completed_at;
- created_at;
- updated_at.

Permita follow-up atrasado, para hoje e futuro.

### loss_reasons

- id;
- name;
- active;
- is_system;
- position.

Seed inicial:

- Não tem interesse;
- Achou caro;
- Já possui fornecedor;
- Já possui site;
- Não respondeu;
- Contato inválido;
- Fora do perfil;
- Pediu para retornar futuramente;
- Outro.

### sales

- id;
- lead_id;
- status: PENDING, CONFIRMED, CANCELED, REVERSED;
- agreed_at;
- confirmed_at;
- total_snapshot;
- notes;
- created_by;
- created_at;
- updated_at.

### sale_items

- id;
- sale_id;
- service_id;
- service_name_snapshot;
- billing_type_snapshot;
- unit_price_snapshot;
- quantity;
- total_snapshot;
- created_at.

Alterar o catálogo depois não pode mudar a venda histórica.

### subscriptions

- id;
- lead_id;
- sale_item_id;
- service_id;
- service_name_snapshot;
- amount_snapshot;
- status: ACTIVE, PAUSED ou CANCELED;
- first_due_date;
- next_due_date;
- canceled_at;
- cancellation_reason;
- created_at;
- updated_at.

### receivables

- id;
- lead_id;
- sale_id opcional;
- subscription_id opcional;
- reference_period;
- description_snapshot;
- amount;
- due_date;
- status: PENDING, OVERDUE, PAID, CANCELED, REVERSED;
- paid_at;
- canceled_at;
- created_at;
- updated_at.

Adicione unicidade em subscription_id + reference_period para impedir mensalidade duplicada.

### payments ou financial_events

- id;
- receivable_id;
- amount;
- payment_date;
- status;
- reversal_of_id opcional;
- reason opcional;
- created_by;
- created_at.

Um pagamento confirmado deve ser reversível com motivo, nunca apagado.

### goals

- id;
- metric_type: FIRST_CONTACTS, SALES_COUNT ou REALIZED_REVENUE;
- period_type: DAILY, WEEKLY ou MONTHLY;
- target_value;
- starts_on;
- ends_on opcional;
- active;
- created_at;
- updated_at.

### import_jobs

- id;
- original_filename;
- source_id;
- service_id opcional;
- status;
- total_rows;
- imported_rows;
- duplicate_rows;
- probable_duplicate_rows;
- incomplete_rows;
- invalid_rows;
- created_at;
- completed_at.

Não guarde o arquivo inteiro indefinidamente sem necessidade.

### import_rows ou import_results

Guarde apenas o necessário para relatório e revisão:

- import_job_id;
- row_number;
- status;
- lead_id opcional;
- duplicate_lead_id opcional;
- validation_errors JSON;
- normalized_match_summary;
- created_at.

Nunca armazene senha ou segredos em linhas de importação.

### duplicate_reviews

- id;
- candidate_lead_id;
- existing_lead_id;
- reason;
- status: PENDING, CONFIRMED_SAME, CONFIRMED_DIFFERENT, DISMISSED;
- reviewed_at;
- created_at.

### google_api_usage

- id;
- billing_month;
- sku_type: TEXT_SEARCH ou PLACE_DETAILS;
- request_count;
- warning_sent ou warning_state;
- updated_at.

Atualização deve ser atômica. Cada página chamada conta como uma requisição.

### search_runs

Opcional, apenas com metadados próprios da pesquisa:

- id;
- query_text;
- niche;
- country;
- state;
- city;
- region_or_neighborhood;
- selected_service_id;
- website_filter;
- pages_requested;
- result_count;
- created_at.

Não armazene o conteúdo completo dos resultados nesta tabela.

### audit_log

Registre ações administrativas sensíveis:

- alteração de senha;
- mudança de configuração;
- arquivamento;
- cancelamento e reversão financeira;
- alteração de etapa semântica;
- importações;
- alteração de limites de API.

Não registre senha, segredo, token de sessão ou conteúdo sensível desnecessário.

## Índices e consistência

Crie índices para:

- leads por current_stage_id;
- leads por source_id;
- leads por created_at e archived_at;
- events por lead_id + occurred_at;
- events por event_type + occurred_at;
- follow-ups por status + due_at;
- receivables por status + due_date;
- subscriptions por status + next_due_date;
- sales por status + confirmed_at;
- identities por tipo e hash;
- usage por mês e SKU;
- stages por posição.

Use foreign keys quando forem compatíveis com o fluxo. Defina comportamento de exclusão restritivo para histórico.

## Seed obrigatório

Crie seed idempotente para:

- etapas padrão;
- motivos de perda;
- origens padrão;
- configurações iniciais não secretas.

O seed não pode duplicar dados se executado novamente.

## Critérios de aceite

- Banco é criado do zero por migrações.
- Seed é idempotente.
- Reexecução não duplica etapas.
- Um place_id não pode pertencer a dois leads.
- Uma identidade forte não pode criar dois leads.
- Uma mensalidade do mesmo período não pode ser gerada duas vezes.
- Histórico não é apagado ao mover card.
- Valores históricos não mudam ao editar serviço.
- Testes de constraints e transações passam.

---

# PASSO 4 — AUTENTICAÇÃO, SESSÃO E SEGURANÇA DE ACESSO

## Objetivo

Proteger toda a ferramenta com uma experiência simples para um único administrador.

## Login

Crie uma tela de login limpa contendo:

- marca/nome da plataforma;
- campo de e-mail;
- campo de senha;
- botão primário azul “Entrar”;
- mensagem de erro genérica;
- estado de carregamento;
- acessibilidade completa.

O e-mail aceito é o usuário ativo armazenado no banco e inicialmente será:

    stavodigital123@gmail.com

Não exiba o e-mail como segredo e não assuma que Gmail implica login Google.

## Senha

- Use hash forte com salt individual. Prefira uma implementação portável e segura, como scrypt nativo do Node, Argon2 compatível com o ambiente ou alternativa madura.
- Nunca compare hash manualmente de forma insegura.
- Imponha tamanho mínimo e rejeite senha obviamente fraca no bootstrap.
- Não registre a senha.
- Não retorne hash pela API.

## Bootstrap do administrador

Implemente um processo seguro e documentado:

1. migrações são executadas;
2. se ainda não houver usuário, uma tarefa administrativa cria o administrador a partir de ADMIN_EMAIL e ADMIN_INITIAL_PASSWORD;
3. a tarefa é idempotente e se recusa a substituir usuário existente;
4. após o primeiro login, a aplicação orienta a remover ADMIN_INITIAL_PASSWORD do ambiente;
5. jamais mostre a senha no terminal ou log.

Crie também um comando administrativo de redefinição manual de senha que:

- só seja executado no servidor;
- exija confirmação explícita;
- revogue sessões existentes;
- não dependa de e-mail;
- seja explicado em documentação separada.

## Sessões

- Use cookie HttpOnly.
- Use Secure em produção.
- Use SameSite adequado para aplicação same-origin.
- Gere token criptograficamente aleatório.
- Guarde somente hash do token no banco quando possível.
- Defina expiração por inatividade e expiração absoluta.
- Renove com segurança sem criar sessões ilimitadas.
- Revogue no logout.
- Revogue todas as sessões na redefinição de senha.
- Não use localStorage para autenticação.

## Proteções

Implemente:

- rate limit no login;
- atraso progressivo ou lockout temporário controlado;
- mensagens genéricas para não enumerar usuário;
- proteção CSRF nas mutações;
- validação de Origin/Host;
- cabeçalhos de segurança;
- política de conteúdo compatível com a aplicação;
- sanitização e escape de entradas exibidas;
- limites de body;
- proteção contra SQL injection por queries parametrizadas;
- tratamento seguro de proxy;
- logs sem segredos;
- logout;
- alteração de senha autenticada exigindo senha atual.

## Rotas

- Login e páginas legais podem ser públicas.
- Todo o restante deve exigir sessão.
- Chamadas de API não autenticadas retornam 401 em JSON.
- Frontend redireciona para login sem loop.

## Não implementar

- “Esqueci minha senha”.
- SMTP.
- link mágico.
- autenticação social.
- cadastro.
- segundo usuário.

## Critérios de aceite

- Usuário inválido não entra.
- Senha errada não revela se o e-mail existe.
- Cookie não é acessível por JavaScript.
- Logout invalida sessão.
- Alterar senha invalida sessões antigas conforme regra definida.
- Rotas internas não abrem sem sessão.
- Rate limit é testado.
- Procedimento manual de reset está documentado.
- Rotas privadas enviam noindex e a aplicação fornece robots.txt restritivo; isso complementa, mas nunca substitui, a autenticação.

---

# PASSO 5 — DESIGN SYSTEM, NAVEGAÇÃO E EXPERIÊNCIA BASE

## Objetivo

Construir uma interface moderna, clara e funcional, inspirada nos princípios de bons produtos SaaS, sem copiar visualmente outro produto.

## Direção visual

- Tema claro e neutro.
- Aparência profissional, atual e confiável.
- Muito boa hierarquia visual.
- Espaçamento consistente.
- Textos objetivos.
- Pouco ruído.
- Sem excesso de números, cores, bordas ou enfeites.
- Sem botões dourados.
- Azul para ações primárias.
- Cinza para ações secundárias.
- Vermelho para ações destrutivas ou irreversíveis.
- Verde para sucesso, venda recebida ou meta atingida.
- Âmbar para atenção, pendência ou atraso.
- Nunca dependa somente da cor; combine cor, texto e ícone.

## Princípios de referência

Use como princípios, não como cópias:

- Pipedrive: funil visual e foco na próxima ação;
- Trello: compreensão imediata de colunas e cards;
- Attio: flexibilidade de dados, filtros e visualizações;
- Linear: velocidade, baixo ruído e atalhos;
- Stripe: métricas financeiras claras e alertas prioritários.

## Navegação recomendada

Crie uma navegação lateral no desktop e uma navegação adaptada no celular com:

- Dashboard;
- Buscar empresas;
- CRM;
- Importar leads;
- Serviços;
- Financeiro;
- Metas;
- Configurações.

Exiba o e-mail do usuário e logout em área discreta.

## Padrões de componentes

Crie componentes reutilizáveis para:

- botões;
- campos;
- selects;
- badges;
- tooltips;
- modais;
- drawers;
- toasts;
- tabelas;
- cards;
- skeletons;
- estados vazios;
- mensagens de erro;
- confirmações destrutivas;
- barras de progresso;
- indicadores financeiros;
- filtros;
- paginação;
- seletores de data.

## Botões

- Primário: azul, contraste acessível, uma ação dominante por contexto.
- Secundário: cinza/neutro.
- Destrutivo: vermelho.
- Desabilitado: visualmente claro, com explicação quando necessário.
- Estado de carregamento evita clique duplicado.

## Confirmações

Toda exclusão ou ação sem volta deve abrir modal com:

- título claro;
- descrição do que será afetado;
- consequência;
- botão vermelho específico, por exemplo “Arquivar lead”;
- botão cinza “Cancelar”;
- foco inicial seguro;
- suporte a teclado.

Para histórico financeiro, não use “Excluir”. Use “Cancelar”, “Estornar” ou “Reverter”, sempre pedindo motivo.

## Ajuda contextual

Quando uma métrica ou ação não for autoexplicativa:

- mostre ícone de interrogação;
- no desktop, permita hover e foco;
- no celular, permita toque;
- explique em uma frase curta;
- para métricas, informe a fórmula;
- não esconda instruções essenciais apenas em tooltip.

## Feedback

- Ações comuns: toast breve com “Desfazer” quando tecnicamente seguro.
- Erros: explique o que aconteceu e o que o usuário pode fazer.
- API externa indisponível: preserve a interface interna e ofereça tentar novamente.
- Formulários: erros próximos ao campo.
- Carregamentos: skeleton, não layout pulando.
- Estados vazios: ação clara para começar.

## Responsividade

- Desktop é a experiência principal.
- Celular deve ser plenamente utilizável.
- Drag and drop funciona no desktop.
- No celular, sempre ofereça seletor “Mover para…”.
- Nenhuma função crítica pode depender exclusivamente de arrastar.
- Tabelas devem se adaptar ou virar listas, sem rolagem confusa.
- Drawers e modais devem respeitar tela pequena.
- Áreas de toque adequadas.

## Acessibilidade

- HTML semântico.
- Navegação por teclado.
- foco visível;
- labels reais;
- aria apenas quando necessário;
- contraste adequado;
- anúncios de mudanças importantes;
- dnd acessível;
- erros associados aos campos;
- ícones acompanhados por texto ou rótulo;
- respeito a preferência de redução de movimento.

## Critérios de aceite

- Layout funciona em desktop e celular.
- A hierarquia visual indica claramente próxima ação.
- Componentes têm estados loading, disabled, error e empty.
- A interface não usa dourado.
- Exclusões usam confirmação vermelha.
- Ações comuns não interrompem o fluxo desnecessariamente.
- Testes básicos de acessibilidade passam.

---

# PASSO 6 — CONFIGURAÇÕES, ORIGENS, SERVIÇOS E ETAPAS

## Objetivo

Permitir que o usuário personalize o processo sem quebrar métricas históricas.

## Serviços

Crie uma tela “Serviços” com:

- lista de serviços ativos e inativos;
- nome;
- descrição;
- preço padrão;
- tipo de cobrança: pagamento único ou recorrente mensal;
- criar;
- editar;
- desativar;
- reativar.

Regras:

- preço padrão preenche propostas e vendas, mas pode ser alterado no negócio;
- desativar não altera leads ou vendas antigas;
- serviço com histórico não deve ser apagado fisicamente;
- alterar preço padrão não muda valores já negociados, vendas, recebíveis ou assinaturas existentes;
- um lead pode ter vários serviços.

## Origens de lead

Crie gestão simples das origens:

- mostrar padrões;
- criar origem personalizada;
- renomear origem personalizada;
- desativar origem sem perder histórico;
- impedir exclusão destrutiva quando houver leads vinculados.

## Etapas do CRM

Seed e exiba nesta ordem:

1. Selecionados;
2. Contato realizado;
3. Follow-up;
4. Respondeu;
5. Em negociação;
6. Aguardando pagamento;
7. Venda concluída;
8. Recusado/Perdido.

Regras:

- usuário pode renomear;
- usuário pode mudar cor;
- usuário pode reordenar;
- usuário pode criar etapa auxiliar;
- cada etapa principal mantém semantic_key;
- etapa auxiliar usa AUXILIARY e não gera métrica principal sozinha;
- coluna principal não pode ser apagada sem remapear seu significado e mover os cards;
- ao apagar etapa auxiliar, exigir etapa de destino para cards existentes;
- não permitir duas etapas com o mesmo significado principal sem regra explícita;
- alterações de nome não afetam histórico.

Explique na interface, em linguagem simples, “O que esta etapa representa?”.

## Configurações gerais

Inclua:

- nome exibido da plataforma;
- meta/limites visíveis da API Google, sem chave;
- formatos padrão;
- parâmetros de cards parados;
- preferências de dashboard;
- opção de exportar dados;
- segurança e alteração de senha.

Segredos permanecem no ambiente do servidor e nunca aparecem integralmente na interface.

## Critérios de aceite

- Serviço único e recorrente podem ser criados.
- Alterar serviço não muda venda antiga.
- Etapa pode ser renomeada e o dashboard continua correto.
- Etapa auxiliar não infla métricas.
- Não é possível apagar histórico por uma ação simples.

---

# PASSO 7 — NÚCLEO DO CRM KANBAN

## Objetivo

Construir o centro operacional da plataforma, semelhante ao Trello, mas conectado a métricas, follow-ups, serviços e finanças.

## Colunas

Cada coluna deve mostrar:

- nome;
- cor discreta;
- quantidade de cards;
- total financeiro quando fizer sentido;
- controles de configuração;
- rolagem adequada;
- estado vazio útil.

## Card compacto

Exiba apenas informações que ajudam a decidir:

- nome interno do lead;
- origem;
- serviço ou serviços principais;
- valor proposto quando houver;
- tipo de cobrança;
- próximo follow-up;
- tempo na etapa;
- alertas;
- badge de “Dados incompletos”;
- indicador de atraso;
- indicador de pagamento;
- indicador de lead já respondido ou vendido quando necessário.

Não sobrecarregue o card com endereço completo, notas longas ou histórico.

## Drawer de detalhes

Ao abrir o card, mostre painel lateral com seções claras:

- Visão geral;
- Contatos e links;
- Serviço e proposta;
- Atividades e anotações;
- Follow-ups;
- Histórico de etapas;
- Venda e financeiro;
- Dados atuais do Google, quando originado do Google;
- Origem e metadados da prospecção.

Para leads do Google:

- carregue detalhes atuais sob demanda;
- mostre estado de carregamento;
- mostre atribuição Google;
- se a API falhar, preserve todo o conteúdo próprio do CRM e informe que os dados públicos não estão disponíveis no momento;
- permita salvar explicitamente um contato ou link como dado confirmado pelo usuário;
- não persista automaticamente a resposta completa.

## Movimentação

No desktop:

- arrastar e soltar;
- teclado quando suportado;
- atualização otimista apenas se houver rollback seguro.

No celular:

- botão ou seletor “Mover para…”;
- mesma regra de negócio do drag and drop.

Toda movimentação deve:

1. validar destino;
2. iniciar transação;
3. atualizar current_stage_id;
4. fechar stage_history anterior;
5. abrir novo stage_history;
6. criar STAGE_MOVED;
7. criar evento semântico apenas quando aplicável;
8. atualizar entidades financeiras quando for uma etapa crítica;
9. confirmar transação;
10. atualizar a interface.

## Ações comuns e críticas

Movimentos comuns podem ser concluídos com toast e “Desfazer”:

- Selecionados para Contato realizado;
- Contato realizado para Follow-up;
- Follow-up para Respondeu;
- etapas auxiliares.

Movimentos críticos exigem formulário ou confirmação:

- Em negociação;
- Aguardando pagamento;
- Venda concluída;
- Recusado/Perdido;
- cancelamento;
- reversão financeira.

## Primeiro contato

Regra fundamental:

- lead em Selecionados ainda não foi abordado;
- primeira entrada semântica em FIRST_CONTACT cria FIRST_CONTACT_RECORDED;
- o evento de primeiro contato só pode existir uma vez por lead;
- mover para trás e novamente para Contato realizado não cria outro primeiro contato;
- registrar nova tentativa cria CONTACT_ATTEMPT_RECORDED;
- follow-up nunca conta como novo lead nem novo primeiro contato.

## Follow-up

- A coluna Follow-up representa estado atual.
- O histórico registra quantas tentativas foram realizadas.
- Usuário pode registrar tentativa sem mover card.
- Usuário pode definir próximo follow-up.
- Dashboard mostra follow-ups atrasados, hoje e futuros.
- Concluir um follow-up não apaga seu histórico.
- Um lead pode passar várias vezes por follow-up.
- “Recontatar futuramente” deve ser resolvido por uma data de follow-up e sinalização, sem exigir outra coluna padrão.

## Resposta

- Primeira entrada semântica em REPLIED cria FIRST_RESPONSE_RECORDED uma única vez.
- Conversas posteriores são atividades, não novas respostas únicas para taxa principal.
- Mover para trás e voltar não duplica a resposta.

## Negociação

Ao entrar em negociação:

- permita escolher serviço ou serviços;
- preencher preço padrão;
- permitir alterar valor proposto;
- registrar notas;
- manter snapshot relevante da proposta.

## Recusado/Perdido

Ao mover:

- exigir motivo;
- permitir observação;
- se “retornar futuramente”, permitir data de follow-up;
- criar LOSS_RECORDED uma única vez por ciclo lógico, com proteção contra duplicação;
- preservar todo o histórico;
- permitir reabrir o lead posteriormente sem apagar a perda anterior.

## Arquivamento

- Use “Arquivar lead”, não exclusão física.
- Confirme a ação.
- Lead arquivado some da visão padrão.
- Pode ser consultado e restaurado.
- Eventos, vendas e pagamentos permanecem.

## Dados incompletos

Crie dois níveis:

### Crítico — contorno vermelho

- nome interno ausente; ou
- nenhum meio direto de contato persistido ou disponível.

Para lead importado sem telefone:

- importe mesmo assim;
- mostre contorno vermelho;
- ícone de alerta;
- badge “Dados incompletos”;
- drawer lista “Telefone ausente”.

### Atenção — aviso amarelo

Exemplos:

- Instagram ausente;
- website ausente;
- Maps ausente;
- cidade ausente;
- serviço não associado.

Não bloqueie o fluxo por informação opcional.

## Filtros e busca

Inclua:

- texto;
- etapa;
- origem;
- serviço;
- cidade;
- nicho;
- status de follow-up;
- status financeiro;
- completos/incompletos;
- arquivados;
- período de entrada.

Permita limpar filtros e mostre filtros ativos.

## Critérios de aceite

- Drag funciona sem duplicar eventos.
- Se a API falhar, o movimento é revertido visualmente.
- Primeiro contato existe apenas uma vez.
- Três follow-ups continuam sendo um primeiro contato.
- Resposta única não é duplicada.
- Motivo de perda é obrigatório.
- Histórico mostra todas as passagens.
- Card incompleto importado aparece em vermelho.
- Mobile consegue mover sem drag.
- Arquivamento não apaga dados.

---

# PASSO 8 — MOTOR DE EVENTOS, HISTÓRICO E MÉTRICAS

## Objetivo

Garantir que o dashboard represente fatos históricos e não apenas a posição atual dos cards.

## Separação obrigatória

O sistema possui dois tipos de informação:

### Estado atual

Responde “onde cada lead está agora?”:

- quantos estão selecionados;
- quantos estão em contato realizado;
- quantos estão em follow-up;
- quantos responderam;
- quantos estão negociando;
- quantos aguardam pagamento;
- quantos estão vendidos;
- quantos estão recusados/perdidos.

### Histórico do período

Responde “o que aconteceu hoje, nesta semana ou neste mês?”:

- primeiros contatos feitos;
- tentativas adicionais;
- respostas únicas recebidas;
- follow-ups realizados;
- negociações iniciadas;
- recusas registradas;
- vendas confirmadas;
- pagamentos recebidos;
- receita realizada.

Mover um card de uma etapa para outra altera o estado atual, mas não apaga fatos históricos.

## Regras de unicidade

Por lead:

- FIRST_CONTACT_RECORDED: no máximo um evento principal;
- FIRST_RESPONSE_RECORDED: no máximo um evento principal;
- uma venda pode ter vários itens, mas a contagem de venda deve seguir a entidade de venda confirmada;
- tentativas podem ser várias;
- follow-ups podem ser vários;
- perdas podem existir em ciclos diferentes, mas não devem ser duplicadas por reenvio da mesma requisição;
- pagamentos devem ser idempotentes.

Implemente invariantes no serviço e, quando possível, no banco.

## Idempotência

Toda mutação crítica aceita ou gera uma idempotency_key:

- movimentar etapa;
- confirmar venda;
- gerar recebível;
- confirmar pagamento;
- gerar mensalidade;
- processar importação;
- desfazer ação.

Se a mesma requisição chegar duas vezes:

- retorne o resultado original;
- não crie evento duplicado;
- não duplique valor;
- não mova card duas vezes.

## Eventos derivados de etapa

Use semantic_key, nunca apenas o texto visível da coluna:

| semantic_key | Ação histórica |
| --- | --- |
| SELECTED | Não cria contato |
| FIRST_CONTACT | Registra primeiro contato se ainda não existir |
| FOLLOW_UP | Atualiza estado e pode agendar follow-up; tentativa é registrada por ação explícita |
| REPLIED | Registra primeira resposta se ainda não existir |
| NEGOTIATION | Registra início de negociação conforme regra idempotente |
| AWAITING_PAYMENT | Cria ou associa valor pendente após confirmação do usuário |
| WON | Confirma venda/recebimento conforme fluxo financeiro |
| LOST | Exige e registra motivo |
| AUXILIARY | Apenas organização e histórico de movimento |

Não gere uma nova tentativa somente porque o card entrou na coluna Follow-up. O usuário pode estar apenas organizando o lead. A tentativa deve ser registrada por “Registrar tentativa” ou por uma ação que explicitamente represente contato.

## Cálculos oficiais

### Primeiros contatos

Quantidade de leads únicos com FIRST_CONTACT_RECORDED dentro do período.

### Tentativas de contato

Quantidade de CONTACT_ATTEMPT_RECORDED no período. Defina se o primeiro contato também aparece em uma métrica ampliada de tentativas, mas nunca misture essa métrica com “Contatos novos”.

### Respostas

Quantidade de leads únicos cujo FIRST_RESPONSE_RECORDED ocorreu no período selecionado.

### Taxa de resposta

    leads únicos que responderam / leads únicos com primeiro contato

Ao filtrar por coorte, documente o comportamento. Para o painel principal, use eventos do período de maneira consistente. Nunca permita que um lead contribua duas vezes ao numerador principal.

### Taxa de recusa

    leads únicos marcados como recusados/perdidos / leads únicos com primeiro contato

### Taxa de conversão

    clientes ou leads únicos com venda confirmada / leads únicos com primeiro contato

### Ticket médio

    valor total de vendas confirmadas / quantidade de vendas confirmadas

### Receita realizada

Soma de pagamentos com status válido e data de recebimento no período, descontando reversões correspondentes.

### Valor aguardando pagamento

Soma dos recebíveis pendentes e vencidos não cancelados.

### Receita recorrente mensal ativa

Soma do amount_snapshot de assinaturas ACTIVE, sem transformar expectativa em receita recebida.

### Período sem denominador

Se o denominador for zero, exiba “—” e explicação, não uma porcentagem enganosa.

## Tempo em etapa

Calcule com stage_history:

- tempo atual na coluna;
- média por etapa;
- negociações paradas;
- leads selecionados sem ação;
- follow-ups vencidos.

O limite de “parado” pode ser configurável.

## Filtros de métricas

Prepare consultas por:

- hoje;
- semana;
- mês;
- intervalo personalizado;
- origem;
- serviço;
- nicho;
- cidade;
- etapa;
- tipo de cobrança.

Evite fazer cálculos financeiros no frontend. A API deve retornar valores e fórmulas coerentes.

## Critérios de aceite

- Mover card para trás não reduz primeiros contatos históricos.
- Voltar para FIRST_CONTACT não duplica contato.
- Três tentativas são três tentativas e um contato novo.
- Venda revertida deixa de compor receita líquida, mas permanece no histórico.
- Métricas batem com fixtures conhecidas.
- Filtros não misturam fuso UTC com dia de São Paulo.
- Consultas possuem índices e desempenho adequado.

---

# PASSO 9 — INTEGRAÇÃO OFICIAL COM GOOGLE PLACES

## Objetivo

Pesquisar e exibir negócios reais de maneira sustentável, controlada e compatível com as regras do Google Maps Platform.

## Integração permitida

Use exclusivamente a API oficial Google Places API (New), por chamadas feitas no backend.

Não use:

- scraping;
- automação do site do Google Maps;
- APIs não oficiais;
- extensões de navegador;
- proxies para contornar limites;
- CAPTCHA bypass.

## Chave da API

- Fica apenas no servidor.
- Nunca aparece no bundle Vite.
- Nunca é enviada ao navegador.
- Nunca aparece em log.
- Deve ser restrita no Google Cloud à API necessária.
- Documente restrições de uso e rotação.
- Se ausente, a aplicação interna continua funcionando e a tela de pesquisa apresenta instrução de configuração.

## Pesquisa

Use Text Search (New) com:

- consulta por nicho ou profissão;
- país;
- estado;
- cidade;
- bairro ou região opcional;
- idioma pt-BR;
- região BR inicialmente;
- field mask mínimo necessário;
- paginação controlada.

O foco inicial é o Brasil. Mantenha o modelo preparado para país, estado/região e cidade, sem lógica rígida que impeça pesquisas internacionais no futuro. Expansão internacional não é requisito de lançamento.

Uma página retorna até 20 resultados. Uma consulta completa pode usar até três páginas e chegar a até 60 resultados. Cada página consumida conta como uma requisição.

Na interface:

- primeira pesquisa carrega até 20;
- botão “Carregar mais” solicita a próxima página;
- novo botão pode solicitar a terceira;
- não carregue automaticamente todas as páginas sem necessidade;
- deixe claro o consumo aproximado;
- nunca prometa que os 60 resultados representam todos os negócios da cidade.

## Campos exibidos quando disponíveis

- nome atual da empresa;
- endereço;
- telefone;
- nota;
- quantidade de avaliações;
- categoria;
- businessStatus;
- websiteUri;
- googleMapsUri ou link equivalente;
- place_id.

Use o menor field mask necessário para a experiência escolhida e para controlar custos.

## Status do negócio

Trate corretamente:

- OPERATIONAL: exibir;
- TEMPORARILY_CLOSED: exibir com aviso;
- PERMANENTLY_CLOSED: ocultar por padrão;
- abertura futura, se retornada: sinalizar adequadamente.

Não confunda businessStatus com horário atual.

Não use “Aberto agora” como filtro.

Uma empresa operacional deve aparecer mesmo que a pesquisa seja realizada fora do horário comercial.

## Persistência permitida

Para um lead originado do Google, persista:

- place_id;
- internal_name definido pelo usuário;
- origem;
- nicho e localização digitados pelo usuário como contexto de prospecção;
- serviço selecionado;
- etapa;
- notas;
- atividades;
- follow-ups;
- propostas;
- vendas;
- pagamentos;
- históricos;
- contatos ou links que o usuário explicitamente confirmar como dados próprios.

Não persista automaticamente:

- snapshot do nome retornado pelo Google;
- endereço retornado;
- telefone retornado;
- nota;
- quantidade de avaliações;
- categoria;
- website;
- conteúdo integral da resposta.

Resultados da pesquisa podem existir no estado transitório da sessão/interface durante o uso, mas não como base permanente de cópia do Google.

## Adição ao CRM

O botão “Adicionar ao CRM” é a única ação da pesquisa que cria lead.

Botões “WhatsApp”, “Ligar”, “Google Maps” ou “Instagram” não adicionam o lead automaticamente.

Ao adicionar:

1. verifique duplicidade;
2. exiba o nome atual do Google apenas como referência transitória;
3. solicite ou confirme um nome interno do lead;
4. permita associar serviço;
5. grave place_id e dados próprios;
6. coloque na etapa Selecionados;
7. crie LEAD_CREATED;
8. marque o resultado como “Já está no CRM”;
9. ofereça “Abrir card”.

Não faça snapshot silencioso do objeto Google.

## Detalhes no CRM

Ao abrir card GOOGLE_PLACE:

1. use place_id;
2. confira limite interno da SKU Place Details;
3. consulte detalhes atuais no backend;
4. envie apenas o necessário ao frontend;
5. exiba atribuição;
6. descarte a resposta depois da sessão/requisição;
7. não grave cache persistente de conteúdo;
8. em falha, mostre dados internos do CRM normalmente.

Ofereça ação explícita para:

- “Salvar telefone como contato confirmado”;
- “Salvar Instagram como link confirmado”;
- “Salvar website como link confirmado”.

Antes de salvar, deixe claro que o usuário está confirmando e incorporando esse dado ao CRM.

## Place IDs

- Guarde place_id de forma duradoura.
- Crie rotina documentada para atualização de IDs antigos conforme orientação do provedor.
- Considere revisão ou refresh de place_ids armazenados há mais de 12 meses, usando operação somente de IDs quando aplicável.
- A rotina deve ser somente de ID quando possível.
- Não transforme a atualização de ID em snapshot de conteúdo.

## Atribuição

- Mostre a identificação exigida do Google nos resultados.
- Quando os dados forem exibidos sem mapa, use o padrão de atribuição aplicável.
- A atribuição deve estar no mesmo contexto visual dos resultados.
- Não esconda, recorte ou estilize de maneira proibida.
- Crie páginas de Termos de Uso e Política de Privacidade adequadas ao uso interno e à integração.
- Documente que o desenvolvedor deve revisar as políticas oficiais vigentes antes do deploy.

## Contagem e limite de consumo

Mantenha contadores separados:

- TEXT_SEARCH;
- PLACE_DETAILS.

Regras:

- cada página realmente solicitada incrementa TEXT_SEARCH;
- cada consulta de detalhe incrementa PLACE_DETAILS;
- incremento deve ser atômico;
- tentativa falha deve ser registrada conforme a chamada efetivamente enviada e a lógica de cobrança documentada;
- mostre consumo no painel de configurações;
- avise em 80% ou percentual configurável;
- bloqueie antes da franquia, com padrão inicial de 900 chamadas por SKU/mês;
- limites são configuráveis por ambiente;
- não permita que duas requisições simultâneas ultrapassem o limite;
- o erro deve explicar que a quota interna protege o orçamento;
- o painel deve mostrar mês, usado, limite e restante.

Além do bloqueio interno:

- documente quotas no Google Cloud;
- documente alerta de orçamento;
- explique que alerta sozinho não interrompe consumo;
- não prometa custo zero se as condições do provedor mudarem;
- não incorpore preço fixo no código.

## Falhas e retries

- timeout;
- retry limitado apenas para erros transitórios;
- backoff com jitter;
- não repetir requisição de forma ilimitada;
- abortar quando cliente cancela;
- tratar respostas inválidas;
- circuit breaker simples ou proteção equivalente quando houver falha em cascata;
- mensagens em português;
- nunca expor resposta interna completa do Google ao usuário.

## Testes

- Mock da API.
- Teste de field mask.
- Teste de paginação 20/40/60.
- Teste de contagem por página.
- Teste de limite 900.
- Teste de concorrência no limite.
- Teste de status operacional, temporário e permanente.
- Teste de falha sem afetar CRM.
- Teste de não persistência dos campos proibidos.
- Nenhum teste automatizado deve consumir a API real por padrão.

## Critérios de aceite

- Pesquisa passa pelo backend.
- Chave não existe no bundle.
- Primeira página não dispara automaticamente as demais.
- Fechado agora não é filtrado.
- Permanentemente fechado é oculto por padrão.
- Place ID é persistido e conteúdo completo não.
- Card carrega detalhes ao vivo.
- Quota bloqueia corretamente.
- Atribuição aparece.

---

# PASSO 10 — CLASSIFICAÇÃO DE LINKS, TELEFONE, INSTAGRAM E QUALIFICAÇÃO

## Objetivo

Transformar resultados brutos em uma lista mais útil sem prometer certezas que a API não fornece.

## Classificação de website

Crie função pura, testada e extensível que normalize a URL e classifique:

- OWN_WEBSITE;
- INSTAGRAM;
- FACEBOOK_OR_SOCIAL;
- WHATSAPP;
- LINK_IN_BIO;
- DIRECTORY_OR_PLATFORM;
- UNKNOWN;
- NONE.

Reconheça ao menos:

- instagram.com;
- facebook.com;
- wa.me;
- api.whatsapp.com;
- linktr.ee;
- beacons.ai;
- domínios de diretórios relevantes;
- domínio próprio provável.

Mantenha listas de domínios conhecidas em configuração de código testável, não espalhadas por componentes.

## Filtros de website

Implemente:

- Sem site próprio;
- Com site próprio;
- Sem nenhum link;
- Rede social como site;
- Todos.

Definições:

- “Sem site próprio” inclui NONE, Instagram, WhatsApp, rede social, Linktree, página de links e diretório.
- “Sem nenhum link” inclui apenas NONE.
- “Com site próprio” inclui domínio próprio provável.
- UNKNOWN aparece sinalizado para verificação manual.

Não diga “não possui site” como certeza absoluta. Use linguagem como:

- “Sem site próprio identificado no perfil”;
- “Provável site próprio”;
- “Link não classificado — verificar”.

## Telefone

Use libphonenumber para:

- normalizar;
- validar;
- formatar;
- identificar país;
- classificar tipo quando possível.

Padrão de pesquisa:

- esconder resultados sem telefone;
- oferecer opção secundária “Mostrar sem telefone”, desligada;
- permitir configuração posterior.

Botões:

- telefone celular identificado: “Abrir WhatsApp — não confirmado” e “Ligar”;
- telefone fixo identificado: “Ligar”;
- tipo incerto: ação conservadora e rótulo claro;
- ausente: nenhum botão de contato.

Nunca use o texto “WhatsApp confirmado” com base apenas no telefone do Google.

O link de WhatsApp deve:

- usar número normalizado;
- abrir nova aba;
- não enviar mensagem automaticamente;
- opcionalmente preencher texto apenas se o usuário acionar e configurar isso no futuro, fora desta versão.

## Instagram

O Google Places não possui campo oficial específico de Instagram. Implemente a seguinte ordem:

1. se websiteUri for Instagram, classifique e exiba;
2. se houver website próprio, ofereça ação manual “Localizar Instagram no site”;
3. essa ação pode analisar somente a página pública do próprio domínio, com timeout, limite de tamanho e proteção SSRF;
4. extraia links explícitos para instagram.com;
5. se nada for encontrado, mostre “Instagram não localizado”;
6. ofereça “Buscar Instagram” abrindo uma pesquisa predefinida para conferência manual;
7. permita colar e salvar Instagram manualmente;
8. qualquer Instagram salvo deve ficar marcado como dado confirmado pelo usuário ou importado.

Proteção na análise de site:

- negar localhost;
- negar IPs privados e metadata endpoints;
- validar DNS e redirects;
- limitar redirects;
- aceitar apenas HTTP/HTTPS;
- limitar tamanho de resposta;
- timeout curto;
- não executar JavaScript;
- não rastrear várias páginas;
- não armazenar conteúdo da página;
- sanitizar URL extraída.

Se essa análise não puder ser implementada com segurança, mantenha o botão de busca manual e documente a limitação. Não introduza SSRF para cumprir a função.

## Link do Google Maps

- Na pesquisa, use URI oficial retornada.
- No card, consulte ao vivo ou construa link estável a partir de place_id quando suportado.
- Não use o link como substituto da identificação interna do lead.

## Ordenação de leads promissores

Implemente uma pontuação transitória, determinística e explicável, sem IA externa.

Ela pode considerar:

- telefone disponível;
- ausência de site próprio;
- uso apenas de rede social, WhatsApp ou diretório;
- empresa operacional;
- volume de avaliações como indício de atividade;
- nota, com peso moderado;
- dados suficientes para contato.

Regras:

- pontuação não deve ser persistida como verdade permanente;
- mostre os motivos, por exemplo “Sem site próprio” e “Telefone disponível”;
- não classifique qualidade comercial apenas pela nota;
- usuário pode ordenar por relevância original, pontuação, nota e avaliações;
- não esconda resultados válidos somente por pontuação baixa.

## Avaliação manual

Deixe explícito que a validação final é humana. A plataforma antecipa organização e sinais, mas não garante:

- que a empresa realmente não possui site fora do Google;
- que o telefone está no WhatsApp;
- que o Instagram encontrado é oficial;
- que o negócio está interessado;
- que os dados estão sempre corretos.

## Critérios de aceite

- Instagram usado como website é identificado.
- Linktree não é considerado site próprio.
- Domínio próprio provável é diferenciado.
- Telefone inválido não gera link quebrado.
- WhatsApp aparece como não confirmado.
- Filtro “Sem site próprio” funciona conforme definição.
- SSRF é impedido ou a análise automática é omitida com fallback seguro.
- Score exibe razões e não altera persistência.

---

# PASSO 11 — DEDUPLICAÇÃO GLOBAL

## Objetivo

Impedir que o mesmo lead gere vários cards, independentemente da origem.

## Escopo da deduplicação

Compare contra:

- resultados da pesquisa atual;
- outras páginas da mesma pesquisa;
- CRM ativo;
- leads arquivados;
- todas as importações anteriores;
- leads manuais;
- leads originados do Google.

## Correspondências fortes

Considere duplicado automático:

1. mesmo place_id;
2. mesmo telefone ou WhatsApp normalizado;
3. mesmo domínio próprio normalizado;
4. mesmo nome normalizado + mesmo endereço normalizado.

Regras:

- ignore pontuação, acentos, caixa e variações triviais;
- telefone deve usar E.164 quando possível;
- domínio deve remover protocolo, www, barra final e parâmetros irrelevantes;
- nome + endereço deve ter normalização determinística;
- hash serve para índice, mas preserve dados necessários para auditoria sem expor informação desnecessária.

## Correspondência provável

Exemplos:

- nome muito parecido na mesma cidade;
- telefone incompleto semelhante;
- nome igual com endereço ausente;
- Instagram igual sem outro identificador.

Nesses casos:

- não crie segundo card automaticamente;
- não una automaticamente;
- coloque em “Possível duplicidade” para revisão;
- mostre por que houve suspeita;
- permita “É o mesmo lead” ou “São leads diferentes”;
- se forem diferentes, registre decisão para evitar alertas repetidos.

## Unidades e franquias

- Mesma marca em cidades ou endereços diferentes pode representar unidades válidas.
- Não deduplique apenas por nome.
- Duas unidades reais devem poder existir.
- Mesmo domínio corporativo compartilhado não deve fundir unidades sem outro sinal, se a regra de negócio identificar unidades distintas.
- Quando o usuário confirmar unidades diferentes que compartilham domínio ou telefone, registre a exceção de identidade; não enfraqueça globalmente a deduplicação.

## Resultado do Google já existente

Exiba:

- badge “Já está no CRM”;
- etapa atual;
- data de entrada quando útil;
- botão “Abrir card”;
- botão Adicionar desabilitado.

Não esconda necessariamente o resultado, pois o usuário pode querer consultar.

## Concorrência

Mesmo com duas requisições simultâneas:

- unique constraints devem impedir dois cards;
- a API deve capturar conflito e retornar o lead existente;
- não mostre erro técnico bruto;
- não deixe evento órfão.

## Alteração de identidade

Ao editar telefone, domínio, nome ou endereço próprio:

- recalcule identity keys em transação;
- se colidir, não sobrescreva;
- abra revisão de duplicidade;
- preserve o card original até decisão.

## Critérios de aceite

- Mesmo place_id nunca cria dois cards.
- Mesmo telefone importado duas vezes gera um card.
- Mesmo nome em duas cidades pode gerar dois.
- Concorrência não fura a regra.
- Lead arquivado também bloqueia duplicata automática.
- Resultado existente informa a etapa.
- Possível duplicidade nunca é mesclada sem decisão.

---

# PASSO 12 — IMPORTAÇÃO CSV/XLSX E CADASTRO MANUAL

## Objetivo

Receber leads de Google Sheets exportado, planilhas e outras fontes sem exigir integração OAuth.

## Escopo da primeira versão

Implemente upload de:

- .csv;
- .xlsx.

O usuário pode baixar uma planilha do Google Sheets nesses formatos e importar.

Não implemente nesta versão:

- conexão direta à conta Google;
- Google Sheets API;
- sincronização contínua;
- OAuth;
- leitura por URL privada.

## Assistente de importação

Crie fluxo por etapas:

1. Selecionar arquivo.
2. Ler e validar o formato.
3. Escolher aba, se XLSX tiver mais de uma.
4. Exibir prévia de linhas.
5. Detectar cabeçalho.
6. Mapear colunas.
7. Escolher origem geral ou mapear coluna de origem.
8. Associar serviço opcional a todas as linhas ou mapear serviço.
9. Normalizar dados.
10. Validar.
11. Pré-visualizar duplicidades e incompletos.
12. Confirmar.
13. Importar em transação por lotes seguros.
14. Mostrar relatório final.

## Campos mapeáveis

- Nome da empresa/lead;
- Telefone;
- WhatsApp;
- E-mail;
- Instagram;
- Website;
- Link da demonstração ou proposta;
- Google Maps;
- Endereço;
- Cidade;
- Estado;
- País;
- Nicho;
- Origem;
- Serviço;
- Valor proposto;
- Observações;
- Próximo follow-up.

Aceite variações comuns de cabeçalho:

- Empresa, Nome, Nome da empresa;
- Telefone, Fone, Celular;
- WhatsApp, Whatsapp, WPP;
- Instagram, Insta;
- Site, Website;
- Observação, Observações, Notas.

Detecção automática é sugestão; o usuário confirma o mapeamento.

## Segurança do arquivo

- limite configurável de tamanho;
- validar extensão e conteúdo;
- rejeitar arquivos corrompidos;
- não executar fórmulas, macros ou conteúdo ativo;
- tratar células como dados;
- proteger contra CSV formula injection em exportações;
- limitar quantidade de linhas para evitar exaustão;
- processar com memória controlada;
- apagar temporários;
- nunca aceitar caminho arbitrário do usuário.

## Validação

- Nome vazio: incompleto crítico.
- Telefone vazio: importar, mas marcar incompleto crítico.
- Telefone inválido: importar como dado a revisar, sem gerar link inseguro.
- URL inválida: sinalizar.
- Valor inválido: não converter silenciosamente.
- Data ambígua: pedir correção ou marcar erro.
- Linha totalmente vazia: ignorar.
- Campos desconhecidos: não descartar sem mostrar; podem ser ignorados conscientemente.

## Destino

Cada linha válida e não duplicada cria:

- um lead;
- um card em Selecionados;
- origem definida;
- contatos e links importados;
- serviço opcional;
- evento LEAD_CREATED;
- vínculo ao import_job.

## Duplicatas na importação

Regra absoluta:

- nunca criar segundo card automaticamente;
- ignorar a linha duplicada;
- não mudar o lead existente;
- informar “Lead já existente — [etapa]”;
- nunca substituir anotações;
- nunca substituir etapa;
- nunca substituir serviço;
- nunca substituir valores;
- nunca substituir histórico;
- nunca atualizar silenciosamente nem mesmo um campo vazio.

Depois do relatório, ofereça ação manual:

    Revisar dados encontrados

Nessa revisão:

- mostre dado existente e dado importado lado a lado;
- permita preencher somente campo atualmente vazio;
- exija escolha explícita por campo;
- não marque tudo por padrão;
- nunca sobrescreva campo preenchido;
- não mexa em anotações, valores, etapa ou histórico;
- registre a confirmação no audit log.

Explique “preencher campos vazios” na interface:

    Adicionar ao lead existente apenas uma informação que ainda não existe, após sua confirmação. Nenhum dado atual será substituído.

## Relatório final

Mostre:

- total de linhas;
- importados;
- duplicados ignorados;
- possíveis duplicados para revisar;
- incompletos;
- inválidos;
- linhas vazias ignoradas.

Permita baixar relatório de erros em CSV seguro.

## Cadastro manual

Crie botão “Novo lead” com:

- nome;
- origem;
- telefone/WhatsApp;
- Instagram;
- site;
- Maps;
- link da demonstração ou proposta;
- cidade/estado/país;
- nicho;
- serviço;
- valor;
- observações;
- próximo follow-up.

Aplicar a mesma deduplicação antes de salvar.

## Critérios de aceite

- CSV UTF-8 funciona.
- XLSX com várias abas permite escolha.
- Cabeçalhos são mapeados.
- Linha sem telefone vira card vermelho, não desaparece.
- Arquivo repetido não duplica leads.
- Dados existentes não são sobrescritos.
- Revisão manual preenche apenas vazio.
- Toda linha criada entra em Selecionados.
- Relatório soma corretamente.

---

# PASSO 13 — VENDAS, PAGAMENTOS E SERVIÇOS RECORRENTES

## Objetivo

Transformar etapas comerciais em registros financeiros confiáveis sem confundir expectativa com dinheiro recebido.

## Conceitos

### Proposta/negociação

Valor discutido, ainda não necessariamente aceito.

### Aguardando pagamento

Cliente aceitou ou existe valor a receber, mas dinheiro ainda não foi confirmado.

### Venda concluída

Recebimento confirmado manualmente ou venda registrada de acordo com o fluxo.

### Receita realizada

Somente dinheiro confirmado como recebido.

### Receita recorrente mensal

Valor contratado em assinaturas ativas; não significa que todos os meses já foram pagos.

## Registro de venda

Ao mover para Aguardando pagamento ou Venda concluída, abra formulário com:

- serviços vendidos;
- preço padrão;
- valor final negociado;
- quantidade;
- cobrança única ou recorrente;
- data do acordo;
- data de vencimento;
- primeira data de vencimento para recorrência;
- observações;
- status do pagamento.

O preço padrão é sugestão editável.

Ao confirmar:

- crie sale;
- crie sale_items com snapshots;
- associe ao lead;
- crie recebível quando ainda não pago;
- crie assinatura se recorrente;
- crie eventos;
- mova etapa na mesma transação;
- atualize métricas pela fonte de dados, não por incremento frágil no frontend.

## Aguardando pagamento

Ao entrar:

- deve existir pelo menos um valor definido;
- crie ou associe recebível PENDING;
- soma entra em “Aguardando pagamento”;
- não entra em receita realizada;
- mostre vencimento;
- após vencimento, status OVERDUE;
- valor vencido continua pendente.

## Venda concluída

Se veio de Aguardando pagamento:

- selecione recebível;
- confirme valor recebido;
- confirme data;
- permita pagamento integral nesta versão;
- marque recebível PAID;
- crie payment;
- retire valor de pendente;
- acrescente receita realizada na data do pagamento;
- mova card;
- tudo em transação.

Se o usuário mover diretamente:

- abra o mesmo formulário;
- crie venda e pagamento de forma consistente;
- não pule snapshots ou eventos.

## Serviços únicos

- Geram venda e um recebível.
- Se recebido na hora, recebível pode nascer PAID por transação com payment.
- Se pendente, aparece em contas a receber.

## Serviços recorrentes

Ao confirmar assinatura:

1. escolha primeira data de vencimento;
2. fixe amount_snapshot do contrato;
3. marque assinatura ACTIVE;
4. gere recebível do primeiro período;
5. calcule next_due_date;
6. não contabilize como recebido antes de confirmação.

Todo mês:

- gere um recebível PENDING;
- use referência de competência;
- não gere duplicado;
- se passar da data, marque OVERDUE;
- ao confirmar pagamento, marque PAID e registre receita;
- avance o próximo vencimento de forma determinística.

## Geração idempotente das recorrências

Como a hospedagem não deve depender de processo separado permanente:

- crie um job de domínio idempotente;
- execute a verificação ao iniciar sessão ou abrir dashboard/financeiro;
- ofereça comando CLI para cron diário da Hostinger;
- proteja eventual endpoint de cron com CRON_SECRET;
- use lock no banco ou estratégia transacional;
- restrição única subscription_id + reference_period;
- reexecutar o job nunca duplica recebíveis.

Documente configuração opcional do cron. O sistema deve se recuperar mesmo que o cron deixe de rodar: na próxima execução, gera competências faltantes na ordem correta.

## Alteração de assinatura

- Alterar preço do catálogo não altera contrato.
- Para alterar cliente específico, crie alteração explícita com data de vigência.
- Preserve valor antigo em períodos anteriores.
- Registre SUBSCRIPTION_CHANGED.
- Não reescreva recebíveis pagos.

## Cancelamento

Ao cancelar:

- pedir data e motivo;
- impedir cobranças futuras;
- manter pagamentos anteriores;
- manter histórico;
- se houver recebível aberto, perguntar:
  - manter como pendente; ou
  - cancelar esse recebível;
- registrar decisão;
- não apagar assinatura.

## Reversões

Pagamento recebido incorretamente:

- ação “Estornar pagamento”;
- exigir motivo;
- criar evento de reversão;
- ajustar status do recebível conforme decisão;
- retirar valor da receita líquida no período de reversão ou conforme regra contábil interna documentada;
- manter pagamento original visível.

Venda cancelada:

- não apagar;
- registrar cancelamento;
- tratar recebíveis associados;
- preservar snapshots.

## Tela Financeiro

Inclua:

- Resumo;
- A receber;
- Vencidos;
- Recebidos;
- Recorrências ativas;
- Recorrências canceladas;
- filtros por período, cliente, serviço e status;
- valores totais;
- próxima cobrança;
- ações de confirmar, cancelar e estornar.

Não apresente isso como contabilidade fiscal oficial. É controle comercial interno.

## Critérios de aceite

- Pendente não aparece como recebido.
- Confirmar pagamento transfere valor corretamente.
- Recorrência gera uma cobrança por competência.
- Rodar job duas vezes não duplica.
- Cancelar impede cobranças futuras.
- Pagamentos passados permanecem.
- Alterar catálogo não altera contrato.
- Estorno preserva trilha.
- Operações concorrentes não duplicam pagamento.

---

# PASSO 14 — DASHBOARD, FUNIL, METAS E ÁREA DE ATENÇÃO

## Objetivo

Permitir que o usuário entenda a prospecção, vendas e prioridades com um olhar rápido.

## Ordem de informação

### Topo: hoje e resultado

Mostre cards compactos:

- Contatos de hoje: realizado / meta;
- Respostas;
- Taxa de resposta;
- Vendas concluídas;
- Receita recebida;
- Aguardando pagamento.

Não exiba todos os números possíveis no topo.

### Precisa da sua atenção

Lista priorizada:

- follow-ups atrasados;
- follow-ups para hoje;
- pagamentos vencidos;
- negociações paradas;
- leads selecionados sem abordagem;
- cards com dados críticos incompletos;
- próximas recorrências;
- quota do Google perto do limite.

Cada item deve ter ação direta, por exemplo “Abrir card”.

### Funil atual

Mostre quantos cards estão em:

- Selecionados;
- Contato realizado;
- Follow-up;
- Respondeu;
- Em negociação;
- Aguardando pagamento;
- Venda concluída;
- Recusado/Perdido.

“Selecionados” pode aparecer de maneira menos destacada como fila aguardando ação.

### Desempenho

Inclua visualizações úteis:

- primeiros contatos por dia;
- respostas por dia;
- vendas por período;
- receita recebida;
- valor pendente;
- taxa de resposta;
- taxa de recusa;
- taxa de conversão;
- ticket médio;
- vendas por serviço;
- vendas por origem;
- vendas por nicho;
- vendas por cidade;
- motivos de perda;
- receita recorrente mensal ativa.

Use gráfico apenas quando facilitar comparação ou tendência. Use tabelas ou listas quando forem mais claras.

## Metas

Permita criar metas de:

- primeiros contatos;
- quantidade de vendas;
- receita realizada.

Períodos:

- diária;
- semanal;
- mensal.

Mostre:

- valor atual;
- alvo;
- percentual;
- barra de progresso;
- falta para atingir;
- estado alcançado.

Exemplo de apresentação:

    Contatos de hoje: 18 de 30

Quando a meta for atingida:

- feedback positivo discreto;
- verde;
- texto claro;
- sem animações excessivas.

## Filtros

Filtro global do dashboard:

- período;
- origem;
- serviço;
- nicho;
- cidade.

Filtros devem atualizar todos os widgets compatíveis e indicar quando uma métrica ignora determinado filtro.

## Fórmulas e tooltips

Cada taxa deve ter tooltip:

- Taxa de resposta = leads únicos que responderam ÷ primeiros contatos.
- Taxa de recusa = leads únicos recusados/perdidos ÷ primeiros contatos.
- Taxa de conversão = leads únicos com venda confirmada ÷ primeiros contatos.
- Ticket médio = valor das vendas confirmadas ÷ quantidade de vendas.
- Receita realizada = pagamentos confirmados menos reversões.
- MRR = soma mensal de contratos recorrentes ativos, não pagamentos já recebidos.

## Precisão

- Use consultas do backend.
- Não some cards no navegador para finanças.
- Respeite timezone.
- Não conte eventos cancelados.
- Não conte venda pendente como receita.
- Não conte follow-up como primeiro contato.
- Não conte mesmo lead duas vezes na taxa principal.
- Diferencie fluxo atual de eventos do período.

## Performance

- Consultas agregadas indexadas.
- Carregamento paralelo controlado.
- Cache curto apenas de métricas próprias quando seguro.
- Invalidação após mutação.
- Skeletons.
- Não buscar detalhes Google para montar dashboard.

## Critérios de aceite

- Fixtures conhecidas produzem números esperados.
- Pendente e recebido são diferentes.
- Meta diária respeita São Paulo.
- Follow-up não infla contatos.
- Reversão ajusta receita.
- Dashboard funciona sem Google.
- Área de atenção leva ao card correto.
- Filtros são coerentes.

---

# PASSO 15 — EXPORTAÇÃO, BACKUP E RECUPERAÇÃO

## Objetivo

Reduzir risco de perda e evitar aprisionamento dos dados próprios.

## Exportação interna

Crie exportação autenticada de dados próprios:

- leads;
- contatos confirmados/importados;
- links confirmados/importados;
- etapas;
- atividades;
- follow-ups;
- serviços;
- vendas;
- recebíveis;
- pagamentos;
- assinaturas;
- metas;
- histórico.

Formatos:

- CSV para listas úteis;
- JSON estruturado para backup lógico.

Não inclua:

- senha;
- password_hash;
- tokens de sessão;
- SESSION_SECRET;
- GOOGLE_MAPS_API_KEY;
- credenciais MySQL;
- conteúdo transitório do Google.

Proteja CSV contra formula injection.

## Backup

Documente:

- backup diário da Hostinger;
- exportação lógica periódica;
- restauração do MySQL;
- verificação de backup;
- necessidade de testar restauração;
- como preservar .env separadamente de forma segura;
- como fazer rollback de aplicação e migração.

Não faça migração destrutiva sem backup.

## Importação de backup

Não é obrigatório criar um restaurador completo pela interface na primeira versão. Documente restauração administrativa segura.

## Critérios de aceite

- Exportação não contém segredos.
- Dados próprios podem ser lidos fora do sistema.
- CSV não executa fórmula maliciosa.
- Procedimento de restauração está documentado.

---

# PASSO 16 — SEGURANÇA, PRIVACIDADE, CONFORMIDADE E RESILIÊNCIA

## Objetivo

Fazer uma revisão transversal antes de considerar a aplicação pronta.

## Segurança de aplicação

Revise:

- autenticação;
- sessão;
- CSRF;
- XSS;
- SQL injection;
- SSRF;
- upload;
- rate limit;
- brute force;
- cookies;
- proxy;
- headers;
- segredos;
- logs;
- erros;
- dependências;
- controle de acesso;
- rotas administrativas;
- cron;
- exportação.

## Segredos

- Nunca no frontend.
- Nunca no Git.
- Nunca em print.
- Nunca em mensagem de erro.
- Nunca em documentação preenchida.
- .env.example contém apenas nomes e exemplos inofensivos.
- Documente rotação da chave Google e SESSION_SECRET.

## Google

- Dados ao vivo com atribuição.
- Place ID persistente.
- Sem snapshot persistente de conteúdo.
- Sem scraping.
- Sem chamadas ocultas desnecessárias.
- Quota interna.
- Política de privacidade.
- Termos de uso.
- Revisão das políticas vigentes antes da produção.

## Privacidade

A aplicação é privada, mas ainda deve:

- coletar apenas o necessário;
- proteger contatos e notas;
- não expor dados por rota pública;
- ocultar detalhes sensíveis em logs;
- expirar sessão;
- oferecer arquivamento e exportação;
- documentar finalidade dos dados.

## Resiliência

Teste:

- reinício do processo;
- banco indisponível;
- Google indisponível;
- quota esgotada;
- upload inválido;
- clique duplicado;
- duas abas abertas;
- timeout;
- sessão expirada;
- migração parcialmente falha;
- job recorrente repetido.

O CRM interno deve continuar acessível quando Google estiver indisponível.

## Observabilidade

Implemente logs estruturados com:

- nível;
- timestamp;
- request id;
- rota;
- status;
- duração;
- erro sanitizado.

Não registrar:

- senha;
- cookies;
- tokens;
- chave Google;
- credenciais de banco;
- conteúdo integral de leads sem necessidade.

Crie:

- health check;
- readiness check;
- registro claro de erro de job;
- contagem de uso Google;
- página ou seção administrativa simples de status, sem detalhes secretos.

## Critérios de aceite

- Revisão de segurança documentada.
- Scanner de segredos não encontra credenciais.
- Frontend não contém GOOGLE_MAPS_API_KEY.
- SSRF possui testes.
- Rotas privadas exigem sessão.
- Falha Google não derruba app.
- Logs não vazam dados.

---

# PASSO 17 — TESTES AUTOMATIZADOS E VALIDAÇÃO DE JORNADAS

## Objetivo

Comprovar regras críticas e evitar que uma interface aparentemente funcional esconda erros.

## Testes unitários mínimos

### Normalização e deduplicação

- telefone brasileiro;
- telefone internacional;
- domínio;
- nome;
- endereço;
- place_id;
- mesmo lead;
- unidades diferentes;
- possível duplicidade.

### Classificação de links

- Instagram;
- WhatsApp;
- Facebook;
- Linktree;
- diretório;
- domínio próprio;
- URL desconhecida;
- URL inválida.

### Eventos e métricas

- primeiro contato único;
- resposta única;
- várias tentativas;
- taxa de resposta;
- taxa de recusa;
- conversão;
- ticket médio;
- receita com reversão;
- denominador zero;
- timezone.

### Recorrências

- primeiro vencimento;
- virada de mês;
- mês curto;
- ano bissexto;
- vários meses atrasados;
- reexecução idempotente;
- cancelamento;
- alteração de valor.

### Importação

- cabeçalhos;
- CSV;
- XLSX;
- campo ausente;
- telefone inválido;
- linha duplicada;
- preenchimento manual de vazio;
- não sobrescrever.

## Testes de integração

- migração do zero;
- seed repetido;
- login;
- sessão;
- logout;
- rate limit;
- criação manual;
- unique constraints;
- movimentação transacional;
- undo;
- perda com motivo;
- venda pendente;
- pagamento;
- estorno;
- assinatura;
- job recorrente;
- importação em lote;
- quota Google;
- concorrência.

## Testes E2E

Cubra no mínimo:

1. Entrar com administrador.
2. Criar serviço.
3. Criar lead manual.
4. Ver card em Selecionados.
5. Mover para Contato realizado.
6. Registrar tentativa e follow-up.
7. Mover para Respondeu.
8. Negociar serviço.
9. Mover para Aguardando pagamento.
10. Confirmar venda.
11. Ver dashboard atualizado.
12. Criar serviço recorrente.
13. Gerar recebível.
14. Confirmar mensalidade.
15. Cancelar recorrência.
16. Importar CSV com duplicado e sem telefone.
17. Ver card incompleto em vermelho.
18. Revisar possível dado vazio.
19. Pesquisar Google com API mockada.
20. Adicionar resultado.
21. Ver “Já está no CRM” na repetição.
22. Usar fluxo móvel “Mover para…”.

## Google nos testes

- Use mocks/fixtures.
- Não use a chave real.
- Não realize chamadas pagas.
- Garanta que fixtures de Google não são inseridas no banco como snapshots quando a origem for GOOGLE_PLACE.

## Visual e acessibilidade

Valide:

- desktop;
- tablet;
- celular;
- teclado;
- foco;
- contraste;
- modal;
- drawer;
- drag acessível;
- seletor móvel;
- estados vazios;
- carregamento;
- erros.

## Portões de qualidade

Antes do deploy, todos devem passar:

    npm run lint
    npm run typecheck
    npm run test
    npm run test:integration
    npm run build

Execute E2E no ambiente apropriado.

Não marque teste como skip para esconder falha crítica. Se algo não puder ser testado, explique e forneça procedimento manual reproduzível.

## Critérios de aceite

- Regras centrais têm cobertura.
- Testes falham se uma duplicação for introduzida.
- Testes falham se pendente virar receita.
- Testes falham se follow-up virar contato novo.
- Build limpo.
- Nenhuma chamada real Google em CI.

---

# PASSO 18 — PREPARAÇÃO E DEPLOY NA HOSTINGER

## Objetivo

Colocar o sistema online de forma segura, sem depender do computador local.

## Ponto de parada obrigatório

Somente neste passo, solicite ao usuário os dados que ainda faltarem:

- confirmação de vaga de aplicação Node no hPanel;
- nome ou subdomínio;
- credenciais do MySQL criado na Hostinger;
- chave restrita do Google Places;
- senha inicial escolhida pelo usuário;
- URL final;
- método de deploy: GitHub privado ou ZIP.

Não peça que o usuário cole senha ou segredo em arquivo versionado. Oriente a inserir no painel de variáveis de ambiente ou terminal seguro.

## Preparação

1. Confirmar Node.js 22.
2. Confirmar comando de build.
3. Confirmar comando de start.
4. Configurar 0.0.0.0 e PORT.
5. Criar banco MySQL.
6. Configurar variáveis.
7. Executar migrações.
8. Executar seed.
9. Criar administrador.
10. Remover segredo temporário de bootstrap.
11. Configurar domínio/subdomínio.
12. Ativar HTTPS.
13. Configurar proxy/cookies.
14. Testar health.
15. Testar login.
16. Configurar quota Google.
17. Configurar cron idempotente, se disponível.
18. Configurar backup.

## Build e start

O projeto deve oferecer comandos não interativos e documentados. Exemplo conceitual:

    npm ci
    npm run build
    npm run db:migrate
    npm run db:seed
    npm run start

Ajuste ao gerenciador escolhido e ao painel real, mas preserve simplicidade.

## Migrações

- Faça backup antes de migração destrutiva.
- Migrações devem ser versionadas.
- Não use sincronização automática destrutiva de schema em produção.
- Se uma migração falhar, pare.
- Documente rollback possível.

## Admin

- ADMIN_EMAIL = stavodigital123@gmail.com.
- ADMIN_INITIAL_PASSWORD deve existir somente durante bootstrap.
- Depois de criar usuário, remova a variável ou deixe o bootstrap comprovadamente inerte.
- Faça primeiro login.
- Altere senha se o processo exigir.

## Google Cloud

Oriente o usuário a:

- criar projeto;
- ativar Places API (New);
- associar conta de cobrança individual se necessário;
- cadastrar cartão;
- restringir a chave;
- definir quotas;
- criar alerta;
- manter limites internos de 900 por SKU como proteção inicial.

Não trate “billing” como faturamento da empresa. É a conta de cobrança do uso da API.
O usuário pode configurar a conta como pessoa física/individual, usando CPF quando solicitado. A aplicação não exige empresa, CNPJ ou faturamento comercial prévio.

## Verificação pós-deploy

Teste em produção:

- HTTPS;
- login;
- cookie secure;
- logout;
- banco persistente;
- criar e mover lead;
- dashboard;
- importação pequena;
- pesquisa Google de uma página;
- contador de uso;
- detalhe de card Google;
- serviço;
- venda pendente;
- pagamento;
- recorrência;
- exportação;
- celular;
- health;
- logs sem segredo.

## Rollback

Antes de concluir, documente:

- como voltar código;
- como restaurar banco;
- como reverter migração quando possível;
- como rotacionar chave;
- como revogar sessões;
- como colocar página de manutenção.

## Critérios de aceite

- Acesso por URL pública com login.
- Sem depender do computador local.
- HTTPS ativo.
- Sessão segura.
- Banco persiste.
- Segredos só no servidor.
- Reinício não perde dados.
- Backup configurado.
- Procedimento de rollback disponível.

---

# PASSO 19 — DOCUMENTAÇÃO E ENTREGA FINAL

## Objetivo

Entregar um sistema que possa ser operado e mantido sem depender da memória do desenvolvedor.

## Documentos obrigatórios

Crie ou atualize:

### README

- visão do produto;
- stack;
- requisitos;
- instalação local;
- variáveis;
- banco;
- comandos;
- testes;
- build;
- execução.

### docs/architecture

- componentes;
- fronteiras;
- fluxo frontend/backend/banco/Google;
- decisões e motivos;
- ausência de Supabase/Redis/Docker.

### docs/data-model

- entidades;
- relacionamentos;
- índices;
- invariantes;
- snapshots financeiros;
- identidade de leads.

### docs/business-rules

- etapas;
- eventos;
- métricas;
- deduplicação;
- vendas;
- recorrências;
- cancelamentos.

### docs/google-places

- configuração;
- field masks;
- quota;
- contadores;
- política de persistência;
- atribuição;
- limitações;
- tratamento de Instagram e WhatsApp.

### docs/deploy-hostinger

- Node 22;
- porta/host;
- MySQL;
- variáveis;
- build/start;
- migrations;
- admin bootstrap;
- domínio;
- SSL;
- cron;
- backups;
- troubleshooting.

### docs/admin-password-reset

- procedimento emergencial;
- revogação de sessões;
- proibição de editar hash manualmente.

### docs/backup-restore

- exportação;
- dump MySQL;
- backup Hostinger;
- restauração;
- teste.

### docs/testing

- comandos;
- fixtures;
- jornadas;
- o que é mockado;
- checklist manual de produção.

### docs/security

- ameaças;
- controles;
- segredos;
- sessão;
- CSRF;
- SSRF;
- upload;
- logs.

## Entrega do Claude Code

Ao final, apresente:

- resumo do que foi construído;
- estrutura do projeto;
- decisões importantes;
- comandos executados;
- resultados de lint/typecheck/test/build;
- cobertura das jornadas;
- variáveis ainda necessárias;
- passos exatos de deploy;
- limitações honestas;
- itens explicitamente fora do escopo;
- checklist de produção.

Não diga apenas “pronto”. Forneça evidências verificáveis.

---

# 4. ESPECIFICAÇÃO DETALHADA DAS TELAS

Esta seção complementa os passos. Todas as telas devem respeitar o design system.

## 4.1 Login

- Campo e-mail.
- Campo senha.
- Mostrar/ocultar senha.
- Entrar.
- Erro genérico.
- Sem cadastro.
- Sem esqueci senha.
- Logo/nome discreto.

## 4.2 Dashboard

- Saudação discreta.
- Filtro de período.
- Metas.
- Cards principais.
- “Precisa da sua atenção”.
- Funil.
- Tendências.
- Breakdown por origem, serviço, nicho e cidade.
- Tooltips de fórmula.
- Links para cards.

## 4.3 Buscar empresas

Formulário:

- nicho/profissão;
- país;
- estado;
- cidade;
- bairro/região;
- filtro de site;
- telefone obrigatório ligado por padrão;
- serviço opcional;
- botão Pesquisar;
- indicação de consumo.

Resultado:

- nome;
- categoria;
- endereço;
- telefone;
- nota e avaliações;
- status;
- tipo de link;
- score explicável;
- WhatsApp não confirmado;
- ligar;
- Instagram;
- Maps;
- Adicionar ao CRM;
- badge existente;
- atribuição Google;
- carregar mais.

## 4.4 CRM

- Kanban.
- Filtros.
- Busca.
- Colunas configuráveis.
- Cards compactos.
- Drag desktop.
- Mover mobile.
- Drawer.
- Ações de contato.
- Notas.
- Follow-up.
- Histórico.
- Serviços.
- Financeiro.

## 4.5 Importar leads

- Upload.
- Wizard.
- Prévia.
- Mapeamento.
- Origem.
- Serviço.
- Validação.
- Duplicidades.
- Confirmação.
- Relatório.
- Revisão manual.

## 4.6 Serviços

- Lista.
- Criar/editar.
- Único/recorrente.
- Valor.
- Ativo/inativo.
- Histórico protegido.

## 4.7 Financeiro

- Resumo.
- Pendente.
- Vencido.
- Recebido.
- Assinaturas.
- Próximos vencimentos.
- Confirmar.
- Cancelar.
- Estornar.
- Filtros.

## 4.8 Metas

- Criar meta.
- Métrica.
- Período.
- Valor.
- Ativa/inativa.
- Progresso.
- Histórico simples quando útil.

## 4.9 Configurações

- Etapas.
- Origens.
- Preferências.
- Uso Google.
- Exportação.
- Segurança.
- Alterar senha.
- Informações do sistema.

---

# 5. CONTRATOS E COMPORTAMENTOS DE API

Use API same-origin sob /api. Os nomes exatos podem variar, mas mantenha agrupamento coerente.

## Convenções

- JSON.
- status HTTP correto.
- envelope de erro consistente.
- request id.
- Zod no boundary.
- paginação.
- filtros validados.
- datas ISO.
- dinheiro como string decimal na API quando necessário para precisão.
- mensagens de interface em português; códigos de erro estáveis.
- não retornar colunas internas sensíveis.

## Grupos

- /api/auth;
- /api/me;
- /api/leads;
- /api/leads/:id/events;
- /api/leads/:id/activities;
- /api/leads/:id/follow-ups;
- /api/stages;
- /api/services;
- /api/sources;
- /api/imports;
- /api/google/search;
- /api/google/places/:placeId;
- /api/google/usage;
- /api/sales;
- /api/receivables;
- /api/subscriptions;
- /api/goals;
- /api/dashboard;
- /api/settings;
- /api/exports;
- /api/health.

## Mutação de etapa

Recebe:

- lead_id;
- destination_stage_id;
- expected_current_stage_id;
- idempotency_key;
- dados adicionais exigidos pelo destino.

Se expected_current_stage_id não coincidir:

- retorne conflito;
- forneça estado atual;
- frontend atualiza;
- não sobrescreva silenciosamente.

## Erros

Formato conceitual:

- code;
- message;
- field_errors;
- request_id;
- retryable.

Nunca retorne stack em produção.

## Concorrência

Use:

- transações;
- locks quando necessário;
- versão/updated_at para optimistic concurrency;
- unique constraints;
- idempotência.

Proteja especialmente:

- movimento;
- dedup;
- pagamento;
- mensalidade;
- importação;
- quota.

---

# 6. REGRAS DE UX POR AÇÃO CRÍTICA

## Adicionar resultado Google

- Verifica duplicata antes.
- Se já existe, abre card.
- Se novo, solicita nome interno e serviço opcional.
- Cria em Selecionados.
- Feedback claro.

## Registrar primeiro contato

- Movimento para Contato realizado.
- Registra data/hora.
- Pode abrir ação de WhatsApp/ligação separadamente.
- Não presume que clicar no botão de contato concluiu contato.

## Registrar tentativa

- Botão explícito.
- Tipo e nota opcional.
- Pode agendar próximo follow-up.
- Não vira contato novo.

## Registrar resposta

- Movimento para Respondeu.
- Primeira resposta única.
- Atividade posterior separada.

## Aguardando pagamento

- Modal obrigatório.
- Serviço e valor.
- Vencimento.
- Confirma pendência.

## Venda concluída

- Modal obrigatório.
- Seleciona recebível.
- Confirma valor/data.
- Exibe consequência.
- Atualiza receita.

## Perda

- Motivo obrigatório.
- Nota opcional.
- Recontato opcional.

## Exclusão

- Leads: arquivar.
- Serviços: desativar.
- Etapas: remapear.
- Financeiro: cancelar/estornar.
- Dados auxiliares sem histórico: confirmação vermelha.

---

# 7. CENÁRIOS DE ACEITAÇÃO DE PONTA A PONTA

Implemente e valide os cenários abaixo.

## Cenário A — Pesquisa e novo lead

1. Usuário entra.
2. Pesquisa “psicólogos” em uma cidade.
3. Recebe até 20 resultados.
4. Empresas sem telefone ficam ocultas por padrão.
5. Empresa operacional fora do horário continua aparecendo.
6. Link Instagram é classificado como rede social, não site próprio.
7. Usuário clica WhatsApp; nada é adicionado.
8. Usuário clica Adicionar ao CRM.
9. Define nome interno.
10. Escolhe serviço.
11. Lead entra em Selecionados.
12. Nova pesquisa mostra “Já está no CRM”.

Resultado esperado:

- uma chamada de página contabilizada;
- place_id persistido;
- sem snapshot completo Google;
- um card;
- um evento de criação.

## Cenário B — Primeiro contato e follow-ups

1. Lead em Selecionados.
2. Move para Contato realizado.
3. Registra primeira abordagem.
4. Move para Follow-up.
5. Registra três tentativas em dias diferentes.
6. Move de volta e depois novamente para Contato realizado.

Resultado:

- um primeiro contato;
- três tentativas adicionais;
- histórico completo;
- nenhuma inflação da meta de contatos novos.

## Cenário C — Resposta e venda única

1. Lead vai para Respondeu.
2. Vai para negociação.
3. Serviço de pagamento único é selecionado.
4. Valor final é alterado.
5. Vai para Aguardando pagamento.
6. Dashboard exibe valor pendente.
7. Pagamento é confirmado.
8. Lead vai para Venda concluída.

Resultado:

- uma resposta única;
- snapshots preservados;
- pendência zerada para aquele recebível;
- receita realizada na data correta;
- dashboard atualizado.

## Cenário D — Recorrência

1. Serviço recorrente é vendido.
2. Primeira data é selecionada.
3. Primeiro recebível nasce pendente.
4. Pagamento é confirmado.
5. Próximo mês é gerado.
6. Job roda duas vezes.
7. Cliente cancela.
8. Usuário escolhe o destino da pendência aberta.

Resultado:

- uma cobrança por competência;
- nenhum duplicado;
- receita somente após pagamento;
- cobranças futuras param;
- histórico anterior permanece.

## Cenário E — Importação

1. CSV contém cinco linhas.
2. Uma é duplicata.
3. Uma não tem telefone.
4. Uma tem telefone inválido.
5. Uma é possível duplicidade.

Resultado:

- duplicata não cria card;
- lead sem telefone cria card vermelho;
- inválido é sinalizado;
- possível duplicidade aguarda revisão;
- relatório fecha em cinco linhas;
- nenhum dado existente é alterado.

## Cenário F — Indisponibilidade Google

1. Usuário abre CRM.
2. API Google está indisponível.
3. Abre card Google.

Resultado:

- card e histórico interno abrem;
- detalhes ao vivo mostram erro recuperável;
- vendas, notas e follow-ups continuam funcionando;
- aplicação não cai.

## Cenário G — Quota

1. TEXT_SEARCH chega a 899 de 900.
2. Uma página é solicitada.
3. Contador chega a 900.
4. Nova página é solicitada.

Resultado:

- chamada acima de 900 é bloqueada antes de ir ao Google;
- mensagem explica proteção de orçamento;
- Place Details usa contador próprio;
- CRM segue funcionando.

## Cenário H — Duplicidade concorrente

1. Duas abas tentam adicionar o mesmo place_id.

Resultado:

- um lead;
- uma identidade;
- uma resposta informa lead existente;
- sem erro de banco exposto.

## Cenário I — Correção financeira

1. Pagamento é confirmado por engano.
2. Usuário estorna com motivo.

Resultado:

- pagamento original permanece;
- reversão aparece;
- receita líquida é ajustada;
- audit log registra ação;
- nada é apagado.

---

# 8. REQUISITOS NÃO FUNCIONAIS

## Desempenho

- Primeira tela útil rapidamente.
- Lazy load de áreas pesadas.
- Não buscar detalhes Google em massa.
- Paginação.
- Queries indexadas.
- Evitar N+1.
- Otimização de bundle.
- Imagens e ícones leves.
- Debounce em buscas locais.

## Confiabilidade

- Transações.
- Idempotência.
- Retentativas limitadas.
- Tratamento de conflito.
- Graceful shutdown.
- Migrações.
- Backup.
- Logs.

## Manutenibilidade

- Código tipado.
- Domínio testável.
- Baixo acoplamento.
- Componentes reutilizáveis.
- Sem regras críticas espalhadas no frontend.
- Documentação.
- Nomes claros.
- Sem abstração especulativa multi-tenant.

## Segurança

- OWASP relevante.
- Sessão segura.
- Segredos.
- Sanitização.
- Proteção de upload.
- SSRF.
- CSRF.
- Rate limits.

## Acessibilidade

- Meta prática WCAG AA para fluxos principais.
- Teclado.
- Contraste.
- Leitor de tela.
- Sem cor isolada.

## Compatibilidade

- Navegadores modernos.
- Desktop e celular.
- Node 22.
- MySQL Hostinger.

---

# 9. CHECKLIST DE EXCLUSÕES ANTES DE FINALIZAR

Confirme por busca no código e por comportamento:

- não existe cadastro público;
- não existe forgot password;
- não existe SMTP;
- não existe Google OAuth;
- não existe Supabase;
- não existe Redis;
- não existe PostgreSQL;
- não existe Docker obrigatório;
- não existe scraping Maps;
- não existe openNow;
- não existem “Site em criação” e “Site pronto”;
- não existe coluna separada “Aguardando resposta”;
- não existe segundo card automático;
- não existe overwrite silencioso em importação;
- não existe receita pendente classificada como recebida;
- não existe follow-up classificado como primeiro contato;
- não existe segredo no bundle;
- não existe snapshot completo persistido do Google;
- não existe hard delete de histórico financeiro;
- não existe botão crítico sem confirmação;
- não existe função crítica apenas por drag;
- não existem mocks ativos em produção;
- não existem TODOs críticos.

---

# 10. ORDEM FINAL DE EXECUÇÃO

Siga exatamente esta ordem de dependência:

1. Inspeção, riscos e decisões.
2. Fundação técnica.
3. Banco, migrações, seeds e invariantes.
4. Autenticação e segurança.
5. Design system e layout.
6. Configurações, origens, serviços e etapas.
7. CRM Kanban.
8. Eventos, histórico e métricas.
9. Google Places.
10. Classificação e qualificação.
11. Deduplicação global.
12. Importação e cadastro manual.
13. Vendas, recebíveis e recorrências.
14. Dashboard e metas.
15. Exportação e backup.
16. Segurança, conformidade e resiliência.
17. Testes e jornadas.
18. Deploy Hostinger.
19. Documentação e entrega.

Algumas estruturas técnicas serão criadas antes de sua tela correspondente, mas não pule a validação de uma etapa. Não deixe integração, segurança e testes para uma correção improvisada no fim.

---

# 11. COMO VOCÊ DEVE SE COMUNICAR DURANTE O DESENVOLVIMENTO

Em cada passo, responda com:

1. Objetivo do passo.
2. O que encontrou no repositório.
3. O que vai alterar.
4. Implementação.
5. Validações executadas.
6. Resultado.
7. Próximo passo.

Se precisar de informação:

- diga exatamente por que ela é necessária agora;
- peça somente o dado faltante;
- explique onde o usuário deve inseri-lo com segurança;
- não peça segredos em mensagem se houver meio seguro no ambiente;
- não volte a perguntar requisitos já definidos.

Se houver erro:

- investigue a causa;
- corrija;
- rode novamente;
- não esconda falha;
- não desabilite proteção para “fazer funcionar”.

Se uma funcionalidade depender de credencial ainda não fornecida:

- implemente a integração completa;
- use adapter e mocks em testes;
- deixe tela de configuração/erro adequada;
- pare apenas no teste real ou deploy que exige a credencial.

---

# 12. RESUMO EXECUTIVO INEGOCIÁVEL

Esta aplicação é uma ferramenta privada da Stavo Digital para localizar e organizar leads, controlar prospecção e acompanhar vendas.

Ela deve:

- ficar online na Hostinger;
- usar React, Express, Node 22 e MySQL;
- exigir login do administrador stavodigital123@gmail.com;
- usar senha segura sem recuperação por e-mail na primeira versão;
- pesquisar negócios pela API oficial Google Places;
- limitar uso e proteger orçamento;
- não fazer scraping;
- não persistir cópia completa dos dados Google;
- permitir consultar dados atuais por place_id;
- distinguir site próprio, rede social, WhatsApp, página de links e diretório;
- sinalizar que WhatsApp não é confirmado;
- trabalhar com leads Google, importados e manuais;
- importar CSV e XLSX;
- nunca duplicar lead;
- nunca sobrescrever dados existentes silenciosamente;
- organizar cards em um Kanban configurável;
- separar primeiro contato de follow-up;
- manter histórico imutável;
- registrar serviços únicos e recorrentes;
- separar valor pendente de receita recebida;
- gerar recorrências idempotentes;
- atualizar dashboard e metas automaticamente;
- ser clara, moderna, azul/cinza/vermelha conforme ação;
- funcionar no celular;
- preservar dados;
- ser testada e pronta para produção.

Construa com profundidade de produção. Não simplifique requisitos silenciosamente. Não entregue somente uma prova de conceito. Só considere pronto depois de cumprir os critérios deste documento e demonstrar, com testes e evidências, que os fluxos funcionam.

# FIM DO PROMPT PARA O CLAUDE CODE
