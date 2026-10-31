"use client";
type Props={brand:string;niche:string;address?:string;email?:string;whatsapp?:string;contactHref?:string};
const digits=(s:string)=>s.replace(/\D/g,"");
export function Template8HospitalityClosing({brand,niche,address,email,whatsapp,contactHref}:Props){
 const mail=email?.trim()&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())?email.trim():undefined;
 const phone=whatsapp&&digits(whatsapp).length>=10?digits(whatsapp):undefined;
 const addr=address?.trim()||undefined;
 const href=phone?"https://wa.me/"+phone:mail?"mailto:"+mail:undefined;
 const map=addr?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(addr):undefined;
 const travel=/ag.ncia|turismo|operadora|passeio|excurs|experi.ncia|ecoturismo/i.test(niche);
 return <div className="pn-t8-closing">
 <style>{`
 .pn-t8-closing{width:100%;max-width:100%;overflow-x:clip;font-family:Arial,Helvetica,sans-serif}.pn-t8-closing *{box-sizing:border-box}
 .pn-t8c-contact{background:#ede6d9;color:#263c38}.pn-t8c-container{max-width:1440px;margin:0 auto;padding:clamp(75px,9vw,130px) clamp(22px,6vw,90px)}
 .pn-t8c-grid{display:grid;grid-template-columns:1fr 1fr;gap:clamp(40px,7vw,120px);align-items:center}
 .pn-t8c-label{display:block;font-size:11px;letter-spacing:.25em;text-transform:uppercase;font-weight:700;color:#947a59;margin-bottom:25px}
 .pn-t8c-title{font:400 clamp(40px,5.6vw,82px)/1.07 Georgia,serif;letter-spacing:-.05em;margin:0 0 26px;overflow-wrap:break-word}
 .pn-t8c-text{font-size:16px;line-height:1.85;color:#596963;max-width:550px}
 .pn-t8c-details{margin-top:35px;display:grid;gap:18px}.pn-t8c-detail{border-top:1px solid #bdb5a7;padding-top:15px;display:flex;flex-direction:column;gap:9px}.pn-t8c-detail small{font-size:10px;text-transform:uppercase;letter-spacing:.19em;color:#847259}.pn-t8c-detail a,.pn-t8c-detail span{font-size:15px;line-height:1.7;color:#263c38;overflow-wrap:anywhere;text-decoration:none}
 .pn-t8c-image{position:relative;min-height:550px;background:#acb5a5;overflow:hidden}.pn-t8c-image img{width:100%;height:100%;object-fit:cover;display:block}
 .pn-t8c-image-caption{position:absolute;bottom:0;left:0;right:0;padding:24px;color:white;background:linear-gradient(transparent,#10231fd9);font:400 23px Georgia,serif}
 .pn-t8c-footer{background:#142925;color:#eee9de}.pn-t8c-footer .pn-t8c-label{color:#c8b28c}
 .pn-t8c-footer-top{display:flex;justify-content:space-between;gap:40px;align-items:start}
 .pn-t8c-footer-copy{max-width:460px;font-size:15px;line-height:1.8;color:#b7c3ba}
 .pn-t8c-footer-nav{display:flex;gap:18px 35px;flex-wrap:wrap;max-width:550px}.pn-t8c-footer-nav a{font-size:12px;letter-spacing:.08em;color:#eee9de;text-decoration:none}
 .pn-t8c-wordmark{font:400 clamp(60px,12vw,170px)/1 Georgia,serif;letter-spacing:-.075em;overflow-wrap:anywhere;margin:90px 0 55px;border-bottom:1px solid #ffffff40;padding-bottom:55px}
 .pn-t8c-bottom{display:flex;justify-content:space-between;gap:15px;flex-wrap:wrap;font-size:12px;color:#b7c3ba}
 @media(max-width:800px){.pn-t8c-grid{grid-template-columns:1fr}.pn-t8c-image{min-height:380px}.pn-t8c-footer-top{flex-direction:column}.pn-t8c-wordmark{margin:65px 0 35px;padding-bottom:35px}}
 @media(max-width:450px){.pn-t8c-image{min-height:300px}.pn-t8c-wordmark{font-size:clamp(48px,13vw,90px)}}
 `}</style>
 <section id="tp8-contato" className="pn-t8c-contact"><div className="pn-t8c-container pn-t8c-grid"><div><span className="pn-t8c-label">10 / Contato e localização</span><h2 className="pn-t8c-title">Estamos aqui para a sua próxima história.</h2><p className="pn-t8c-text">{travel?"Compartilhe seus planos e descubra como podemos ajudar a organizar sua próxima jornada.":"Converse com nossa equipe para conhecer as possibilidades de estadia e experiência."} Informações e condições devem ser confirmadas diretamente com a empresa.</p><div className="pn-t8c-details">{phone&&<div className="pn-t8c-detail"><small>WhatsApp</small><a href={"https://wa.me/"+phone} target="_blank" rel="noopener noreferrer">Conversar pelo WhatsApp ↗</a></div>}{mail&&<div className="pn-t8c-detail"><small>E-mail</small><a href={"mailto:"+mail}>{mail}</a></div>}{addr&&<div className="pn-t8c-detail"><small>Endereço informado</small><span>{addr}</span><a href={map} target="_blank" rel="noopener noreferrer">Ver no mapa ↗</a></div>}{!phone&&!mail&&<div className="pn-t8c-detail"><small>Contato</small><span>Os canais oficiais ainda não foram cadastrados pela empresa.</span></div>}{!addr&&<div className="pn-t8c-detail"><small>Localização</small><span>{travel?"Consulte os destinos atendidos diretamente com a equipe.":"Endereço ainda não informado pela empresa."}</span></div>}</div></div><div className="pn-t8c-image"><img loading="lazy" src="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1300&q=85" alt="Fotografia ilustrativa de destino, não representa a localização real da empresa"/><div className="pn-t8c-image-caption">Cada lugar guarda novas possibilidades.</div></div></div></section>
 <footer className="pn-t8c-footer"><div className="pn-t8c-container"><div className="pn-t8c-footer-top"><div><span className="pn-t8c-label">Uma experiência com propósito</span><p className="pn-t8c-footer-copy">Inspiração, acolhimento e novas descobertas. A próxima jornada começa com você.</p></div><nav className="pn-t8c-footer-nav" aria-label="Navegação do rodapé"><a href="#inicio-tp8">Início</a><a href="#tp8-destinos">{travel?"Destinos":"Acomodações"}</a><a href="#tp8-sobre">Nossa essência</a><a href="#tp8-galeria">Galeria</a><a href="#tp8-concierge">Planeje sua experiência</a><a href="#tp8-faq">FAQ</a><a href="#tp8-contato">Contato</a></nav></div><div className="pn-t8c-wordmark">{brand}</div><div className="pn-t8c-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>{mail?mail:phone?"WhatsApp disponível para contato":"Contato oficial a configurar"}</span></div></div></footer>
 </div>;
}
