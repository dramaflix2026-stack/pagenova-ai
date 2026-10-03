# Tokens dos temas

> Gerado por `npm run docs:themes` a partir de `src/site-kit/themes/presets.ts`. Não edite à mão.

A versão visual, com amostras e demonstração de botão e tipografia, está em [themes.html](themes.html) — abra no navegador.

## Como usar

```ts
import { themeOrDefault, themeStyleBlock } from '@site-kit';

const tema = themeOrDefault('clinical-clean');
const css = themeStyleBlock(tema); // :root[data-theme=...] { --primary: 200 88% 33%; ... }
```

Componente nunca escreve cor: usa `hsl(var(--primary))`, `var(--radius)`, `var(--font-heading)`. O formato de trigêmeo HSL é o do Tailwind v3, então `hsl(var(--primary) / .12)` dá a mesma cor com transparência, sem precisar de um token novo.

## Editorial pessoal — `personal-editorial`

Creme e rosa queimado com serifa expressiva. Para quem vende pelo nome proprio: nutricionista, terapeuta, fotografo. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #FBF6F1 | `30 56% 96%` |
| `--foreground` | #2B211D | `17 19% 14%` |
| `--muted` | #63514A | `17 14% 34%` |
| `--surface` | #FFFFFF | `0 0% 100%` |
| `--primary` | #9C4A44 | `4 39% 44%` |
| `--primary-foreground` | #FFF8F5 | `18 100% 98%` |
| `--secondary` | #F0DDD5 | `18 47% 89%` |
| `--accent` | #B4664F | `14 40% 51%` |
| `--border` | #DCC8BA | `25 33% 80%` |
| `--ring` | #9C4A44 | `4 39% 44%` |
| `--success` | #2F6B4F | `152 39% 30%` |
| `--warning` | #7A5210 | `37 77% 27%` |
| `--error` | #9B2C2C | `0 56% 39%` |
| `--radius` | `14px` | — |
| `--radius-sm` | `6px` | — |
| `--radius-lg` | `22px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)` | — |
| `--container` | `1140px` | — |
| `--font-heading` | `'Fraunces',Georgia,'Times New Roman',serif` | — |
| `--font-body` | `'Work Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `600` | — |
| `--font-heading-min` | `2.1rem` | — |
| `--font-heading-max` | `4.2rem` | — |
| `--leading-tight` | `1.12` | — |
| `--leading-body` | `1.65` | — |
| `--button-gradient` | `linear-gradient(120deg,#9C4A44,#B4664F)` | — |
| `--button-highlight` | `rgba(255,255,255,.22)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 14.61 | 4.5 | passa |
| Texto sobre o cartao | 15.70 | 4.5 | passa |
| Texto de apoio sobre o fundo | 6.97 | 4.5 | passa |
| Texto de apoio sobre o cartao | 7.48 | 4.5 | passa |
| Texto do botao primario | 5.75 | 4.5 | passa |
| Texto sobre o secundario | 11.96 | 4.5 | passa |
| Sucesso sobre o fundo | 5.86 | 4.5 | passa |
| Alerta sobre o fundo | 6.43 | 4.5 | passa |
| Erro sobre o fundo | 7.01 | 4.5 | passa |
| Botao primario sobre o fundo | 5.62 | 3 | passa |
| Anel de foco sobre o fundo | 5.62 | 3 | passa |
| Anel de foco sobre o cartao | 6.04 | 3 | passa |
| Destaque sobre o fundo | 3.95 | 3 | passa |
| Borda sobre o fundo | 1.50 | 1.3 | passa |

## Startup moderna — `startup-modern`

Fundo claro com menta, coral e verde, sans forte e formas organicas. Para produto digital e servico novo. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #F6FBF9 | `156 38% 97%` |
| `--foreground` | #0C2019 | `159 45% 9%` |
| `--muted` | #3F5C52 | `159 19% 30%` |
| `--surface` | #FFFFFF | `0 0% 100%` |
| `--primary` | #0B7A63 | `168 83% 26%` |
| `--primary-foreground` | #FFFFFF | `0 0% 100%` |
| `--secondary` | #D5F2E8 | `159 53% 89%` |
| `--accent` | #C2402C | `8 63% 47%` |
| `--border` | #C2DDD2 | `156 28% 81%` |
| `--ring` | #0B7A63 | `168 83% 26%` |
| `--success` | #15803D | `142 72% 29%` |
| `--warning` | #8A5A00 | `39 100% 27%` |
| `--error` | #B4231D | `2 72% 41%` |
| `--radius` | `22px` | — |
| `--radius-sm` | `9px` | — |
| `--radius-lg` | `35px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 2px 4px rgba(17,24,39,.06), 0 16px 40px rgba(17,24,39,.10)` | — |
| `--container` | `1200px` | — |
| `--font-heading` | `'Sora',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-body` | `'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `700` | — |
| `--font-heading-min` | `2.2rem` | — |
| `--font-heading-max` | `4.4rem` | — |
| `--leading-tight` | `1.08` | — |
| `--leading-body` | `1.6` | — |
| `--button-gradient` | `linear-gradient(120deg,#0B7A63,#12A583)` | — |
| `--button-highlight` | `rgba(255,255,255,.26)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 16.25 | 4.5 | passa |
| Texto sobre o cartao | 16.99 | 4.5 | passa |
| Texto de apoio sobre o fundo | 7.01 | 4.5 | passa |
| Texto de apoio sobre o cartao | 7.33 | 4.5 | passa |
| Texto do botao primario | 5.28 | 4.5 | passa |
| Texto sobre o secundario | 14.31 | 4.5 | passa |
| Sucesso sobre o fundo | 4.80 | 4.5 | passa |
| Alerta sobre o fundo | 5.67 | 4.5 | passa |
| Erro sobre o fundo | 6.28 | 4.5 | passa |
| Botao primario sobre o fundo | 5.05 | 3 | passa |
| Anel de foco sobre o fundo | 5.05 | 3 | passa |
| Anel de foco sobre o cartao | 5.28 | 3 | passa |
| Destaque sobre o fundo | 4.94 | 3 | passa |
| Borda sobre o fundo | 1.38 | 1.3 | passa |

## Editorial profissional — `professional-editorial`

Bege com verde escuro e tipografia editorial. Ar de consultoria premium: advocacia, arquitetura, financas. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #F5F0E6 | `40 43% 93%` |
| `--foreground` | #1C2620 | `144 15% 13%` |
| `--muted` | #4F5D53 | `137 8% 34%` |
| `--surface` | #FFFDF8 | `43 100% 99%` |
| `--primary` | #14532D | `144 61% 20%` |
| `--primary-foreground` | #F4FBF6 | `137 47% 97%` |
| `--secondary` | #E2E8DC | `90 21% 89%` |
| `--accent` | #8A6A22 | `42 60% 34%` |
| `--border` | #D2C5AC | `39 30% 75%` |
| `--ring` | #14532D | `144 61% 20%` |
| `--success` | #276749 | `152 45% 28%` |
| `--warning` | #7A5210 | `37 77% 27%` |
| `--error` | #9B2C2C | `0 56% 39%` |
| `--radius` | `6px` | — |
| `--radius-sm` | `2px` | — |
| `--radius-lg` | `10px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)` | — |
| `--container` | `1120px` | — |
| `--font-heading` | `'Playfair Display',Georgia,'Times New Roman',serif` | — |
| `--font-body` | `'Work Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `600` | — |
| `--font-heading-min` | `2.2rem` | — |
| `--font-heading-max` | `4.6rem` | — |
| `--leading-tight` | `1.1` | — |
| `--leading-body` | `1.68` | — |
| `--button-gradient` | `linear-gradient(120deg,#14532D,#1F6B3B)` | — |
| `--button-highlight` | `rgba(255,255,255,.18)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 13.72 | 4.5 | passa |
| Texto sobre o cartao | 15.33 | 4.5 | passa |
| Texto de apoio sobre o fundo | 6.12 | 4.5 | passa |
| Texto de apoio sobre o cartao | 6.83 | 4.5 | passa |
| Texto do botao primario | 8.67 | 4.5 | passa |
| Texto sobre o secundario | 12.48 | 4.5 | passa |
| Sucesso sobre o fundo | 5.92 | 4.5 | passa |
| Alerta sobre o fundo | 6.08 | 4.5 | passa |
| Erro sobre o fundo | 6.63 | 4.5 | passa |
| Botao primario sobre o fundo | 8.02 | 3 | passa |
| Anel de foco sobre o fundo | 8.02 | 3 | passa |
| Anel de foco sobre o cartao | 8.96 | 3 | passa |
| Destaque sobre o fundo | 4.44 | 3 | passa |
| Borda sobre o fundo | 1.50 | 1.3 | passa |

## Corporativo confiavel — `corporate-trust`

Verde profundo sobre branco, com destaque ambar. Para empresa que precisa parecer estavel antes de parecer moderna. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #FFFFFF | `0 0% 100%` |
| `--foreground` | #111E1A | `162 28% 9%` |
| `--muted` | #44564F | `157 12% 30%` |
| `--surface` | #F5F8F7 | `160 18% 97%` |
| `--primary` | #0B5D45 | `162 79% 20%` |
| `--primary-foreground` | #FFFFFF | `0 0% 100%` |
| `--secondary` | #DCE9E4 | `157 23% 89%` |
| `--accent` | #9A5B06 | `34 93% 31%` |
| `--border` | #D8E3DF | `158 16% 87%` |
| `--ring` | #0B5D45 | `162 79% 20%` |
| `--success` | #15803D | `142 72% 29%` |
| `--warning` | #8A5A00 | `39 100% 27%` |
| `--error` | #B4231D | `2 72% 41%` |
| `--radius` | `8px` | — |
| `--radius-sm` | `3px` | — |
| `--radius-lg` | `13px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)` | — |
| `--container` | `1200px` | — |
| `--font-heading` | `'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-body` | `'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `700` | — |
| `--font-heading-min` | `2rem` | — |
| `--font-heading-max` | `3.8rem` | — |
| `--leading-tight` | `1.14` | — |
| `--leading-body` | `1.62` | — |
| `--button-gradient` | `linear-gradient(120deg,#0B5D45,#0F7A5A)` | — |
| `--button-highlight` | `rgba(255,255,255,.2)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 17.15 | 4.5 | passa |
| Texto sobre o cartao | 16.05 | 4.5 | passa |
| Texto de apoio sobre o fundo | 7.81 | 4.5 | passa |
| Texto de apoio sobre o cartao | 7.31 | 4.5 | passa |
| Texto do botao primario | 7.88 | 4.5 | passa |
| Texto sobre o secundario | 13.74 | 4.5 | passa |
| Sucesso sobre o fundo | 5.02 | 4.5 | passa |
| Alerta sobre o fundo | 5.93 | 4.5 | passa |
| Erro sobre o fundo | 6.56 | 4.5 | passa |
| Botao primario sobre o fundo | 7.88 | 3 | passa |
| Anel de foco sobre o fundo | 7.88 | 3 | passa |
| Anel de foco sobre o cartao | 7.37 | 3 | passa |
| Destaque sobre o fundo | 5.42 | 3 | passa |
| Borda sobre o fundo | 1.31 | 1.3 | passa |

## Local vibrante — `local-vibrant`

Cores vivas e contraste forte, com CTA impossivel de ignorar. Para servico local que vive de telefone tocando. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #FFF9F5 | `24 100% 98%` |
| `--foreground` | #1A1410 | `24 24% 8%` |
| `--muted` | #4D423B | `23 13% 27%` |
| `--surface` | #FFFFFF | `0 0% 100%` |
| `--primary` | #C23A0A | `16 90% 40%` |
| `--primary-foreground` | #FFFFFF | `0 0% 100%` |
| `--secondary` | #FFE3D2 | `23 100% 91%` |
| `--accent` | #1565C0 | `212 80% 42%` |
| `--border` | #E5C7B1 | `25 50% 80%` |
| `--ring` | #C23A0A | `16 90% 40%` |
| `--success` | #15803D | `142 72% 29%` |
| `--warning` | #8A5A00 | `39 100% 27%` |
| `--error` | #B4231D | `2 72% 41%` |
| `--radius` | `12px` | — |
| `--radius-sm` | `5px` | — |
| `--radius-lg` | `19px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 2px 4px rgba(17,24,39,.06), 0 16px 40px rgba(17,24,39,.10)` | — |
| `--container` | `1160px` | — |
| `--font-heading` | `'Space Grotesk',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-body` | `'DM Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `700` | — |
| `--font-heading-min` | `2.3rem` | — |
| `--font-heading-max` | `4.6rem` | — |
| `--leading-tight` | `1.06` | — |
| `--leading-body` | `1.58` | — |
| `--button-gradient` | `linear-gradient(120deg,#C23A0A,#E2600F)` | — |
| `--button-highlight` | `rgba(255,255,255,.28)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 17.47 | 4.5 | passa |
| Texto sobre o cartao | 18.24 | 4.5 | passa |
| Texto de apoio sobre o fundo | 9.32 | 4.5 | passa |
| Texto de apoio sobre o cartao | 9.73 | 4.5 | passa |
| Texto do botao primario | 5.38 | 4.5 | passa |
| Texto sobre o secundario | 14.91 | 4.5 | passa |
| Sucesso sobre o fundo | 4.81 | 4.5 | passa |
| Alerta sobre o fundo | 5.68 | 4.5 | passa |
| Erro sobre o fundo | 6.29 | 4.5 | passa |
| Botao primario sobre o fundo | 5.15 | 3 | passa |
| Anel de foco sobre o fundo | 5.15 | 3 | passa |
| Anel de foco sobre o cartao | 5.38 | 3 | passa |
| Destaque sobre o fundo | 5.51 | 3 | passa |
| Borda sobre o fundo | 1.53 | 1.3 | passa |

## Local premium escuro — `local-premium-dark`

Carvao azulado com dourado e alto contraste. Para servico local que cobra caro: estetica, barbearia, gastronomia. Modo: escuro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #0F1720 | `212 36% 9%` |
| `--foreground` | #F1F5F9 | `210 40% 96%` |
| `--muted` | #B4C0CC | `210 19% 75%` |
| `--surface` | #17222E | `211 33% 14%` |
| `--primary` | #E3B54A | `42 73% 59%` |
| `--primary-foreground` | #11181F | `210 29% 9%` |
| `--secondary` | #22303E | `210 29% 19%` |
| `--accent` | #F1CE7E | `42 80% 72%` |
| `--border` | #2A3846 | `210 25% 22%` |
| `--ring` | #E3B54A | `42 73% 59%` |
| `--success` | #4ADE80 | `142 69% 58%` |
| `--warning` | #FBBF24 | `43 96% 56%` |
| `--error` | #FB7185 | `351 95% 71%` |
| `--radius` | `10px` | — |
| `--radius-sm` | `4px` | — |
| `--radius-lg` | `16px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 2px 6px rgba(0,0,0,.40), 0 20px 48px rgba(0,0,0,.45)` | — |
| `--container` | `1180px` | — |
| `--font-heading` | `'DM Serif Display',Georgia,'Times New Roman',serif` | — |
| `--font-body` | `'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `400` | — |
| `--font-heading-min` | `2.3rem` | — |
| `--font-heading-max` | `4.8rem` | — |
| `--leading-tight` | `1.08` | — |
| `--leading-body` | `1.66` | — |
| `--button-gradient` | `linear-gradient(120deg,#E3B54A,#F1CE7E)` | — |
| `--button-highlight` | `rgba(17,24,31,.24)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 16.47 | 4.5 | passa |
| Texto sobre o cartao | 14.69 | 4.5 | passa |
| Texto de apoio sobre o fundo | 9.76 | 4.5 | passa |
| Texto de apoio sobre o cartao | 8.70 | 4.5 | passa |
| Texto do botao primario | 9.35 | 4.5 | passa |
| Texto sobre o secundario | 12.29 | 4.5 | passa |
| Sucesso sobre o fundo | 10.36 | 4.5 | passa |
| Alerta sobre o fundo | 10.81 | 4.5 | passa |
| Erro sobre o fundo | 6.70 | 4.5 | passa |
| Botao primario sobre o fundo | 9.43 | 3 | passa |
| Anel de foco sobre o fundo | 9.43 | 3 | passa |
| Anel de foco sobre o cartao | 8.41 | 3 | passa |
| Destaque sobre o fundo | 11.92 | 3 | passa |
| Borda sobre o fundo | 1.51 | 1.3 | passa |

## Clinico limpo — `clinical-clean`

Branco, azul e cinzas claros. Transmite higiene e competencia: consultorio, laboratorio, odontologia. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #FFFFFF | `0 0% 100%` |
| `--foreground` | #0E2330 | `203 55% 12%` |
| `--muted` | #44606E | `200 24% 35%` |
| `--surface` | #F4FAFD | `200 69% 97%` |
| `--primary` | #0A6C9E | `200 88% 33%` |
| `--primary-foreground` | #FFFFFF | `0 0% 100%` |
| `--secondary` | #DCEEF8 | `201 67% 92%` |
| `--accent` | #0E7C8A | `187 82% 30%` |
| `--border` | #C6DBE8 | `203 42% 84%` |
| `--ring` | #0A6C9E | `200 88% 33%` |
| `--success` | #15803D | `142 72% 29%` |
| `--warning` | #8A5A00 | `39 100% 27%` |
| `--error` | #B4231D | `2 72% 41%` |
| `--radius` | `8px` | — |
| `--radius-sm` | `3px` | — |
| `--radius-lg` | `13px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)` | — |
| `--container` | `1180px` | — |
| `--font-heading` | `'Manrope',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-body` | `'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `600` | — |
| `--font-heading-min` | `2rem` | — |
| `--font-heading-max` | `3.6rem` | — |
| `--leading-tight` | `1.16` | — |
| `--leading-body` | `1.64` | — |
| `--button-gradient` | `linear-gradient(120deg,#0A6C9E,#0E88B8)` | — |
| `--button-highlight` | `rgba(255,255,255,.24)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 16.13 | 4.5 | passa |
| Texto sobre o cartao | 15.32 | 4.5 | passa |
| Texto de apoio sobre o fundo | 6.68 | 4.5 | passa |
| Texto de apoio sobre o cartao | 6.34 | 4.5 | passa |
| Texto do botao primario | 5.75 | 4.5 | passa |
| Texto sobre o secundario | 13.54 | 4.5 | passa |
| Sucesso sobre o fundo | 5.02 | 4.5 | passa |
| Alerta sobre o fundo | 5.93 | 4.5 | passa |
| Erro sobre o fundo | 6.56 | 4.5 | passa |
| Botao primario sobre o fundo | 5.75 | 3 | passa |
| Anel de foco sobre o fundo | 5.75 | 3 | passa |
| Anel de foco sobre o cartao | 5.46 | 3 | passa |
| Destaque sobre o fundo | 4.92 | 3 | passa |
| Borda sobre o fundo | 1.43 | 1.3 | passa |

## Natural organico — `nature-organic`

Verdes naturais, tons terrosos e cantos suaves. Para quem vende cuidado com a origem: produto natural, paisagismo, pet. Modo: claro.

| Token | Valor | HSL (Tailwind) |
| --- | --- | --- |
| `--background` | #FAF8F1 | `47 47% 96%` |
| `--foreground` | #1F2A1B | `104 22% 14%` |
| `--muted` | #4B5A42 | `98 15% 31%` |
| `--surface` | #FFFFFF | `0 0% 100%` |
| `--primary` | #3D6B34 | `110 35% 31%` |
| `--primary-foreground` | #F7FBF5 | `100 43% 97%` |
| `--secondary` | #E3EBDA | `88 30% 89%` |
| `--accent` | #A9552A | `20 60% 41%` |
| `--border` | #D4CDB6 | `46 26% 77%` |
| `--ring` | #3D6B34 | `110 35% 31%` |
| `--success` | #276749 | `152 45% 28%` |
| `--warning` | #7A5210 | `37 77% 27%` |
| `--error` | #9B2C2C | `0 56% 39%` |
| `--radius` | `18px` | — |
| `--radius-sm` | `7px` | — |
| `--radius-lg` | `29px` | — |
| `--radius-pill` | `999px` | — |
| `--shadow` | `0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)` | — |
| `--container` | `1160px` | — |
| `--font-heading` | `'Lora',Georgia,'Times New Roman',serif` | — |
| `--font-body` | `'Work Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif` | — |
| `--font-heading-weight` | `600` | — |
| `--font-heading-min` | `2.1rem` | — |
| `--font-heading-max` | `4rem` | — |
| `--leading-tight` | `1.14` | — |
| `--leading-body` | `1.68` | — |
| `--button-gradient` | `linear-gradient(120deg,#3D6B34,#548646)` | — |
| `--button-highlight` | `rgba(255,255,255,.22)` | — |

| Contraste | Medido | Mínimo | |
| --- | ---: | ---: | --- |
| Texto sobre o fundo | 14.06 | 4.5 | passa |
| Texto sobre o cartao | 14.94 | 4.5 | passa |
| Texto de apoio sobre o fundo | 6.96 | 4.5 | passa |
| Texto de apoio sobre o cartao | 7.39 | 4.5 | passa |
| Texto do botao primario | 5.99 | 4.5 | passa |
| Texto sobre o secundario | 12.21 | 4.5 | passa |
| Sucesso sobre o fundo | 6.33 | 4.5 | passa |
| Alerta sobre o fundo | 6.50 | 4.5 | passa |
| Erro sobre o fundo | 7.08 | 4.5 | passa |
| Botao primario sobre o fundo | 5.90 | 3 | passa |
| Anel de foco sobre o fundo | 5.90 | 3 | passa |
| Anel de foco sobre o cartao | 6.27 | 3 | passa |
| Destaque sobre o fundo | 4.92 | 3 | passa |
| Borda sobre o fundo | 1.50 | 1.3 | passa |
