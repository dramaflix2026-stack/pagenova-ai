import { describe, expect, it } from 'vitest';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { renderCanonicalFrigolog, FRIGOLOG_STATIC_RUNTIME } from '@site-kit/renderer/frigolog-canonical-render';
import { adaptCrmToFrigolog, cleanLeadBrand } from '@site-kit/renderer/frigolog-crm-adapter';
import { FRIGOLOG_APPROVED_CSS, FRIGOLOG_SOURCE_FINGERPRINT } from '@site-kit/renderer/frigolog-style.generated';

function site():SiteSchemaModel {
  return {
    business: {
      name:'Galdiano Odontologia (dentista/implante dentário)',
      niche:'dentista/implante dentário',city:'Ituverava',state:'SP',
      services:[],whatsappE164:{value:'+5516999999999'},
    },
    navigation:{items:[],logo:null,headerCta:null},
    theme:{colors:{
      primary:'#315b82',accent:'#4cb38d',background:'#f4f7fa',
      text:'#1b2b39',primaryForeground:'#ffffff',
    }},
    objective:{primaryCta:{kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'}},
    sections:[
      {
        type:'hero',id:'hero-1',anchor:'inicio',visible:true,
        eyebrow:'ODONTOLOGIA EM ITUVERAVA',
        headline:'Cuidado odontológico para sorrir e mastigar com mais tranquilidade.',
        subheadline:'Converse com a equipe da clínica e tire suas dúvidas.',
        primaryCta:{kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'},
      },
      {
        type:'benefits',id:'benefits-1',visible:true,anchor:'beneficios',headline:'Atendimento',
        items:[{title:'Avaliação individual',body:'Atendimento e orientação'},
          {title:'Informações',body:'Conheça os próximos passos'}],
      },
      {
        type:'services',id:'services-1',anchor:'servicos',visible:true,
        headline:'Conheça os atendimentos',
        items:[{title:'Implantes',body:'Avaliação individual para seu caso'}],
      },
      {type:'about',id:'about-1',anchor:'sobre',visible:true,
        headline:'Conheça a equipe',body:['Atendimento individual e orientações claras']},
      {type:'cta',id:'cta-1',anchor:'contato',visible:true,
        headline:'Entre em contato',body:'Tire suas dúvidas',
        primaryCta:{kind:'whatsapp',target:'+5516999999999',label:'Agendar avaliação'}},
    ],
    visualTextEdits:[],
  } as unknown as SiteSchemaModel;
}

const ctx={profile:'DEMO' as const,resolveAsset:()=>null};
describe('FRIGOLOG canonical React layout wired into CRM',()=>{
  it('loads exactly the CSS generated from the approved Next source',()=>{
    expect(FRIGOLOG_SOURCE_FINGERPRINT).not.toBe('not-synchronized');
    expect(FRIGOLOG_APPROVED_CSS).toContain('.frigolog-template');
    expect(FRIGOLOG_APPROVED_CSS).toContain('.frigolog-kpi-grid');
    expect(FRIGOLOG_APPROVED_CSS).toContain('PAGENOVA_KPI_CONTINUOUS_MARQUEE_V1');
    expect(FRIGOLOG_APPROVED_CSS).toContain('scroll-snap-type:none!important');
    expect(FRIGOLOG_APPROVED_CSS).toContain('PAGENOVA_KPI_BALANCED_CARDS_V2');
    expect(FRIGOLOG_APPROVED_CSS).toContain('PAGENOVA_UNIVERSAL_CONTRAST_V1');
    expect(FRIGOLOG_APPROVED_CSS).toContain('#operacao article h3');
    expect(FRIGOLOG_APPROVED_CSS).toContain('.hero.pn-photo-missing h1');
    expect(FRIGOLOG_APPROVED_CSS).toContain('flex:0 0 232px!important');
    expect(FRIGOLOG_APPROVED_CSS).toContain('align-items:center!important');
  });
  it('keeps 1:1 class geometry of the original template with lead content',()=>{
    const html=renderCanonicalFrigolog(site(),ctx,(s)=>s);
    expect(html).toContain('class="frigolog-template"');
    expect(html).toContain('class="hero pn-photo-missing"');
    expect(html).toContain('id="conteudo"');
    expect(html).toContain('frigolog-kpi-grid');
    expect(html).toContain('frigolog-kpi-card');
    expect(html).toContain('class="service-card');
    expect(html).toContain('Cuidado odontológico');
    expect(html).toContain('href="https://wa.me/5516999999999"');
    expect(html).not.toContain('A temperatura certa');
    expect(html).not.toContain('frigolog/cold-storage.jpg');
  });
  it('emits accessible ink tokens even when a brand specifies light foreground',()=>{
    const model=site();
    model.theme.colors.primary='#f26b60';
    model.theme.colors.text='#fff5e9';
    const html=renderCanonicalFrigolog(model,ctx,s=>s);
    expect(html).toContain('--pn-cta-ink');
    expect(html).toContain('--pn-light-accent');
    expect(html).toContain('--pn-action-ink');
  });
  it('never renders the refrigeration reference picture for an unrelated lead',()=>{
    const data=adaptCrmToFrigolog(site(),ctx);
    expect(data.hero.image.src).toBe('');
    expect(data.about.image.src).toBe('');
    const html=renderCanonicalFrigolog(site(),ctx,(s)=>s);
    expect(html).not.toContain('class="hero-image"');
    expect(html).not.toContain('class="about-image');
    expect(html).not.toContain('src=""');
  });
  it('preserves a real uploaded image resolved by the common CRM asset pipeline',()=>{
    const model=site();
    const hero=model.sections[0]!;
    if(hero.type!=='hero')throw new Error('Fixture mismatch');
    hero.image={assetId:'0123456789ABCDEFGHJKMNPQRS',alt:'Foto real da clínica',focalX:0.5,focalY:0.5};
    const html=renderCanonicalFrigolog(model,{
      profile:'DEMO',resolveAsset:(id)=>id===hero.image?.assetId?{url:'/assets/clinic-photo.webp'}:null,
    },(s)=>s);
    expect(html).toContain('/assets/clinic-photo.webp');
    expect(html).toContain('Foto real da clínica');
  });
  it('renders the real process photograph and step cards in the operation section',()=>{
    const model=site();
    model.sections.splice(4,0,{
      type:'process',id:'process-1',visible:true,anchor:'operacao',
      headline:'Como trabalhamos',subheadline:'Etapas para iniciar o atendimento',
      steps:[
        {title:'Conversa inicial',body:'Entendemos a sua necessidade',
          image:{assetId:'0123456789ABCDEFGHJKMNPQRS',alt:'Foto Google Places da clínica',focalX:0.5,focalY:0.5}},
        {title:'Próximos passos',body:'Apresentamos opções'},
      ],
    } as SiteSchemaModel['sections'][number]);
    const withImage={profile:'DEMO' as const,resolveAsset:(id:string)=>id==='0123456789ABCDEFGHJKMNPQRS'
      ? {url:'/assets/real-google-photo.webp'} : null};
    const data=adaptCrmToFrigolog(model,withImage);
    expect(data.coverage.image.src).toBe('/assets/real-google-photo.webp');
    expect(data.coverage.steps?.map(step=>step.title)).toEqual(['Conversa inicial','Próximos passos']);
    const html=renderCanonicalFrigolog(model,withImage,s=>s);
    expect(html).toContain('/assets/real-google-photo.webp');
    expect(html).toContain('Conversa inicial');
    expect(html).toContain('Entendemos a sua necessidade');
  });
  it('renders all three required visual slots when the generator binds verified images',()=>{
    const model=site();
    const ids=['0123456789ABCDEFGHJKMNPQRS','0123456789ABCDEFGHJKMNPQRT','0123456789ABCDEFGHJKMNPQRU'];
    const hero=model.sections.find((section)=>section.type==='hero');
    const about=model.sections.find((section)=>section.type==='about');
    if(hero?.type!=='hero'||about?.type!=='about')throw new Error('Fixture missing required slots');
    hero.image={assetId:ids[0]!,alt:'[hero] Ilustração de tecnologia',focalX:0.5,focalY:0.5};
    about.image={assetId:ids[1]!,alt:'[about] Imagem ilustrativa gerada por IA',focalX:0.5,focalY:0.5};
    model.sections.push({
      type:'process',id:'process-1',visible:true,anchor:'processo',
      headline:'Como trabalhamos',subheadline:'Etapas de atendimento',
      steps:[
        {title:'Entendimento',body:'Conversamos',image:{
          assetId:ids[2]!,alt:'[supplement] Imagem ilustrativa gerada por IA',focalX:0.5,focalY:0.5,
        }},
        {title:'Encaminhamento',body:'Indicamos opções'},
      ],
    } as SiteSchemaModel['sections'][number]);
    const withImages={profile:'DEMO' as const,resolveAsset:(id:string)=>
      ids.includes(id)?{url:'/assets/'+id+'.webp'}:null};
    const html=renderCanonicalFrigolog(model,withImages,s=>s);
    expect(html).toContain('data-pn-photo="hero"');
    expect(html).toContain('data-pn-photo="about"');
    expect(html).toContain('data-pn-photo="operation"');
    for(const id of ids)expect(html).toContain('/assets/'+id+'.webp');
    expect(html).toContain('não representa as instalações reais da empresa');
  });
  it('loops mobile KPI cards without repeating content to screen readers',()=>{
    const html=renderCanonicalFrigolog(site(),ctx,s=>s);
    expect(html).toContain('data-pn-kpi-rail="1"');
    expect(html).toContain('data-pn-kpi-count="4"');
    expect((html.match(/class="frigolog-kpi-card/g)??[]).length).toBe(12);
    expect((html.match(/pn-kpi-clone/g)??[]).length).toBe(8);
    expect((html.match(/aria-hidden="true" class="frigolog-kpi-card pn-kpi-clone"/g)??[]).length).toBe(8);
  });
  it('keeps auto-scroll continuous in published static HTML with touch, pause and reduced motion',()=>{
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('data-pn-kpi-rail');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('requestAnimationFrame');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('pointerdown');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('pointermove');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('prefers-reduced-motion');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('pausedUntil');
    expect(FRIGOLOG_STATIC_RUNTIME).toContain('rail.scrollLeft+=period');
  });
  it('removes only CRM classification suffix, not a business trade name',()=>{
    expect(cleanLeadBrand('Galdiano Odontologia (dentista/implante dentário)',
      'dentista/implante dentário')).toBe('Galdiano Odontologia');
    expect(cleanLeadBrand('Loja (da Praça)','loja')).toBe('Loja (da Praça)');
  });
  it('escapes user supplied lead text in the rendered HTML',()=>{
    const model=site();
    model.business.name='<script>alert(1)</script>';
    const html=renderCanonicalFrigolog(model,ctx,(s)=>s);
    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
