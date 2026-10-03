# Integração com o Google Places

Uso **exclusivo** da Google Places API (New), por chamadas feitas no servidor.

> **Antes de publicar:** revise a versão vigente dos Termos de Serviço do Google
> Maps Platform e da Política de Privacidade do Google. Este documento descreve o
> que a aplicação faz; ele não substitui a leitura das políticas oficiais.

---

## 1. O que NÃO é feito

- Scraping do site público do Google Maps
- Puppeteer, Playwright ou qualquer navegador automatizado para extrair resultados
- APIs não oficiais, extensões de navegador ou proxies para contornar limites
- Bypass de CAPTCHA, quota ou bloqueio
- Cópia permanente do conteúdo retornado pela API

Playwright existe no projeto **apenas** para testar a própria aplicação.

---

## 2. Chave de API

- Vive **somente** em `GOOGLE_MAPS_API_KEY`, no ambiente do servidor.
- Viaja apenas no cabeçalho `X-Goog-Api-Key` — nunca na URL, nunca em log.
- **Nunca** entra no bundle do frontend (há teste automatizado verificando isso).
- Se ausente, o restante do sistema funciona normalmente e a tela de pesquisa
  explica como configurar.

### Restrições recomendadas no Google Cloud

1. Restrinja a chave à **Places API (New)** e a nenhuma outra.
2. Restrinja por **endereço IP do servidor** (não use restrição por referenciador
   HTTP — as chamadas partem do backend).
3. Defina **quotas diárias** por SKU.
4. Crie um **alerta de orçamento**.

> Um alerta de orçamento apenas **avisa**; ele não interrompe o consumo.
> Quem bloqueia antes da chamada é o limite interno desta aplicação.

### Rotação

1. Crie a nova chave no Google Cloud com as mesmas restrições.
2. Atualize `GOOGLE_MAPS_API_KEY` no painel de variáveis da hospedagem.
3. Reinicie a aplicação.
4. Confirme uma pesquisa de uma página.
5. Exclua a chave antiga no Google Cloud.

---

## 3. Field masks

O custo do Google é **por campo solicitado**. A aplicação pede o mínimo.

**Pesquisa** (`POST /v1/places:searchText`):

```
places.id, places.displayName, places.formattedAddress,
places.nationalPhoneNumber, places.internationalPhoneNumber,
places.websiteUri, places.rating, places.userRatingCount,
places.primaryTypeDisplayName, places.businessStatus,
places.googleMapsUri, nextPageToken
```

**Detalhe** (`GET /v1/places/{placeId}`): os mesmos campos, sem o prefixo `places.`.

Nunca são solicitados `reviews`, `photos`, `currentOpeningHours` nem `*`.

---

## 4. Paginação e consumo

- Uma página traz **até 20 resultados**.
- Uma consulta usa **no máximo 3 páginas** (até 60 resultados).
- **Cada página realmente solicitada consome uma requisição.**
- A primeira pesquisa carrega uma página. As demais só saem quando o usuário
  clica em **"Carregar mais"** — nada é pré-carregado.
- A interface informa o consumo antes e depois.
- A aplicação **nunca** afirma que 60 resultados representam todas as empresas da cidade.

---

## 5. Controle de quota (interno)

Contadores separados por SKU em `google_api_usage`, por mês de competência
(fuso de São Paulo).

| SKU | Padrão | Configurável em |
| --- | --- | --- |
| `TEXT_SEARCH` | 900/mês | Configurações → Uso do Google |
| `PLACE_DETAILS` | 900/mês | Configurações → Uso do Google |

### Como o bloqueio funciona

A reserva é um `UPDATE` **condicional e atômico**:

```sql
UPDATE google_api_usage
   SET request_count = request_count + 1
 WHERE billing_month = ? AND sku_type = ? AND request_count < ?
```

Se nenhuma linha for afetada, o limite foi atingido e a chamada é **bloqueada
antes de sair do servidor**. Como a decisão acontece no banco, duas requisições
simultâneas nunca ultrapassam o limite — há teste de concorrência cobrindo isso.

O aviso aparece a partir de **80%** (configurável). O painel mostra mês, usado,
limite e restante. A mensagem de bloqueio explica que a proteção existe para o
orçamento, e o restante do CRM continua funcionando.

---

## 6. Política de persistência

Esta é a regra central do produto.

### Pode ser gravado permanentemente

- `place_id`
- `internal_name` — rótulo do CRM **definido pelo usuário**
- Origem, nicho, país, estado, cidade e contexto **digitados pelo usuário**
- Serviço, etapa, notas, atividades, follow-ups, propostas, vendas, pagamentos, histórico
- Contatos e links que o usuário **confirmar explicitamente**

### Nunca é gravado automaticamente

- Nome retornado pelo Google
- Endereço, telefone, nota, quantidade de avaliações, categoria, website
- `googleMapsUri` ou qualquer parte da resposta integral

Os resultados existem apenas no estado transitório da sessão/interface. O detalhe
ao vivo é buscado por `place_id`, exibido e **descartado ao fim da requisição**.

Para incorporar um dado ao CRM existe ação explícita:
**"Salvar telefone como contato confirmado"**, **"Salvar link confirmado"** —
sempre deixando claro que o usuário está confirmando o dado.

### Place IDs

- Guardados por tempo indeterminado, conforme permitido.
- Recomendação: revisar `place_id` armazenados há mais de 12 meses, usando
  operação **somente de ID** quando aplicável.
- A atualização de ID **não** pode virar snapshot de conteúdo.

---

## 7. Status do negócio

| `businessStatus` | Comportamento |
| --- | --- |
| `OPERATIONAL` | Exibido |
| `CLOSED_TEMPORARILY` | Exibido **com aviso** |
| `CLOSED_PERMANENTLY` | **Oculto por padrão** |
| Ausente | Tratado como desconhecido, exibido |

**`openNow` nunca é usado como filtro.** Uma empresa operacional aparece mesmo
que a pesquisa aconteça fora do horário comercial — horário de funcionamento não
diz nada sobre a empresa estar ativa.

---

## 8. Classificação de links

Função pura e testada (`src/server/domain/links.ts`).

| Classificação | Exemplos |
| --- | --- |
| `OWN_WEBSITE` | Domínio próprio provável |
| `INSTAGRAM` | instagram.com, instagr.am |
| `WHATSAPP` | wa.me, api.whatsapp.com |
| `FACEBOOK_OR_SOCIAL` | facebook.com, tiktok.com, youtube.com, linkedin.com |
| `LINK_IN_BIO` | linktr.ee, beacons.ai, bio.link, taplink.cc |
| `DIRECTORY_OR_PLATFORM` | doctoralia, ifood, business.site, .wixsite.com, .myshopify.com |
| `UNKNOWN` | Link não reconhecido — **aparece sinalizado**, nunca escondido |
| `NONE` | Sem nenhum link |

### Linguagem obrigatória

A plataforma nunca afirma certeza absoluta:

- "Sem site próprio identificado no perfil"
- "Provável site próprio"
- "Link não classificado — verificar"

### Filtros

| Filtro | Inclui |
| --- | --- |
| Sem site próprio | `NONE`, Instagram, WhatsApp, rede social, página de links, diretório (+ `UNKNOWN`) |
| Sem nenhum link | Apenas `NONE` |
| Com site próprio | `OWN_WEBSITE` (+ `UNKNOWN`) |
| Rede social como site | Instagram, Facebook, WhatsApp, página de links |

---

## 9. Telefone e WhatsApp

Normalização com `libphonenumber-js/max` (metadados completos, necessários para
distinguir celular de fixo).

| Tipo identificado | Ações oferecidas |
| --- | --- |
| Celular | "Abrir WhatsApp — **não confirmado**" e "Ligar" |
| Fixo | "Ligar" |
| Incerto | Ação conservadora, com rótulo claro |
| Ausente | **Nenhum** botão de contato |

> A API do Google **não informa** se um número tem WhatsApp.
> O texto "WhatsApp confirmado" não existe em lugar nenhum do sistema.

O link de WhatsApp usa o número normalizado, abre em nova aba e **não envia
mensagem automaticamente**.

Por padrão, resultados sem telefone ficam ocultos, com opção secundária
"Mostrar sem telefone" (desligada).

---

## 10. Instagram

O Places API não possui campo oficial de Instagram. A ordem é:

1. Se `websiteUri` for Instagram, classifica e exibe.
2. Se houver site próprio, oferece a ação **manual** "Localizar Instagram no site".
3. A análise baixa **apenas** a página informada, com proteção SSRF completa.
4. Extrai links explícitos para `instagram.com`.
5. Sem resultado, mostra "Instagram não localizado".
6. Oferece **"Buscar Instagram"**, abrindo uma pesquisa para conferência manual.
7. Permite colar e salvar o perfil manualmente.
8. Qualquer Instagram salvo fica marcado como confirmado pelo usuário ou importado.

### Proteção SSRF da análise

- Apenas HTTP/HTTPS
- Bloqueio de localhost, `.local`, `.internal`
- Bloqueio de IP privado, loopback, link-local, CGNAT, multicast e **metadata
  endpoints** (`169.254.169.254`)
- DNS resolvido e validado **antes** de conectar e **a cada redirecionamento**
- Máximo de 2 redirecionamentos
- Timeout de 5 s, resposta limitada a 512 KB
- Não executa JavaScript, não rastreia outras páginas, **não armazena o HTML**

---

## 11. Pontuação de leads

Determinística, explicável e **transitória** — nunca persistida como verdade.

Considera: telefone disponível, ausência de site próprio, uso apenas de rede
social/WhatsApp/diretório, empresa operacional, volume de avaliações e nota
(com peso moderado).

- Os motivos são sempre exibidos ("Sem site próprio", "Telefone disponível").
- Qualidade comercial **não** é definida apenas pela nota.
- O usuário pode ordenar por relevância original, pontuação, nota ou avaliações.
- Resultado válido **nunca** é escondido por pontuação baixa.

---

## 12. Atribuição

O texto de atribuição do Google aparece no **mesmo contexto visual** dos
resultados e do painel de dados ao vivo. Não é escondido, recortado nem
estilizado de forma que reduza sua legibilidade.

As páginas [Termos de Uso](/termos) e [Política de Privacidade](/privacidade)
são públicas e descrevem o tratamento dos dados.

---

## 13. Falhas

- Timeout de 8 s por chamada
- Retry **apenas** para erro transitório (408, 429, 5xx), máximo de 3 tentativas
- Backoff exponencial com jitter
- Circuit breaker: após 5 falhas seguidas, para de tentar por 60 s
- Cancelamento do cliente aborta a requisição sem retry
- Mensagens em português; a resposta bruta do Google **nunca** chega ao usuário

**Falha do Google não derruba o CRM.** O card abre, o histórico aparece, notas,
follow-ups e vendas continuam funcionando — apenas o bloco "Dados atuais do
Google" mostra um erro recuperável com botão de tentar novamente.

---

## 14. Testes

Todos com mock. **Nenhum teste automatizado consome a API real.**

- Field mask mínima (e ausência de campos caros)
- Consulta textual sem `openNow`
- Chave apenas no cabeçalho, nunca na URL
- Paginação: uma chamada por página solicitada
- Limite interno bloqueando corretamente
- Concorrência no limite (10 tentativas simultâneas para limite 5 → exatamente 5 passam)
- Status operacional, temporário e permanente
- Ausência de chave produz mensagem de configuração
- Nenhum campo proibido é persistido
