import {describe,expect,it} from 'vitest';
import type {SiteSchemaModel} from '@site-kit/schemas/site-schema';
import {renderCasaMesa,CASA_CSS,CASA_JS} from '@site-kit/renderer/casa-mesa-render';
const model={
 project:{templateId:'restaurant-premium'},
 business:{
  name:'Bistrô Teste', niche:'Restaurante',description:'Comida artesanal feita com carinho.',
  city:'Campinas',state:'SP',services:[
   {name:'Peixe grelhado',description:'Prato da casa com ervas.'},
   {name:'Mousse de chocolate',description:'Sobremesa caseira.'},
   {name:'Suco natural',description:'Frutas da estação.'}
  ],
  whatsappE164:null,phoneE164:null,email:null,address:null
 },
 navigation:{logo:null},objective:{primaryCta:{kind:'anchor',target:'contato',label:'Entrar em contato'}},
 sections:[],theme:{colors:{primary:'#28563a',accent:'#28563a',background:'#fdfdf9',text:'#293e30'}},
} as unknown as SiteSchemaModel;
const ctx={profile:'DEMO' as const,resolveAsset:()=>null};
describe('Casa da Mesa / restaurante',()=>{
 it('uses customer facts and available menu items rather than demo prices and brands',()=>{
  const html=renderCasaMesa(model,ctx,text=>text);
  expect(html).toContain('Bistrô Teste');
  expect(html).toContain('Peixe grelhado');
  expect(html).toContain('Mousse de chocolate');
  expect(html).toContain('Suco natural');
  expect(html).toContain('data-cs-slot="services"');
  expect(html).not.toContain('Filé da casa');
  expect(html).not.toContain('R$ 64,90');
  expect(html).not.toContain('casa da mesa.');
 });
 it('keeps typography, mobile styles and functional category switching',()=>{
  expect(CASA_CSS).toContain("DM Serif Display");
  expect(CASA_CSS).toContain("DM Sans");
  expect(CASA_CSS).toContain('@media(max-width:700px)');
  expect(()=>new Function(CASA_JS)).not.toThrow();
  expect(CASA_JS).toContain('data-category');
 });
});
