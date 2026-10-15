import { describe, expect, it } from 'vitest';
import type { SiteSchemaModel } from '@site-kit/schemas/site-schema';
import { renderVertice, VERTICE_CSS } from '@site-kit/renderer/vertice-render';
import { renderNicheSite, NICHE_CSS } from '@site-kit/renderer/niche-vertical-render';

const model={
 project:{templateId:'vertice-corporate'},
 business:{
  name:'Empresa Exemplo',niche:'Serviços profissionais',
  description:'Atendimento e orientação de clientes.',
  city:'São Paulo',state:'SP',
  services:[{name:'Atendimento especializado',description:'Acompanhamento personalizado.'}],
  whatsappE164:null,phoneE164:null,email:null,address:null,
 },
 theme:{colors:{primary:'#27573e',accent:'#27573e',background:'#fafcf9',text:'#234535'}},
 navigation:{logo:null},
 objective:{primaryCta:{kind:'anchor',target:'contato',label:'Fale conosco'}},
 sections:[],
} as unknown as SiteSchemaModel;

const ctx={profile:'DEMO' as const,resolveAsset:()=>null};
const same=(html:string)=>html;

describe('Studio templates — supplied Vertice + niche renderers',()=>{
 it('adapts the Vertice layout to the customer rather than leaking example-brand content',()=>{
  const html=renderVertice(model,ctx,same);
  expect(html).toContain('class="vertice-site"');
  expect(html).toContain('Empresa Exemplo');
  expect(html).toContain('Atendimento especializado');
  expect(html).not.toContain('vértice.');
  expect(html).not.toContain('contato@vertice');
  expect(VERTICE_CSS).toContain('@media(max-width:600px)');
 });
 it('provides a restaurant menu and contact layout without fabricated prices',()=>{
  const html=renderNicheSite(model,ctx,'restaurant',same);
  expect(html).toContain('class="pn-niche pn-restaurant"');
  expect(html).toContain('id="cardapio"');
  expect(html).toContain('id="contato"');
  expect(html).toContain('Atendimento especializado');
  expect(html).not.toMatch(/R\$\s*\d/);
 });
 it('provides honest real-estate discovery without fake inventory',()=>{
  const html=renderNicheSite(model,ctx,'estate',same);
  expect(html).toContain('class="pn-niche pn-estate"');
  expect(html).toContain('id="imoveis"');
  expect(html).toContain('Comprar');
  expect(html).toContain('Alugar');
  expect(html).not.toContain('IMÓVEL DEMONSTRATIVO');
  expect(html).not.toContain('<select');
  expect(NICHE_CSS).toContain('@media(max-width:620px)');
 });
});
