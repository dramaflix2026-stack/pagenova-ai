/**
 * Gera a documentacao visual dos temas.
 *
 *   npm run docs:themes
 *
 * Saida:
 *   docs/design-system/themes.html  amostras de cor, botao e tipografia
 *   docs/design-system/tokens.md    tabela de tokens e contraste medido
 *
 * Gerado, nunca escrito a mao: documento e produto saem do MESMO dado
 * (`themes/presets.ts`). Um token que mude no codigo e nao mude no documento
 * seria a primeira mentira do design system.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { auditThemeContrast } from '../src/site-kit/themes/contrast-audit';
import { themeCssVariables, themeStyleBlock } from '../src/site-kit/themes/css';
import { fontLinkTags } from '../src/site-kit/themes/fonts';
import { THEME_PRESETS } from '../src/site-kit/themes/presets';
import { THEME_COLOR_TOKENS, type ThemePreset } from '../src/site-kit/themes/tokens';

const DESTINO = path.resolve(process.cwd(), 'docs/design-system');

const escapar = (texto: string): string =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------------------------------------------------------------------------
// HTML: as amostras
// ---------------------------------------------------------------------------

function amostraDeCores(preset: ThemePreset): string {
  return THEME_COLOR_TOKENS.map((token) => {
    const hex = preset.tokens.colors[token];
    const nomeCss = `--${token.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;
    return `
      <figure class="swatch">
        <div class="chip" style="background:${hex}"></div>
        <figcaption><code>${nomeCss}</code><span>${hex}</span></figcaption>
      </figure>`;
  }).join('');
}

function tabelaDeContraste(preset: ThemePreset): string {
  const linhas = auditThemeContrast(preset.tokens)
    .map(
      (check) => `
        <tr>
          <td>${escapar(check.label)}</td>
          <td class="num">${check.ratio.toFixed(2)}</td>
          <td class="num">${check.required}</td>
          <td class="${check.passes ? 'ok' : 'falha'}">${check.passes ? 'passa' : 'REPROVA'}</td>
        </tr>`,
    )
    .join('');

  return `<table class="contraste">
    <caption>Contraste medido (WCAG 2.1)</caption>
    <thead><tr><th>Par</th><th>Medido</th><th>Minimo</th><th>Resultado</th></tr></thead>
    <tbody>${linhas}</tbody>
  </table>`;
}

function cartaoDoTema(preset: ThemePreset): string {
  return `
  <section class="tema" data-theme="${preset.id}" aria-labelledby="titulo-${preset.id}">
    <header class="tema-cabecalho">
      <h2 id="titulo-${preset.id}">${escapar(preset.name)}</h2>
      <p class="id"><code>${preset.id}</code> · ${preset.mode === 'DARK' ? 'escuro' : 'claro'}</p>
      <p class="descricao">${escapar(preset.description)}</p>
    </header>

    <div class="demo">
      <p class="eyebrow">Demonstracao</p>
      <h3>Um titulo do tamanho que apareceria numa hero</h3>
      <p class="corpo">
        Texto de corpo com a fonte e a entrelinha do tema. O contraste deste
        paragrafo e medido na tabela abaixo.
      </p>
      <p class="apoio">Texto de apoio, usado em legenda e descricao curta.</p>
      <div class="acoes">
        <span class="botao">Agendar avaliacao</span>
        <span class="botao secundario">Saber mais</span>
      </div>
      <div class="estados">
        <span class="estado sucesso">Sucesso</span>
        <span class="estado alerta">Alerta</span>
        <span class="estado erro">Erro</span>
      </div>
    </div>

    <div class="swatches">${amostraDeCores(preset)}</div>
    ${tabelaDeContraste(preset)}
  </section>`;
}

const ESTILO_BASE = `
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 2rem 1rem 4rem;
    background: #f4f4f5;
    color: #18181b;
    font: 16px/1.6 system-ui, -apple-system, 'Segoe UI', sans-serif;
  }
  .pagina { max-width: 1100px; margin: 0 auto; }
  .intro { margin-bottom: 2rem; }
  .intro h1 { font-size: 1.8rem; margin: 0 0 .5rem; }
  .intro p { margin: 0 0 .5rem; color: #3f3f46; max-width: 70ch; }
  .tema {
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: 1.75rem;
    margin-bottom: 2rem;
  }
  .tema-cabecalho h2 { font-family: var(--font-heading); font-weight: var(--font-heading-weight); margin: 0 0 .25rem; }
  .tema-cabecalho .id { margin: 0 0 .5rem; color: hsl(var(--muted)); font-size: .85rem; }
  .tema-cabecalho .descricao { margin: 0 0 1.5rem; color: hsl(var(--muted)); max-width: 70ch; }
  .demo {
    background: hsl(var(--surface));
    border: 1px solid hsl(var(--border));
    border-radius: var(--radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .demo .eyebrow { margin: 0 0 .5rem; text-transform: uppercase; letter-spacing: .12em; font-size: .72rem; color: hsl(var(--muted)); }
  .demo h3 {
    font-family: var(--font-heading);
    font-weight: var(--font-heading-weight);
    font-size: clamp(var(--font-heading-min), 4vw, var(--font-heading-max));
    line-height: var(--leading-tight);
    margin: 0 0 .75rem;
  }
  .demo .corpo { font-family: var(--font-body); line-height: var(--leading-body); margin: 0 0 .5rem; max-width: 60ch; }
  .demo .apoio { color: hsl(var(--muted)); margin: 0 0 1.25rem; }
  .acoes { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 1rem; }
  .botao {
    display: inline-block;
    padding: .7rem 1.4rem;
    border-radius: var(--radius-pill);
    background: var(--button-gradient);
    color: hsl(var(--primary-foreground));
    font-weight: 600;
    box-shadow: inset 0 1px 0 var(--button-highlight);
  }
  .botao.secundario {
    background: transparent;
    color: hsl(var(--foreground));
    border: 1px solid hsl(var(--border));
    box-shadow: none;
  }
  .estados { display: flex; flex-wrap: wrap; gap: 1rem; font-size: .9rem; font-weight: 600; }
  .estado.sucesso { color: hsl(var(--success)); }
  .estado.alerta { color: hsl(var(--warning)); }
  .estado.erro { color: hsl(var(--error)); }
  .swatches { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: .75rem; margin-bottom: 1.5rem; }
  .swatch { margin: 0; }
  .chip { height: 48px; border-radius: var(--radius-sm); border: 1px solid hsl(var(--border)); }
  .swatch figcaption { display: flex; flex-direction: column; font-size: .75rem; margin-top: .35rem; color: hsl(var(--muted)); }
  .swatch code { color: hsl(var(--foreground)); }
  table.contraste { width: 100%; border-collapse: collapse; font-size: .85rem; }
  table.contraste caption { text-align: left; color: hsl(var(--muted)); padding-bottom: .5rem; }
  table.contraste th, table.contraste td { text-align: left; padding: .4rem .5rem; border-bottom: 1px solid hsl(var(--border)); }
  table.contraste .num { text-align: right; font-variant-numeric: tabular-nums; }
  table.contraste .ok { color: hsl(var(--success)); font-weight: 600; }
  table.contraste .falha { color: hsl(var(--error)); font-weight: 700; }
  @media (max-width: 480px) { body { padding: 1rem .75rem 3rem; } .tema { padding: 1rem; } }
`;

function paginaHtml(): string {
  const fontes = THEME_PRESETS.flatMap((preset) => [preset.tokens.typography.heading, preset.tokens.typography.body]);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tokens dos temas — site-kit</title>
${fontLinkTags(fontes)}
<style>
${ESTILO_BASE}
${THEME_PRESETS.map((preset) => themeStyleBlock(preset)).join('\n')}
</style>
</head>
<body>
<div class="pagina">
  <div class="intro">
    <h1>Tokens dos temas</h1>
    <p>
      Gerado por <code>npm run docs:themes</code> a partir de
      <code>src/site-kit/themes/presets.ts</code>. Cada bloco mostra o tema
      aplicado de verdade: as amostras, o botao e a tipografia usam as mesmas
      variaveis CSS que o site publicado usa.
    </p>
    <p>
      As tabelas trazem o contraste medido pelo mesmo codigo que roda no teste
      (<code>themes/contrast-audit.ts</code>). Nenhum numero aqui foi digitado
      a mao.
    </p>
  </div>
  ${THEME_PRESETS.map(cartaoDoTema).join('\n')}
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Markdown: a referencia em texto
// ---------------------------------------------------------------------------

function paginaMarkdown(): string {
  const partes: string[] = [];

  partes.push('# Tokens dos temas');
  partes.push('');
  partes.push(
    '> Gerado por `npm run docs:themes` a partir de `src/site-kit/themes/presets.ts`. Não edite à mão.',
  );
  partes.push('');
  partes.push(
    'A versão visual, com amostras e demonstração de botão e tipografia, está em [themes.html](themes.html) — abra no navegador.',
  );
  partes.push('');
  partes.push('## Como usar');
  partes.push('');
  partes.push('```ts');
  partes.push("import { themeOrDefault, themeStyleBlock } from '@site-kit';");
  partes.push('');
  partes.push("const tema = themeOrDefault('clinical-clean');");
  partes.push('const css = themeStyleBlock(tema); // :root[data-theme=...] { --primary: 200 88% 33%; ... }');
  partes.push('```');
  partes.push('');
  partes.push(
    'Componente nunca escreve cor: usa `hsl(var(--primary))`, `var(--radius)`, `var(--font-heading)`. O formato de trigêmeo HSL é o do Tailwind v3, então `hsl(var(--primary) / .12)` dá a mesma cor com transparência, sem precisar de um token novo.',
  );
  partes.push('');

  for (const preset of THEME_PRESETS) {
    partes.push(`## ${preset.name} — \`${preset.id}\``);
    partes.push('');
    partes.push(`${preset.description} Modo: ${preset.mode === 'DARK' ? 'escuro' : 'claro'}.`);
    partes.push('');
    partes.push('| Token | Valor | HSL (Tailwind) |');
    partes.push('| --- | --- | --- |');
    for (const linha of themeCssVariables(preset.tokens, { indent: '' }).split('\n')) {
      const [nome, ...resto] = linha.replace(/;$/, '').split(':');
      const valor = resto.join(':').trim();
      const cor = THEME_COLOR_TOKENS.find(
        (token) => `--${token.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}` === nome!.trim(),
      );
      const hex = cor ? preset.tokens.colors[cor] : '';
      partes.push(`| \`${nome!.trim()}\` | ${hex || `\`${valor}\``} | ${hex ? `\`${valor}\`` : '—'} |`);
    }
    partes.push('');

    const checks = auditThemeContrast(preset.tokens);
    partes.push('| Contraste | Medido | Mínimo | |');
    partes.push('| --- | ---: | ---: | --- |');
    for (const check of checks) {
      partes.push(
        `| ${check.label} | ${check.ratio.toFixed(2)} | ${check.required} | ${check.passes ? 'passa' : '**REPROVA**'} |`,
      );
    }
    partes.push('');
  }

  return partes.join('\n');
}

async function main(): Promise<void> {
  await mkdir(DESTINO, { recursive: true });
  await writeFile(path.join(DESTINO, 'themes.html'), paginaHtml(), 'utf8');
  await writeFile(path.join(DESTINO, 'tokens.md'), paginaMarkdown(), 'utf8');
  console.log(`Documentacao dos temas gerada em ${DESTINO}`);
}

main().catch((erro: unknown) => {
  console.error('Falha ao gerar a documentacao dos temas:', erro);
  process.exit(1);
});
