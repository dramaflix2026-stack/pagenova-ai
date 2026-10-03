/**
 * Runtime do site publicado.
 *
 * Um unico script pequeno, sem dependencia externa, embutido no HTML. Cuida do
 * menu no celular, dos presets de movimento, do formulario que abre o WhatsApp
 * e das interacoes globais (cabecalho que encolhe, barra de progresso).
 *
 * Quatro regras governam este arquivo:
 *
 *  1. Ele e OPCIONAL. Todo o conteudo ja esta no HTML; se este script nao
 *     rodar, a pagina continua legivel, navegavel e com os links funcionando.
 *     E por isso que a classe `js` e adicionada por ele mesmo -- sem o script,
 *     o CSS que esconde elementos para animar nunca chega a valer.
 *  2. Ele respeita `prefers-reduced-motion` de verdade: com a preferencia
 *     ligada, nada e escondido, nada anima e o observador nem e criado.
 *  3. Ele nao faz requisicao a lugar nenhum. O ZIP tem que funcionar sem
 *     backend, e um site de demonstracao nao pode telefonar para casa.
 *  4. Ele limpa o que cria. `cleanupSiteRuntime` desmonta observadores e
 *     ouvintes, para o preview do editor nao acumular animacao duplicada a
 *     cada re-render.
 *
 * Sobre GSAP: os doze presets do registry sao implementados aqui com CSS,
 * IntersectionObserver e `requestAnimationFrame`, sem nenhuma biblioteca. Ver
 * `docs/site-ai-motion.md` para o motivo e para a ressalva de licenca.
 *
 * O codigo e exportado como string porque ele e embutido no HTML gerado, e nao
 * empacotado pelo Vite: o destino final e um arquivo estatico que precisa
 * abrir com duplo clique.
 */

export const SITE_RUNTIME_VERSION = '1.1.0';

/**
 * Codigo entregue ao navegador.
 *
 * Escrito em ES5 conservador de proposito: ele roda no celular de quem receber
 * o link, e nao no ambiente de build. Nao vale a pena arriscar um `?.` em um
 * navegador antigo para economizar tres caracteres.
 */
export const SITE_RUNTIME_JS = `
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduced = mq ? mq.matches : false;
  var isMobile = window.matchMedia ? window.matchMedia('(max-width: 768px)').matches : false;

  // Tudo que precisa ser desfeito depois. O preview do editor remonta a pagina
  // a cada alteracao; sem esta lista, cada remontagem deixaria um observador
  // vivo e as animacoes passariam a disparar em duplicidade.
  var teardown = [];
  function onCleanup(fn) { teardown.push(fn); }

  window.__siteRuntimeCleanup = function () {
    for (var t = 0; t < teardown.length; t++) {
      try { teardown[t](); } catch (e) { /* nunca deixa a limpeza quebrar */ }
    }
    teardown = [];
    root.className = root.className.replace(/\\bjs\\b/g, '');
  };

  // A classe 'js' liga o CSS de animacao. Sem este script ela nunca aparece,
  // entao o conteudo nasce e permanece visivel.
  if (!reduced) {
    root.className += ' js';
    onCleanup(function () { root.className = root.className.replace(/\\bjs\\b/g, ''); });
  }

  function on(el, type, fn, opts) {
    el.addEventListener(type, fn, opts);
    onCleanup(function () { el.removeEventListener(type, fn, opts); });
  }

  // ---- Menu do celular ----------------------------------------------------
  var toggle = doc.querySelector('[data-nav-toggle]');
  var nav = doc.getElementById('menu-principal');

  if (toggle && nav) {
    on(toggle, 'click', function () {
      var open = nav.getAttribute('data-open') === 'true';
      nav.setAttribute('data-open', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      toggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
    });

    // Clicar em um item fecha o menu: no celular ele cobre a secao de destino.
    on(nav, 'click', function (event) {
      if (event.target && event.target.tagName === 'A') {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Escape fecha e devolve o foco ao botao, como manda a navegacao por teclado.
    on(doc, 'keydown', function (event) {
      if (event.key === 'Escape' && nav.getAttribute('data-open') === 'true') {
        nav.setAttribute('data-open', 'false');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // ---- Ancoras com cabecalho fixo -----------------------------------------
  // Sem isto, o cabecalho grudado cobre o titulo da secao de destino.
  var header = doc.querySelector('.site-header');
  if (header) {
    root.style.scrollPaddingTop = (header.offsetHeight + 12) + 'px';
  }

  // ---- Presets de entrada -------------------------------------------------
  var animated = doc.querySelectorAll('[data-animate], [data-animate-stagger]');

  function revealAll() {
    for (var i = 0; i < animated.length; i++) {
      if (animated[i].className.indexOf('is-visible') < 0) {
        animated[i].className += ' is-visible';
      }
    }
  }

  if (reduced || !('IntersectionObserver' in window)) {
    // Reduced-motion nao e "animacao mais rapida": e nenhuma animacao.
    revealAll();
  } else {
    var observer = new IntersectionObserver(
      function (entries) {
        for (var j = 0; j < entries.length; j++) {
          if (!entries[j].isIntersecting) continue;

          var el = entries[j].target;
          el.className += ' is-visible';

          var preset = el.getAttribute('data-animate') || '';

          // stagger-cards: atraso em cascata, para a grade nao estourar junta.
          if (el.hasAttribute('data-animate-stagger') || preset === 'stagger-cards') {
            var kids = el.children;
            var step = isMobile ? 45 : 70;
            for (var k = 0; k < kids.length; k++) {
              kids[k].style.animationDelay = (k * step) + 'ms';
            }
          }

          if (preset === 'counter-on-view') countUp(el);

          observer.unobserve(el);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
    );

    for (var m = 0; m < animated.length; m++) observer.observe(animated[m]);
    onCleanup(function () { observer.disconnect(); });
  }

  // ---- counter-on-view ----------------------------------------------------
  // Anima apenas o prefixo NUMERICO e devolve o texto original ao terminar.
  // "9 anos" vira "0 anos ... 9 anos", e um valor sem numero nunca e tocado.
  function countUp(scope) {
    var nodes = scope.querySelectorAll('[data-count]');

    for (var i = 0; i < nodes.length; i++) {
      (function (node) {
        var original = node.textContent || '';
        var match = original.match(/^\\s*([0-9]+([.,][0-9]+)?)/);
        if (!match) return;

        var alvo = parseFloat(match[1].replace(',', '.'));
        if (!isFinite(alvo) || alvo <= 0) return;

        var casas = (match[1].split(/[.,]/)[1] || '').length;
        var resto = original.slice(match[0].length);
        var inicio = 0;
        var duracao = 1400;

        var frame = requestAnimationFrame(function passo(agora) {
          if (!inicio) inicio = agora;
          var p = Math.min((agora - inicio) / duracao, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var atual = (alvo * eased).toFixed(casas).replace('.', ',');

          node.textContent = atual + resto;
          if (p < 1) frame = requestAnimationFrame(passo);
          else node.textContent = original;
        });

        onCleanup(function () {
          cancelAnimationFrame(frame);
          node.textContent = original;
        });
      })(nodes[i]);
    }
  }

  // ---- Presets ligados ao scroll ------------------------------------------
  // Um unico ouvinte de scroll para a pagina toda, com leitura agrupada em
  // requestAnimationFrame: varios ouvintes independentes seriam a forma mais
  // rapida de derrubar os quadros no celular.
  var scrubs = [];

  if (!reduced) {
    var parallax = doc.querySelectorAll('[data-animate="parallax-subtle"]');
    // Desligado no celular de proposito: custo alto, ganho quase nulo em tela
    // pequena. O registry declara mobile: 'off' para este preset.
    if (!isMobile) {
      for (var p = 0; p < parallax.length; p++) {
        (function (secao) {
          var img = secao.querySelector('img');
          if (!img) return;
          scrubs.push(function (vh) {
            var r = secao.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var centro = (r.top + r.height / 2 - vh / 2) / vh;
            img.style.transform = 'translate3d(0,' + (centro * -18).toFixed(2) + 'px,0)';
          });
        })(parallax[p]);
      }
    }

    var shifts = doc.querySelectorAll('[data-animate="section-background-shift"]');
    if (!isMobile) {
      for (var q = 0; q < shifts.length; q++) {
        (function (secao) {
          scrubs.push(function (vh) {
            var r = secao.getBoundingClientRect();
            if (r.bottom < 0 || r.top > vh) return;
            var progresso = Math.min(Math.max(1 - r.top / vh, 0), 1);
            secao.style.setProperty('--shift', progresso.toFixed(3));
          });
        })(shifts[q]);
      }
    }
  }

  var condensa = doc.querySelector('[data-header-condense]');
  var progresso = doc.querySelector('[data-progress]');

  if (condensa || progresso || scrubs.length) {
    var pendente = false;

    var aoRolar = function () {
      if (pendente) return;
      pendente = true;

      requestAnimationFrame(function () {
        pendente = false;
        var vh = window.innerHeight || 800;
        var y = window.pageYOffset || root.scrollTop || 0;

        if (condensa) {
          if (y > 24) condensa.className = condensa.className.indexOf('is-condensed') < 0
            ? condensa.className + ' is-condensed' : condensa.className;
          else condensa.className = condensa.className.replace(/\\bis-condensed\\b/g, '');
        }

        if (progresso) {
          var total = doc.body.scrollHeight - vh;
          progresso.style.transform = 'scaleX(' + (total > 0 ? Math.min(y / total, 1) : 0) + ')';
        }

        for (var s = 0; s < scrubs.length; s++) scrubs[s](vh);
      });
    };

    on(window, 'scroll', aoRolar, { passive: true });
    on(window, 'resize', aoRolar, { passive: true });
    aoRolar();
  }

  // ---- Formulario que abre o WhatsApp -------------------------------------
  // Nao envia nada e nao guarda nada: monta a mensagem e abre o aplicativo.
  // E o que permite o site exportado funcionar sem backend.
  var forms = doc.querySelectorAll('[data-whatsapp-form]');

  for (var f = 0; f < forms.length; f++) {
    (function (form) {
      on(form, 'submit', function (event) {
        event.preventDefault();

        var fields = form.querySelectorAll('input, textarea, select');
        var valido = true;
        var linhas = [];

        for (var n = 0; n < fields.length; n++) {
          var field = fields[n];
          var wrapper = field.parentNode;
          var valor = (field.value || '').trim();

          if (field.hasAttribute('required') && !valor) {
            wrapper.setAttribute('data-invalid', 'true');
            field.setAttribute('aria-invalid', 'true');
            if (valido) field.focus();
            valido = false;
            continue;
          }

          wrapper.setAttribute('data-invalid', 'false');
          field.removeAttribute('aria-invalid');

          if (valor) {
            var label = wrapper.querySelector('label');
            linhas.push((label ? label.textContent + ': ' : '') + valor);
          }
        }

        if (!valido) return;

        var phone = form.getAttribute('data-phone') || '';
        var texto = linhas.join('\\n');
        window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(texto), '_blank', 'noopener');
      });
    })(forms[f]);
  }

  // Mudar a preferencia de movimento durante a visita passa a valer na hora,
  // sem exigir recarga -- e o comportamento que uma pessoa espera ao ligar a
  // opcao no sistema justamente porque a pagina a incomodou.
  if (mq && mq.addEventListener) {
    on(mq, 'change', function (event) {
      if (event.matches) {
        root.className = root.className.replace(/\\bjs\\b/g, '');
        revealAll();
      }
    });
  }
})();
`.trim();

/**
 * Versao minificada de forma conservadora.
 *
 * Remove comentarios de linha inteira e a indentacao, e so isso. Um
 * minificador de verdade traria uma dependencia e um risco desproporcional
 * para um arquivo deste tamanho -- e o ganho real seria de poucos kilobytes.
 */
export function minifyRuntime(source: string = SITE_RUNTIME_JS): string {
  return source
    .split('\n')
    .map((rawLine) => {
      const line = rawLine.trim();
      // So remove a linha inteira quando ela e um comentario: cortar `//` no
      // meio de uma linha destruiria uma URL dentro de string.
      return line.startsWith('//') ? '' : line;
    })
    .filter(Boolean)
    .join('\n');
}
