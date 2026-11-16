"use client";

type Props={brand:string;contactHref?:string};
const MAIN="https://images.unsplash.com/photo-1756575527484-2839c593ed84?auto=format&fit=crop&w=1800&q=85";
const BACKUP="https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=1600&q=85";
const features=[
 {number:"01",title:"Atendimento próximo",description:"Cada necessidade começa por uma boa conversa."},
 {number:"02",title:"Avaliação técnica",description:"Atenção ao diagnóstico e aos detalhes do veículo."},
 {number:"03",title:"Orientação transparente",description:"Clareza para decidir os próximos passos."}
];

export function TP9VerticeAbout({brand,contactHref}:Props){
 const href=contactHref&&(/^(https?:\/\/|mailto:|tel:)/i.test(contactHref)||contactHref==="#tp9-contato")?contactHref:"#tp9-orcamento";
 const external=/^https?:\/\//i.test(href);
 return <section id="tp9-sobre" className="pn-vh-about" aria-labelledby="pn-vh-about-heading">
  <style>{`
   .pn-t9s .pn-vh-about{--vh-accent:#fa7135;background:#141a1c;color:#f5f7f6;padding:clamp(82px,8vw,130px) clamp(22px,6vw,100px);width:100%;overflow-x:clip;font-family:Inter,Arial,sans-serif}
   .pn-t9s .pn-vh-about *{box-sizing:border-box}
   .pn-t9s .pn-vh-about .vh-about-layout{display:grid;grid-template-columns:minmax(0,49%) minmax(0,51%);align-items:center;gap:clamp(38px,6vw,92px);max-width:1400px;margin:0 auto}
   .pn-t9s .pn-vh-about .vh-about-photo-wrap{position:relative;min-width:0;padding:0 28px 30px 0;isolation:isolate}
   .pn-t9s .pn-vh-about .vh-about-photo-wrap:before{content:"";position:absolute;inset:30px 0 0 30px;z-index:-1;border:1px solid #fa7135a9;background:#2a3031}
   .pn-t9s .pn-vh-about .vh-about-photo{display:block;width:100%;height:clamp(450px,43vw,650px);max-width:100%;object-fit:cover;object-position:center;background:#293234;filter:saturate(.82) contrast(1.08)}
   .pn-t9s .pn-vh-about .vh-about-stamp{position:absolute;bottom:59px;left:25px;display:flex;align-items:center;gap:12px;background:#141a1ce8;border:1px solid #ffffff3d;border-left:3px solid var(--vh-accent);padding:17px 19px;max-width:calc(100% - 80px);box-shadow:0 12px 28px #0005}
   .pn-t9s .pn-vh-about .vh-about-stamp span{color:var(--vh-accent);font-size:27px;font-weight:900;line-height:1}
   .pn-t9s .pn-vh-about .vh-about-stamp p{color:#f9fbf9;margin:0;font-size:11px;letter-spacing:.11em;line-height:1.5;font-weight:800;text-transform:uppercase}
   .pn-t9s .pn-vh-about .vh-about-content{min-width:0}
   .pn-t9s .pn-vh-about .vh-about-kicker{color:var(--vh-accent);font-weight:900;letter-spacing:.19em;font-size:11px;line-height:1.6;margin:0 0 25px;display:flex;align-items:center;gap:13px;text-transform:uppercase}
   .pn-t9s .pn-vh-about .vh-about-kicker:before{content:"";display:inline-block;width:28px;height:2px;background:var(--vh-accent);flex:none}
   .pn-t9s .pn-vh-about h2{font-family:Inter,Arial,sans-serif;font-size:clamp(40px,4.8vw,72px);line-height:1.07;letter-spacing:-.05em;font-weight:900;color:#fff;margin:0 0 27px;max-width:750px;text-wrap:balance;overflow-wrap:break-word}
   .pn-t9s .pn-vh-about h2 em{font-style:normal;color:var(--vh-accent)}
   .pn-t9s .pn-vh-about .vh-about-lead{margin:0 0 18px;color:#d7dfda;line-height:1.76;font-size:clamp(15px,1.25vw,18px);max-width:620px}
   .pn-t9s .pn-vh-about .vh-about-support{margin:0;color:#a9b7af;font-size:14px;line-height:1.75;max-width:620px}
   .pn-t9s .pn-vh-about .vh-about-features{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:36px 0}
   .pn-t9s .pn-vh-about .vh-about-feature{padding-top:16px;border-top:2px solid #fa7135a3;min-width:0}
   .pn-t9s .pn-vh-about .vh-about-feature small{display:block;font-size:10px;color:var(--vh-accent);letter-spacing:.16em;font-weight:800;margin-bottom:10px}
   .pn-t9s .pn-vh-about .vh-about-feature strong{display:block;font-weight:850;font-size:clamp(14px,1.2vw,17px);line-height:1.3;color:#fff;letter-spacing:-.01em}
   .pn-t9s .pn-vh-about .vh-about-feature p{font-size:12px;line-height:1.55;color:#aebbb3;margin:8px 0 0}
   .pn-t9s .pn-vh-about .vh-about-cta{display:inline-flex;align-items:center;justify-content:center;gap:17px;min-height:56px;padding:15px 23px;font-size:13px;color:#141718;background:var(--vh-accent);text-decoration:none;font-weight:900;transition:transform .2s,background .2s}
   .pn-t9s .pn-vh-about .vh-about-cta:hover{transform:translateY(-2px);background:#ff9564}
   .pn-t9s .pn-vh-about .vh-about-cta:focus-visible{outline:3px solid #ffd0b5;outline-offset:4px}
   @media(max-width:1100px){.pn-t9s .pn-vh-about .vh-about-layout{grid-template-columns:minmax(0,48%) minmax(0,52%);gap:35px}.pn-t9s .pn-vh-about .vh-about-features{grid-template-columns:1fr;gap:15px;margin:26px 0}.pn-t9s .pn-vh-about .vh-about-feature p{margin:4px 0 0}.pn-t9s .pn-vh-about .vh-about-photo{height:580px}}
   @media(max-width:850px){.pn-t9s .pn-vh-about .vh-about-layout{grid-template-columns:1fr;gap:34px}.pn-t9s .pn-vh-about .vh-about-photo-wrap{padding-right:20px;padding-bottom:20px}.pn-t9s .pn-vh-about .vh-about-photo-wrap:before{inset:20px 0 0 20px}.pn-t9s .pn-vh-about .vh-about-photo{height:clamp(320px,55vw,480px)}.pn-t9s .pn-vh-about .vh-about-stamp{bottom:38px;left:18px}.pn-t9s .pn-vh-about .vh-about-features{grid-template-columns:repeat(3,minmax(0,1fr));gap:13px}}
   @media(max-width:560px){.pn-t9s .pn-vh-about{padding:65px 20px 75px}.pn-t9s .pn-vh-about h2{font-size:clamp(37px,10vw,54px)}.pn-t9s .pn-vh-about .vh-about-photo{height:355px}.pn-t9s .pn-vh-about .vh-about-stamp{padding:12px 14px}.pn-t9s .pn-vh-about .vh-about-stamp p{font-size:10px}.pn-t9s .pn-vh-about .vh-about-features{grid-template-columns:1fr;gap:14px}.pn-t9s .pn-vh-about .vh-about-cta{width:100%}}
   @media(prefers-reduced-motion:reduce){.pn-t9s .pn-vh-about .vh-about-cta{transition:none}}
  `}</style>
  <div className="vh-about-layout">
   <div className="vh-about-photo-wrap">
    <img className="vh-about-photo" src={MAIN} alt="Fotografia ilustrativa de profissional trabalhando em oficina automotiva" loading="lazy" onError={e=>{if(e.currentTarget.src!==BACKUP)e.currentTarget.src=BACKUP;}}/>
    <div className="vh-about-stamp"><span aria-hidden="true">✦</span><p>Dedicação em cada detalhe</p></div>
   </div>
   <div className="vh-about-content">
    <p className="vh-about-kicker">03 / Conheça a {brand}</p>
    <h2 id="pn-vh-about-heading">Seu carro nas mãos de quem <em>valoriza cada detalhe.</em></h2>
    <p className="vh-about-lead">Na Vértice Auto Center, acreditamos que cuidar do seu veículo começa com atenção, escuta e informação clara. Nossa proposta é unir o cuidado com a manutenção automotiva a um atendimento próximo.</p>
    <p className="vh-about-support">Da revisão preventiva à orientação sobre reparos, cada etapa é pensada para ajudar você a conhecer melhor as necessidades do seu carro.</p>
    <div className="vh-about-features">{features.map(f=><div className="vh-about-feature" key={f.number}><small>{f.number}</small><strong>{f.title}</strong><p>{f.description}</p></div>)}</div>
    <a className="vh-about-cta" href={href} target={external?"_blank":undefined} rel={external?"noopener noreferrer":undefined}>Fale com nossa equipe <span aria-hidden="true">↗</span></a>
   </div>
  </div>
 </section>;
}
