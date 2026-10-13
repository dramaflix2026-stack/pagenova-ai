import { describe, expect, it } from 'vitest';
import { siteBriefingSchema } from '@shared/schemas';
import { buildFixtureSite } from '@server/modules/site-ai/fixture';
import { renderSite, type RenderContext } from '@site-kit/renderer/render-site';
import { siteSchema } from '@site-kit/schemas/site-schema';

const ctx:RenderContext={
  profile:'DEMO',
  resolveAsset:(assetId)=>({url:`assets/images/${assetId}.webp`,width:1200,height:800}),
};
describe('Template 2 — Muse Editorial',()=>{
  it('defaults existing generator briefings to Template 1',()=>{
    const base={
      business:{name:'Empresa Exemplo'},
      objective:{goal:'AUTHORITY'},
      style:{theme:'AI_DECIDES',keywords:[],density:'BALANCED',motionLevel:'BALANCED'},
      requiredSections:[],forbiddenSections:[],
    };
    expect(siteBriefingSchema.parse(base).templateId).toBe('frigolog-universal');
    expect(siteBriefingSchema.parse({...base,templateId:'muse-editorial'}).templateId)
      .toBe('muse-editorial');
    expect(siteBriefingSchema.safeParse({...base,templateId:'unknown'}).success).toBe(false);
  });
  it('renders the editorial layout without changing the content schema',()=>{
    const model=buildFixtureSite();
    model.project.templateId='muse-editorial';
    const parsed=siteSchema.parse(model);
    const html=renderSite(parsed,ctx);
    expect(html).toContain('class="muse-site"');
    expect(html).toContain('data-muse-anchor="portfolio"');
    expect(html).toContain('data-muse-anchor="estudio"');
    expect(html).toContain('<main id="conteudo">');
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toContain('Epilogue');
    expect(html).toContain('Urbanist');
    expect(html).not.toContain('<script>fetch(');
  });
  it('escapes untrusted names and uses the same final renderer',()=>{
    const model=buildFixtureSite();
    model.project.templateId='muse-editorial';
    model.business.name='Nome <img src=x onerror=alert(1)>';
    const html=renderSite(model,ctx);
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
    expect(html).toContain('Nome &lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('id="contato"');
  });
});
