"use client";
type FooterInfo={address?:string;email?:string;whatsapp?:string;cnpj?:string};
const phoneDigits=(v:string)=>v.replace(/\D/g,"");
export function Template7RealEstateFooter({brand,niche,footer}:{brand:string;niche:string;footer:FooterInfo}){
 const digits=phoneDigits(footer.whatsapp||"");
 const wa=digits.length>=10?"https://wa.me/"+digits:null;
 const email=footer.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(footer.email)?footer.email:null;
 const links=[["Início","#inicio-tp7"],["Imóveis","#buscar-imoveis-tp7"],["Destaques","#empreendimentos-tp7"],["Sobre nós","#sobre-tp7"],["Galeria","#galeria-tp7"],["Nossa jornada","#jornada-tp7"],["Perguntas frequentes","#faq-tp7"],["Contato","#contato-tp7"]];
 return <footer id="rodape-tp7" className="pn-t7-footer">
 <style>{`
 .pn-t7-footer{background:#141c1c;color:#eeeae2;font-family:Arial,Helvetica,sans-serif;padding:100px clamp(22px,7vw,110px) 32px;overflow:hidden}.pn-t7-footer *{box-sizing:border-box}
 .pn-t7-footer-top{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:clamp(25px,5vw,90px);padding-bottom:100px}
 .pn-t7-footer .eyebrow{font-size:11px;letter-spacing:.23em;text-transform:uppercase;color:#aaa99e;font-weight:700}
 .pn-t7-footer h2{font:400 clamp(34px,4vw,60px)/1.15 Georgia,serif;letter-spacing:-.04em;max-width:460px;margin:22px 0}
 .pn-t7-footer .lead{font-size:14px;line-height:1.8;color:#c2c5bd;max-width:400px}
 .pn-t7-footer h3{font-size:11px;text-transform:uppercase;letter-spacing:.19em;font-weight:700;color:#aaa99e;margin:5px 0 24px}
 .pn-t7-footer a{color:#f0eee7;text-decoration:none}.pn-t7-footer a:hover{text-decoration:underline;text-underline-offset:6px}
 .pn-t7-footer-nav{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px}.pn-t7-footer-nav a,.pn-t7-footer-contact a,.pn-t7-footer-contact p{font-size:14px;line-height:1.65}
 .pn-t7-footer-contact p{color:#d4d3cb;margin:0 0 16px;overflow-wrap:anywhere}.pn-t7-footer-contact a{display:block;margin-bottom:16px;overflow-wrap:anywhere}
 .pn-t7-footer-brand{font:400 clamp(58px,12vw,200px)/.95 Georgia,'Times New Roman',serif;letter-spacing:-.075em;overflow-wrap:anywhere;padding:28px 0 45px;border-top:1px solid #ffffff30;border-bottom:1px solid #ffffff30}
 .pn-t7-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:15px;padding-top:26px;color:#a9aca5;font-size:11px;letter-spacing:.06em}
 @media(max-width:850px){.pn-t7-footer{padding:75px 24px 30px}.pn-t7-footer-top{grid-template-columns:1fr 1fr;gap:45px;padding-bottom:65px}.pn-t7-footer-intro{grid-column:span 2}.pn-t7-footer-brand{font-size:clamp(55px,12vw,120px)}}
 @media(max-width:520px){.pn-t7-footer-top{grid-template-columns:1fr}.pn-t7-footer-intro{grid-column:auto}.pn-t7-footer-brand{font-size:clamp(50px,12vw,85px)}.pn-t7-footer-bottom{flex-direction:column;align-items:start}}
 `}</style>
 <div className="pn-t7-footer-top"><div className="pn-t7-footer-intro"><span className="eyebrow">{niche}</span><h2>O próximo capítulo começa aqui.</h2><p className="lead">Arquitetura, escolhas e possibilidades. Encontre o espaço que combina com seus planos.</p></div>
 <nav aria-label="Navegação do rodapé"><h3>Explore</h3><div className="pn-t7-footer-nav">{links.map(([label,href])=><a key={href} href={href}>{label}</a>)}</div></nav>
 <div className="pn-t7-footer-contact"><h3>Vamos conversar</h3>{wa&&<a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}{email&&<a href={"mailto:"+email}>{email}</a>}{footer.address&&<p>{footer.address}</p>}{!wa&&!email&&!footer.address&&<p>Os canais de contato serão exibidos após o cadastro pela empresa.</p>}{footer.cnpj&&<p>CNPJ: {footer.cnpj}</p>}<a href="#contato-tp7">Entre em contato ↗</a></div></div>
 <div className="pn-t7-footer-brand">{brand}</div>
 <div className="pn-t7-footer-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>Uma experiência imobiliária singular.</span></div>
 </footer>;
}
