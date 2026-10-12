/**
 * Deployment gate for the actual FRIGOLOG source.
 *
 * Unlike a DOM screenshot approximation, this executes the same React SSR
 * renderer that production and preview run, with a CRM lead fixture.
 */
import type { SiteSchemaModel } from '../src/site-kit/schemas/site-schema';
import { renderCanonicalFrigolog, FRIGOLOG_APPROVED_CSS } from '../src/site-kit/renderer/frigolog-canonical-render';
import { adaptCrmToFrigolog } from '../src/site-kit/renderer/frigolog-crm-adapter';
import { FRIGOLOG_SOURCE_FINGERPRINT } from '../src/site-kit/renderer/frigolog-style.generated';

const check=(ok:boolean,description:string)=>{if(!ok)throw new Error('FRIGOLOG smoke: '+description);};
const site={
  business:{
    name:'Galdiano Odontologia (dentista/implante dentário)',
    niche:'dentista/implante dentário',city:'Ituverava',state:'SP',
    services:[], whatsappE164:{value:'+5516999999999'},
  },
  theme:{colors:{
    primary:'#315b82',accent:'#4cb38d',background:'#f4f7fa',text:'#1b2b39',
    primaryForeground:'#fff',
  }},
  objective:{primaryCta:{kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'}},
  navigation:{items:[],logo:null,headerCta:null},
  sections:[
    {type:'hero',id:'hero-1',anchor:'inicio',visible:true,
      eyebrow:'ODONTOLOGIA EM ITUVERAVA',headline:'Cuidado odontológico para sorrir.',
      subheadline:'Converse com a equipe da clínica.',primaryCta:{
        kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'}},
    {type:'benefits',id:'b-1',visible:true,headline:'Diferenciais',
      items:[{title:'Avaliação',body:'Atendimento individual'},{title:'Orientação',body:'Converse com a equipe'}]},
    {type:'services',id:'services-1',anchor:'servicos',visible:true,headline:'Atendimentos',
      items:[{title:'Avaliação odontológica',body:'Orientações para o seu caso'}]},
    {type:'about',id:'about-1',anchor:'sobre',visible:true,headline:'Nossa equipe',
      body:['Atendimento individual e orientações claras.']},
    {type:'cta',id:'cta-1',anchor:'contato',visible:true,headline:'Vamos conversar',
      body:'Tire suas dúvidas',primaryCta:{kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'}},
  ],
  visualTextEdits:[],
} as unknown as SiteSchemaModel;
const ctx={profile:'DEMO' as const,resolveAsset:()=>null};
check(FRIGOLOG_SOURCE_FINGERPRINT!=='not-synchronized','generated CSS was not synchronized');
check(FRIGOLOG_APPROVED_CSS.includes('.frigolog-kpi-grid'),'canonical KPI CSS missing');
const data=adaptCrmToFrigolog(site,ctx);
check(data.brand.name==='Galdiano Odontologia','lead classification suffix leaking into brand');
check(data.hero.image.src==='','missing licensed photo must not be replaced with a fake one');
const html=renderCanonicalFrigolog(site,ctx,x=>x);
check(html.includes('class="frigolog-template"'),'canonical React template markup missing');
check(html.includes('class="hero pn-photo-missing"'),'no-photo hero must collapse safely');
check(FRIGOLOG_APPROVED_CSS.includes('.hero.pn-photo-missing'),'fallback CSS missing');
check(html.includes('id="conteudo"'),'accessible skip anchor missing');
check(html.includes('frigolog-kpi-card'),'canonical highlight cards missing');
check(html.includes('href="https://wa.me/5516999999999"'),'CRM WhatsApp link missing');
check(!html.includes('frigolog/cold-storage.jpg'),'refrigeration photos used on dental lead');
check(!html.includes('src=""'),'broken photo link rendered');
// The publisher exports ZIPs with relative assets/images URLs. They must be
// accepted by the same schema validator as authenticated editor URLs.
const hero=site.sections[0]!;
if(hero.type!=='hero')throw new Error('Smoke fixture hero missing');
hero.image={assetId:'0123456789ABCDEFGHJKMNPQRS',alt:'Foto licenciada',focalX:0.5,focalY:0.5};
const artifact=renderCanonicalFrigolog(site,{
  profile:'PRODUCTION',resolveAsset:(id)=>id===hero.image?.assetId
    ?{url:'assets/images/'+id+'.webp'}:null,
},x=>x);
check(artifact.includes('assets/images/0123456789ABCDEFGHJKMNPQRS.webp'),
  'ZIP relative image path rejected or missing');
console.log('[FRIGOLOG] Smoke test PASS. React source and CSS fingerprint: '+FRIGOLOG_SOURCE_FINGERPRINT);
