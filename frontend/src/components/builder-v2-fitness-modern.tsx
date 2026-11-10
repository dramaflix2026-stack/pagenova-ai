"use client";
type FitnessBlock={type:string;text?:string;src?:string;section?:string};
type Props={brand:string;niche:string;variant?:"01"|"02"|"03";blocks:FitnessBlock[];whatsapp?:string;address?:string};
const assets=[
 "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=85",
 "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85",
 "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1200&q=85",
 "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?auto=format&fit=crop&w=1200&q=85"
];
export function BuilderV2FitnessModern({brand,niche,variant="01",blocks,whatsapp,address}:Props){
 const isPersonal=/personal/i.test(niche);
 const options=isPersonal?["Treinamento individual","Avaliação física","Plano de evolução"]:["Musculação","Treinamento funcional","Acompanhamento individual"];
 const descriptions=["Treinos estruturados para diferentes objetivos e níveis de experiência.","Sessões dinâmicas para desenvolver força, resistência e condicionamento.","Orientação personalizada com atenção à execução e à progressão."];
 const modes={
  "01":{bg:"#101313",accent:"#ff792d",hero:"Seu próximo nível começa aqui.",label:"FORÇA EM MOVIMENTO",layout:"grid",text:"#f7f7f3"},
  "02":{bg:"#f4f1e9",accent:"#e05b20",hero:"Movimento com propósito.",label:"PERFORMANCE & EQUILÍBRIO",layout:"split",text:"#171d1b"},
  "03":{bg:"#0a111a",accent:"#b9ff4d",hero:"Supere seus próprios limites.",label:"UMA NOVA ENERGIA",layout:"editorial",text:"#f7f9fa"}
 } as const;
 const theme=modes[variant];const phone=(whatsapp||"").replace(/\D/g,"");const contact=phone.length>=10?"https://wa.me/"+phone:"#fitness-contact";
 const customTitle=blocks.find(b=>b.type==="heading"&&b.text&&b.text.length>12)?.text;
 return <main style={{background:theme.bg,color:theme.text,fontFamily:"Inter,Arial,sans-serif"}} className="min-h-screen overflow-hidden">
 <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10"><strong className="text-xl font-black tracking-tight">{brand}</strong><a href="#fitness-contact" className="text-sm font-semibold">Comece agora ↗</a></header>
 <section className={variant==="02"?"mx-auto grid min-h-[630px] max-w-7xl items-center gap-8 px-6 py-12 md:grid-cols-2 md:px-10":"relative flex min-h-[680px] items-center px-6 py-20 md:px-[8%]"} style={variant==="02"?{}:{backgroundImage:"linear-gradient(90deg,rgba(0,0,0,.86),rgba(0,0,0,.22)),url("+assets[0]+")",backgroundSize:"cover",backgroundPosition:"center"}}>
 <div className="relative z-10 max-w-3xl" style={variant==="02"?{}:{color:"#fff"}}><p className="mb-6 text-xs font-black tracking-[.32em]" style={{color:theme.accent}}>{theme.label}</p><h1 className="text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">{customTitle||theme.hero}</h1><p className="mt-7 max-w-xl text-lg leading-relaxed opacity-85">{brand} — um espaço dedicado à evolução física, à consistência e ao cuidado com cada etapa da sua jornada.</p><a href={contact} className="mt-9 inline-flex rounded-md px-8 py-4 font-bold" style={{background:theme.accent,color:"#101313"}}>Conhecer nossos treinos ↗</a></div>
 {variant==="02"&&<img src={assets[0]} alt="Ambiente de academia" className="h-[450px] w-full rounded-lg object-cover" loading="eager"/>}</section>
 <section className="mx-auto max-w-7xl px-6 py-24 md:px-10"><p className="text-xs font-bold tracking-[.25em]" style={{color:theme.accent}}>TREINAMENTO COM PROPÓSITO</p><h2 className="mt-4 max-w-3xl text-4xl font-black md:text-6xl">Cada treino é uma oportunidade de evoluir.</h2><p className="mt-6 max-w-3xl text-lg leading-8 opacity-75">Conheça as modalidades e encontre a melhor maneira de começar, com estrutura, orientação e uma rotina que faça sentido para você.</p><div className="mt-12 grid gap-6 md:grid-cols-3">{options.map((name,i)=><article key={name} className="overflow-hidden rounded-lg border border-current/10" style={{background:variant==="02"?"#fff":"#ffffff0b"}}><img src={assets[i+1]} alt={name} className="h-64 w-full object-cover" loading="lazy"/><div className="p-7"><h3 className="text-2xl font-bold">{name}</h3><p className="mt-3 leading-7 opacity-70">{descriptions[i]}</p></div></article>)}</div></section>
 <section className="px-6 py-24 md:px-10" style={{background:variant==="02"?"#e9e4da":"#ffffff0b"}}><div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2"><img src={assets[2]} alt="Treinamento físico acompanhado" className="h-[460px] w-full rounded-lg object-cover" loading="lazy"/><div><p className="text-xs font-bold tracking-[.25em]" style={{color:theme.accent}}>NOSSA FILOSOFIA</p><h2 className="mt-5 text-4xl font-black md:text-5xl">Evolução de verdade é construída todos os dias.</h2><p className="mt-6 text-lg leading-8 opacity-75">Do primeiro treino à próxima conquista, priorizamos acompanhamento, técnica e constância. Um ambiente feito para quem quer seguir em frente.</p></div></div></section>
 <section id="fitness-contact" className="mx-auto max-w-7xl px-6 py-24 md:px-10"><p className="text-xs font-bold tracking-[.25em]" style={{color:theme.accent}}>FALE CONOSCO</p><h2 className="mt-5 max-w-3xl text-4xl font-black md:text-6xl">Pronto para dar o primeiro passo?</h2><p className="mt-6 opacity-75">{address||"São Paulo – SP · Endereço comercial a confirmar"}</p><a href={contact} className="mt-8 inline-flex rounded-md px-8 py-4 font-bold" style={{background:theme.accent,color:"#101313"}}>{phone.length>=10?"Conversar no WhatsApp":"Conhecer a academia"} ↗</a></section>
 <footer className="flex flex-wrap items-center justify-between gap-5 border-t border-current/15 px-6 py-9 text-sm md:px-[8%]"><strong>{brand}</strong><span>Treinamento, movimento e evolução.</span><a href="#" className="underline">Voltar ao topo ↑</a></footer>
 </main>;
}
