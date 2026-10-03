# Sites com IA — sistema de movimento

Decisões, licenças verificadas e o motivo de o site publicado não carregar
nenhuma biblioteca de animação.

---

## 1. Decisão: motor nativo, sem GSAP no site publicado

Os doze presets de `src/shared/site-motion.ts` são implementados em
`src/shared/site-runtime.ts` com CSS, `IntersectionObserver`,
`requestAnimationFrame` e um único ouvinte de scroll. **Nenhuma biblioteca
externa é carregada pelo site publicado nem pelo ZIP.**

A especificação (§2.5 e §14.1) pede "suporte controlado a GSAP e
ScrollTrigger". Registro aqui, de forma explícita, que **não instalei o GSAP** —
e por quê.

### Motivo técnico

Os presets que o registry oferece não precisam de motor de timeline:

| Preset | Como é feito |
| --- | --- |
| `fade-in`, `fade-up-soft`, `none` | transição CSS disparada por classe |
| `stagger-cards` | `animation-delay` calculado por índice |
| `text-lines-reveal`, `image-mask-reveal` | `clip-path` com transição CSS |
| `parallax-subtle`, `section-background-shift` | um ouvinte de scroll agrupado em `requestAnimationFrame` |
| `counter-on-view` | `requestAnimationFrame` com easing cúbico |
| `header-condense-on-scroll`, `progress-indicator` | o mesmo ouvinte de scroll |
| `cta-gradient-flow` | `@keyframes` puro |

GSAP + ScrollTrigger somam cerca de 70 KB minificados. Para este conjunto,
seria peso sem ganho: o runtime inteiro tem menos de 20 KB e um teste trava
esse teto.

### Motivo de licença — o ponto que exige a sua decisão

`gsap@3.15.0` é publicado sob a **"Standard 'no charge' license"**
(<https://gsap.com/standard-license>). Ela cobre sites e aplicações comuns,
inclusive comerciais.

**A ressalva:** este módulo não é um site — é um *gerador* de sites, usado para
produzir páginas para múltiplos clientes finais. Historicamente, a licença
padrão do GSAP distinguia esse caso ("produto em que terceiros criam ou
customizam sites") e exigia uma licença comercial específica. Não consigo, a
partir daqui, verificar o texto atual dos termos para confirmar se essa
distinção continua valendo depois da aquisição pela Webflow.

Como a §25.8 manda **verificar a licença antes de produção** e a §14.1 só
autoriza uma biblioteca com "licença compatível", a decisão foi não depender de
algo cuja compatibilidade eu não consegui confirmar. O sistema funciona
integralmente sem ela.

### Se você quiser GSAP mesmo assim

O caminho está preparado: `MotionPresetSpec` tem o campo
`needsTimelineEngine`, hoje `false` em todos os presets. Um preset novo que
realmente precise de timeline coordenada marcaria `true`, e aí valeria a pena
adicionar um motor. Nesse momento é obrigatório:

1. ler os termos atuais em <https://gsap.com/licensing/> considerando o uso
   como **gerador de sites para terceiros**;
2. contratar a licença comercial, se ela for exigida para esse uso;
3. empacotar a biblioteca localmente com versão fixada — nunca CDN, senão o ZIP
   para de funcionar offline;
4. registrar a licença e a atribuição exigida neste documento.

Lenis e Three.js não foram adicionados pelo mesmo critério: nenhum preset atual
os justifica.

---

## 2. Regras que o sistema garante

Estas são verificadas por teste em `tests/unit/site-motion.test.ts`.

### O conteúdo nunca depende de JavaScript

Toda regra de CSS que esconde algo para animar vive atrás da classe `js`, que o
**próprio runtime** adiciona. Se o script não rodar — erro, bloqueio, rede
ruim — a classe nunca aparece e a página fica visível e completa. Um teste
percorre a folha de estilo inteira, bloco a bloco, e reprova qualquer regra com
`opacity:0` ou `clip-path` fora de `.js`.

### `prefers-reduced-motion` desliga tudo de verdade

Menos movimento não significa movimento mais rápido. Com a preferência ligada:

- a classe `js` nem é adicionada;
- o `IntersectionObserver` nem é criado;
- tudo é revelado imediatamente;
- `clip-path`, cascata e o gradiente animado são anulados com `!important`;
- a barra de progresso some.

Mudar a preferência **durante** a visita passa a valer na hora, sem recarregar.

### O celular recebe menos

`parallax-subtle` e `section-background-shift` são desligados em telas até
768px: custo alto de quadros, ganho visual quase nulo. O registry declara isso
em `mobile: 'off'`, e um teste exige que todo preset caro esteja desligado.

### Um único ouvinte de scroll

Cabeçalho, barra de progresso e todos os presets de scrub compartilham um
ouvinte `passive`, com leituras agrupadas em `requestAnimationFrame`. Vários
ouvintes independentes seriam a forma mais rápida de derrubar os quadros em um
aparelho fraco. Um teste conta as ocorrências e exige exatamente uma.

### Limpeza para o editor

O runtime expõe `window.__siteRuntimeCleanup()`, que desconecta o observador,
remove os ouvintes, cancela os `requestAnimationFrame` pendentes e restaura o
texto original dos contadores.

Isso existe por causa do editor (etapa A9): o preview remonta a página a cada
alteração, e sem a limpeza cada remontagem deixaria um observador vivo — as
animações passariam a disparar duas, três, dez vezes.

---

## 3. Níveis de movimento do briefing

| Nível | O que libera |
| --- | --- |
| `NONE` | apenas `none`. Nenhuma animação, nem um fade de consolação |
| `SUBTLE` | só presets de entrada e custo baixo |
| `BALANCED` | tudo, menos o que é caro (`parallax-subtle`) |

O padrão é `BALANCED`, como a §7.2 recomenda — "premium equilibrado", não
"imersivo".

A IA recebe apenas os ids permitidos pelo nível escolhido, através de
`motionForPrompt()`. Ela nunca vê o código do runtime.
