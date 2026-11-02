"use client";
import "./builder-v2-tp6-model3-store-footer.css";
type Props={brand:string;niche:string;email?:string;whatsapp?:string;address?:string;cnpj?:string;socials?:Record<string,string>};
const labels:Record<string,string>={"Loja de roupas":"Moda e estilo","Loja de calçados":"Calçados","Joalheria e semijoias":"Joias e semijoias","Ótica":"Ótica","Perfumaria e cosméticos":"Beleza e cuidados","Pet shop":"Universo pet","Loja de eletrônicos":"Eletrônicos","Loja de celulares e acessórios":"Celulares e acessórios","Loja de móveis e decoração":"Móveis e decoração","Floricultura":"Flores e plantas","Papelaria":"Papelaria criativa","Loja de brinquedos":"Brinquedos","Loja de artigos esportivos":"Artigos esportivos","Loja de presentes e personalizados":"Presentes personalizados","E-commerce multimarcas":"Seleção multimarcas"};
export function BuilderV2TP6Model3StoreFooter({brand,niche,email,whatsapp,address,cnpj,socials}:Props){
 const phone=(whatsapp||"").replace(/\D/g,"");const hasPhone=phone.length>=10&&phone.length<=15;const hasEmail=!!email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
 const socialLinks=Object.entries(socials||{}).filter(([name,url])=>/^(instagram|facebook|youtube|tiktok|pinterest)$/i.test(name)&&/^https:\/\/[^\s]+$/i.test(url));
 const data=[{label:"01 / SEGMENTO",value:labels[niche]||niche},...(hasEmail?[{label:"02 / E-MAIL",value:email!,href:"mailto:"+email}]:[]),...(hasPhone?[{label:"03 / WHATSAPP",value:"Conversar pelo WhatsApp ↗",href:"https://wa.me/"+phone}]:[]),...(address?.trim()?[{label:"04 / ENDEREÇO CADASTRADO",value:address.trim()}]:[]),...(cnpj?.trim()?[{label:"05 / CNPJ",value:cnpj.trim()}]:[])];
 return <div className="tp6m3 tp6m3-store-footer">
 <section id="informacoes-loja" className="tp6m3-store" aria-labelledby="tp6m3-store-title">
  <div className="tp6m3-section-meta"><span>10 / INFORMAÇÕES DA LOJA</span><span>O QUE VOCÊ PRECISA SABER</span></div>
  <div className="tp6m3-store-layout"><div><span className="tp6m3-store-kicker">INFORMAÇÕES / {brand}</span><h2 id="tp6m3-store-title">TUDO<br/>EM UM<br/>LUGAR<span>.</span></h2><p>Dados e canais de contato fornecidos pela loja, apresentados de forma clara.</p></div>
   <div className="tp6m3-store-data">{data.map((item,i)=><div className="tp6m3-store-row" key={item.label}><span>{item.label}</span>{'href' in item&&item.href?<a href={item.href} target={item.href.startsWith("https:")?"_blank":undefined} rel={item.href.startsWith("https:")?"noopener noreferrer":undefined}>{item.value}</a>:<strong>{item.value}</strong>}<span aria-hidden="true">0{i+1}</span></div>)}{!hasEmail&&!hasPhone&&!address?.trim()&&<div className="tp6m3-store-row"><span>CONTATO</span><strong>Dados de atendimento ainda não cadastrados.</strong><span aria-hidden="true">—</span></div>}</div>
  </div>
 </section>
 <footer className="tp6m3-footer"><div className="tp6m3-footer-meta"><span>11 / RODAPÉ</span><span>CONTINUE EXPLORANDO</span></div>
  <div className="tp6m3-footer-top"><div><span className="tp6m3-footer-kicker">O UNIVERSO DA MARCA</span><p>{labels[niche]||niche}. Explore nossas coleções e descubra diferentes possibilidades.</p></div>
   <nav aria-label="Navegação do rodapé" className="tp6m3-footer-links"><strong>EXPLORE</strong><a href="#inicio">Início</a><a href="#sobre">Sobre a marca</a><a href="#produtos">Coleções</a><a href="#como-comprar">Como comprar</a><a href="#faq">Perguntas frequentes</a></nav>
   <div className="tp6m3-footer-links"><strong>CONTATO</strong><a href="#contato">Entre em contato</a><a href="#informacoes-loja">Informações da loja</a>{hasEmail&&<a href={"mailto:"+email}>E-mail</a>}{hasPhone&&<a href={"https://wa.me/"+phone} target="_blank" rel="noopener noreferrer">WhatsApp</a>}{socialLinks.map(([name,url])=><a key={name} href={url} target="_blank" rel="noopener noreferrer">{name}</a>)}</div>
  </div>
  <a href="#inicio" className="tp6m3-footer-wordmark" aria-label={brand+" — voltar ao início"}>{brand}</a>
  <div className="tp6m3-footer-bottom"><span>© {new Date().getFullYear()} {brand}. Todos os direitos reservados.</span><span>IDENTIDADE / EXPERIÊNCIA / ESCOLHA</span><a href="#inicio">VOLTAR AO TOPO ↑</a></div>
 </footer></div>;
}
