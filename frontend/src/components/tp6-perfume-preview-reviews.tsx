"use client";
type Props={publishedMode?:boolean;dark?:boolean};
/** Demonstration-only customer cards: expressly fictional and never published as real endorsements. */
const examples=[
 ["Marina","Escolher uma fragrância fica muito mais interessante quando podemos conhecer diferentes famílias olfativas.","photo-1534528741775-53994a69daeb"],
 ["Rafael","Gosto de encontrar os cuidados do dia a dia organizados em categorias fáceis de explorar.","photo-1500648767791-00dcc994a43e"],
 ["Camila","Perfumes, maquiagem e cuidados com a pele merecem uma apresentação clara e bonita.","photo-1531123897727-8f129e1688ce"],
 ["Lucas","É importante poder conferir características e disponibilidade antes de escolher um produto.","photo-1506794778202-cad84cf45f1d"],
 ["Fernanda","Uma boa seleção de cosméticos faz diferença quando as informações ajudam na escolha.","photo-1544005313-94ddf0286df2"]
] as const;
export function TP6PerfumePreviewReviews({publishedMode=false,dark=false}:Props){
 if(publishedMode)return <p style={{padding:"28px 0",opacity:.75}}>Depoimentos de clientes serão exibidos após cadastro e autorização pela loja.</p>;
 return <div style={{width:"100%",minWidth:0}}>
  <p style={{fontSize:12,lineHeight:1.6,letterSpacing:".07em",marginBottom:24,opacity:.8}}>EXEMPLOS FICTÍCIOS APENAS PARA VISUALIZAÇÃO DO LAYOUT — NÃO REPRESENTAM CLIENTES REAIS.</p>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,250px),1fr))",gap:18}}>
   {examples.map(([name,quote,photo],i)=><article key={name} style={{minWidth:0,overflow:"hidden",padding:24,background:dark?"#24221e":"#ffffff",border:"1px solid "+(dark?"#716454":"#d6d0c7"),color:dark?"#fff8ee":"#231f1a",borderRadius:12}}>
    <span style={{fontSize:12,letterSpacing:".15em",fontWeight:700}}>EXEMPLO FICTÍCIO · 0{i+1}</span>
    <p style={{fontSize:17,lineHeight:1.7,margin:"20px 0 25px",overflowWrap:"break-word"}}>“{quote}”</p>
    <div style={{display:"flex",gap:12,alignItems:"center",minWidth:0}}>
     <img src={"https://images.unsplash.com/"+photo+"?auto=format&fit=crop&w=160&h=160&q=80"} width={56} height={56} alt="Retrato ilustrativo, não é cliente real" loading="lazy" style={{width:56,height:56,minWidth:56,maxWidth:56,flex:"0 0 56px",aspectRatio:"1 / 1",objectFit:"cover",borderRadius:"50%"}}/>
     <div style={{minWidth:0,flex:"1 1 auto",overflowWrap:"break-word"}}><strong style={{display:"block",fontSize:15}}>{name} · personagem fictícia(o)</strong><small style={{fontSize:11,opacity:.72}}>Foto ilustrativa · prévia</small></div>
    </div>
   </article>)}
  </div>
 </div>;
}
