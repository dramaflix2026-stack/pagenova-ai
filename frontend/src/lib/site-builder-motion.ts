import type { SiteMotion } from "@/lib/site-builder-animation";

/**
 * Camada visual compartilhada por todas as prévias.
 * Se animação ou IntersectionObserver não estiver disponível, o conteúdo continua visível.
 */
export function enhanceSitePreview(html: string, motion?: SiteMotion): string {
  const settings = JSON.stringify(motion || {preset:"professional"}).replace(/</g,"\\u003c");
  const css = `<style id="pagenova-motion">
    html{scroll-behavior:smooth}
    body{overflow-x:hidden}
    main p,main article p{overflow-wrap:anywhere}
    main article p{max-width:65ch}
    main h1,main h2,main h3{text-wrap:balance}
    main article,main .property,main .card,main .service{
      transform-style:preserve-3d;
      will-change:transform;
      transition:transform .35s cubic-bezier(.2,.8,.2,1),box-shadow .35s ease,border-color .35s ease
    }
    @media (hover:hover) and (pointer:fine){
      main article:hover,main .property:hover,main .card:hover,main .service:hover{
        box-shadow:0 24px 48px rgba(18,40,35,.16)
      }
    }
    [data-pn-ready="true"] .pn-reveal{
      opacity:0;transform:translate3d(0,26px,0);
      transition:opacity var(--pn-duration,700ms) ease,transform var(--pn-duration,750ms) cubic-bezier(.16,1,.3,1);
      transition-delay:var(--pn-delay,0ms)
    }
    [data-pn-ready="true"] .pn-reveal.pn-visible{
      opacity:1;transform:translate3d(0,0,0)
    }
    [data-pn-ready="true"] .pn-reveal[data-pn-effect="fade-left"]:not(.pn-visible){transform:translate3d(-26px,0,0)}
    [data-pn-ready="true"] .pn-reveal[data-pn-effect="fade-right"]:not(.pn-visible){transform:translate3d(26px,0,0)}
    [data-pn-ready="true"] .pn-reveal[data-pn-effect="zoom"]:not(.pn-visible){transform:scale(.94)}
    .pn-motion-loop[data-pn-effect="pulse"]{animation:pn-legacy-pulse 2.7s ease-in-out infinite}
    .pn-motion-loop[data-pn-effect="float"]{animation:pn-legacy-float 4s ease-in-out infinite}
    @keyframes pn-legacy-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
    @keyframes pn-legacy-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
    html[data-pn-motion-disabled="true"] *,html[data-pn-motion-disabled="true"] *::before,html[data-pn-motion-disabled="true"] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}
    @media (prefers-reduced-motion:reduce){
      html{scroll-behavior:auto}
      [data-pn-ready="true"] .pn-reveal{opacity:1!important;transform:none!important;transition:none!important}
      main article,main .property,main .card,main .service{transform:none!important;transition:none!important}
    }
  </style>`;

  const js = `<script id="pagenova-motion-script">
  (function(){
    var config = ${settings};
    if(config.preset==="none"||(config.mobile==="none"&&window.matchMedia("(max-width: 767px)").matches)){
      document.documentElement.setAttribute("data-pn-motion-disabled","true");return;
    }
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
    var root=document.documentElement;
    var targets=Array.prototype.slice.call(document.querySelectorAll(
      "main section, main article, main .property, main .card, main .service, main .media-frame, main .hero-media"
    )).filter(function(el){return !el.closest("[hidden], .detail, dialog")});
    if(!("IntersectionObserver" in window))return;
    var observer=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("pn-visible");
          observer.unobserve(entry.target);
        }
      });
    },{threshold:0.08,rootMargin:"0px 0px -25px 0px"});
    targets.forEach(function(el,index){
      var section=el.matches("section")?el:el.closest("section");
      var sectionId=section&&(section.getAttribute("data-section-id")||section.id)||"";
      var blockId=el.getAttribute("data-block-id")||"";
      var rule=(config.blocks&&config.blocks[blockId])||(config.sections&&config.sections[sectionId])||{};
      var effect=rule.effect||"fade-up";
      var mobile=window.matchMedia("(max-width: 767px)").matches;
      if(effect==="none"||(rule.device==="desktop"&&mobile)||(rule.device==="mobile"&&!mobile))return;
      el.setAttribute("data-pn-effect",effect);
      if(effect==="pulse"||effect==="float"){el.classList.add("pn-motion-loop");return;}
      if(el.getBoundingClientRect().top<window.innerHeight*0.85)return;
      el.classList.add("pn-reveal");
      el.style.setProperty("--pn-delay",(index%3)*Math.min(1000,Number(rule.staggerMs)||65)+"ms");
      el.style.setProperty("--pn-duration",Math.min(2400,Number(rule.durationMs)||700)+"ms");
      observer.observe(el);
    });
    root.setAttribute("data-pn-ready","true");

    var cards=document.querySelectorAll("main article,main .property,main .card,main .service");
    cards.forEach(function(card){
      card.addEventListener("pointermove",function(event){
        if(event.pointerType!=="mouse")return;
        var box=card.getBoundingClientRect();
        var x=(event.clientX-box.left)/box.width-.5;
        var y=(event.clientY-box.top)/box.height-.5;
        card.style.transform="perspective(900px) rotateX("+(-y*3)+"deg) rotateY("+(x*3)+"deg) translateY(-3px)";
      });
      card.addEventListener("pointerleave",function(){card.style.transform=""});
    });
  })();
  </script>`;

  return html.replace("</head>", css + "</head>").replace("</body>", js + "</body>");
}