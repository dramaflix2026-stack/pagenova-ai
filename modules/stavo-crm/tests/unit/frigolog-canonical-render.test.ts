import { describe, expect, it } from 'vitest';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { renderCanonicalFrigolog } from '@site-kit/renderer/frigolog-canonical-render';
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
