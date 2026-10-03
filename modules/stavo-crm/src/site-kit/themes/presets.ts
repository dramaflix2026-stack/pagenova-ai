/**
 * Temas nomeados.
 *
 * Cada um e uma direcao visual inteira -- cor, tipografia, forma e
 * profundidade -- e nao apenas uma paleta. Trocar de tema muda a aparencia do
 * site sem tocar em nenhuma secao, porque secao nunca escreve cor.
 *
 * TODO valor de cor aqui passou pelo medidor de contraste
 * (`tests/components/site-kit-themes.test.ts`): texto sobre fundo, texto sobre
 * superficie, texto de apoio, botao primario e anel de foco. Um tema bonito
 * que reprova em AA nao entra -- e o teste falha antes de chegar ao cliente.
 *
 * Os valores sao hexadecimais porque e assim que o contraste e calculado. A
 * emissao para CSS converte para trigemeo HSL (Tailwind v3) em `themes/css.ts`.
 */
import type { ThemePreset } from '@site-kit/themes/tokens';

/** Sombra suave, media e forte. Reaproveitadas entre temas claros. */
const SHADOW_SOFT = '0 1px 2px rgba(17,24,39,.04), 0 8px 24px rgba(17,24,39,.06)';
const SHADOW_MEDIUM = '0 2px 4px rgba(17,24,39,.06), 0 16px 40px rgba(17,24,39,.10)';
const SHADOW_DARK = '0 2px 6px rgba(0,0,0,.40), 0 20px 48px rgba(0,0,0,.45)';

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'personal-editorial',
    name: 'Editorial pessoal',
    description:
      'Creme e rosa queimado com serifa expressiva. Para quem vende pelo nome proprio: nutricionista, terapeuta, fotografo.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#FBF6F1',
        foreground: '#2B211D',
        muted: '#63514A',
        surface: '#FFFFFF',
        primary: '#9C4A44',
        primaryForeground: '#FFF8F5',
        secondary: '#F0DDD5',
        accent: '#B4664F',
        border: '#DCC8BA',
        ring: '#9C4A44',
        success: '#2F6B4F',
        warning: '#7A5210',
        error: '#9B2C2C',
      },
      typography: {
        heading: 'Fraunces',
        body: 'Work Sans',
        headingWeight: 600,
        headingMinRem: 2.1,
        headingMaxRem: 4.2,
        lineHeightTight: 1.12,
        lineHeightBody: 1.65,
      },
      shape: { radius: 14, shadow: SHADOW_SOFT, container: 1140 },
      button: {
        gradient: 'linear-gradient(120deg,#9C4A44,#B4664F)',
        highlight: 'rgba(255,255,255,.22)',
      },
    },
  },
  {
    id: 'startup-modern',
    name: 'Startup moderna',
    description:
      'Fundo claro com menta, coral e verde, sans forte e formas organicas. Para produto digital e servico novo.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#F6FBF9',
        foreground: '#0C2019',
        muted: '#3F5C52',
        surface: '#FFFFFF',
        primary: '#0B7A63',
        primaryForeground: '#FFFFFF',
        secondary: '#D5F2E8',
        accent: '#C2402C',
        border: '#C2DDD2',
        ring: '#0B7A63',
        success: '#15803D',
        warning: '#8A5A00',
        error: '#B4231D',
      },
      typography: {
        heading: 'Sora',
        body: 'Inter',
        headingWeight: 700,
        headingMinRem: 2.2,
        headingMaxRem: 4.4,
        lineHeightTight: 1.08,
        lineHeightBody: 1.6,
      },
      shape: { radius: 22, shadow: SHADOW_MEDIUM, container: 1200 },
      button: {
        gradient: 'linear-gradient(120deg,#0B7A63,#12A583)',
        highlight: 'rgba(255,255,255,.26)',
      },
    },
  },
  {
    id: 'professional-editorial',
    name: 'Editorial profissional',
    description:
      'Bege com verde escuro e tipografia editorial. Ar de consultoria premium: advocacia, arquitetura, financas.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#F5F0E6',
        foreground: '#1C2620',
        muted: '#4F5D53',
        surface: '#FFFDF8',
        primary: '#14532D',
        primaryForeground: '#F4FBF6',
        secondary: '#E2E8DC',
        accent: '#8A6A22',
        border: '#D2C5AC',
        ring: '#14532D',
        success: '#276749',
        warning: '#7A5210',
        error: '#9B2C2C',
      },
      typography: {
        heading: 'Playfair Display',
        body: 'Work Sans',
        headingWeight: 600,
        headingMinRem: 2.2,
        headingMaxRem: 4.6,
        lineHeightTight: 1.1,
        lineHeightBody: 1.68,
      },
      shape: { radius: 6, shadow: SHADOW_SOFT, container: 1120 },
      button: {
        gradient: 'linear-gradient(120deg,#14532D,#1F6B3B)',
        highlight: 'rgba(255,255,255,.18)',
      },
    },
  },
  {
    id: 'corporate-trust',
    name: 'Corporativo confiavel',
    description:
      'Verde profundo sobre branco, com destaque ambar. Para empresa que precisa parecer estavel antes de parecer moderna.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#FFFFFF',
        foreground: '#111E1A',
        muted: '#44564F',
        surface: '#F5F8F7',
        primary: '#0B5D45',
        primaryForeground: '#FFFFFF',
        secondary: '#DCE9E4',
        accent: '#9A5B06',
        border: '#D8E3DF',
        ring: '#0B5D45',
        success: '#15803D',
        warning: '#8A5A00',
        error: '#B4231D',
      },
      typography: {
        heading: 'Manrope',
        body: 'Inter',
        headingWeight: 700,
        headingMinRem: 2,
        headingMaxRem: 3.8,
        lineHeightTight: 1.14,
        lineHeightBody: 1.62,
      },
      shape: { radius: 8, shadow: SHADOW_SOFT, container: 1200 },
      button: {
        gradient: 'linear-gradient(120deg,#0B5D45,#0F7A5A)',
        highlight: 'rgba(255,255,255,.2)',
      },
    },
  },
  {
    id: 'local-vibrant',
    name: 'Local vibrante',
    description:
      'Cores vivas e contraste forte, com CTA impossivel de ignorar. Para servico local que vive de telefone tocando.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#FFF9F5',
        foreground: '#1A1410',
        muted: '#4D423B',
        surface: '#FFFFFF',
        primary: '#C23A0A',
        primaryForeground: '#FFFFFF',
        secondary: '#FFE3D2',
        accent: '#1565C0',
        border: '#E5C7B1',
        ring: '#C23A0A',
        success: '#15803D',
        warning: '#8A5A00',
        error: '#B4231D',
      },
      typography: {
        heading: 'Space Grotesk',
        body: 'DM Sans',
        headingWeight: 700,
        headingMinRem: 2.3,
        headingMaxRem: 4.6,
        lineHeightTight: 1.06,
        lineHeightBody: 1.58,
      },
      shape: { radius: 12, shadow: SHADOW_MEDIUM, container: 1160 },
      button: {
        gradient: 'linear-gradient(120deg,#C23A0A,#E2600F)',
        highlight: 'rgba(255,255,255,.28)',
      },
    },
  },
  {
    id: 'local-premium-dark',
    name: 'Local premium escuro',
    description:
      'Carvao azulado com dourado e alto contraste. Para servico local que cobra caro: estetica, barbearia, gastronomia.',
    mode: 'DARK',
    tokens: {
      colors: {
        background: '#0F1720',
        foreground: '#F1F5F9',
        muted: '#B4C0CC',
        surface: '#17222E',
        primary: '#E3B54A',
        primaryForeground: '#11181F',
        secondary: '#22303E',
        accent: '#F1CE7E',
        border: '#2A3846',
        ring: '#E3B54A',
        success: '#4ADE80',
        warning: '#FBBF24',
        error: '#FB7185',
      },
      typography: {
        heading: 'DM Serif Display',
        body: 'Inter',
        headingWeight: 400,
        headingMinRem: 2.3,
        headingMaxRem: 4.8,
        lineHeightTight: 1.08,
        lineHeightBody: 1.66,
      },
      shape: { radius: 10, shadow: SHADOW_DARK, container: 1180 },
      button: {
        gradient: 'linear-gradient(120deg,#E3B54A,#F1CE7E)',
        highlight: 'rgba(17,24,31,.24)',
      },
    },
  },
  {
    id: 'clinical-clean',
    name: 'Clinico limpo',
    description:
      'Branco, azul e cinzas claros. Transmite higiene e competencia: consultorio, laboratorio, odontologia.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#FFFFFF',
        foreground: '#0E2330',
        muted: '#44606E',
        surface: '#F4FAFD',
        primary: '#0A6C9E',
        primaryForeground: '#FFFFFF',
        secondary: '#DCEEF8',
        accent: '#0E7C8A',
        border: '#C6DBE8',
        ring: '#0A6C9E',
        success: '#15803D',
        warning: '#8A5A00',
        error: '#B4231D',
      },
      typography: {
        heading: 'Manrope',
        body: 'Inter',
        headingWeight: 600,
        headingMinRem: 2,
        headingMaxRem: 3.6,
        lineHeightTight: 1.16,
        lineHeightBody: 1.64,
      },
      shape: { radius: 8, shadow: SHADOW_SOFT, container: 1180 },
      button: {
        gradient: 'linear-gradient(120deg,#0A6C9E,#0E88B8)',
        highlight: 'rgba(255,255,255,.24)',
      },
    },
  },
  {
    id: 'nature-organic',
    name: 'Natural organico',
    description:
      'Verdes naturais, tons terrosos e cantos suaves. Para quem vende cuidado com a origem: produto natural, paisagismo, pet.',
    mode: 'LIGHT',
    tokens: {
      colors: {
        background: '#FAF8F1',
        foreground: '#1F2A1B',
        muted: '#4B5A42',
        surface: '#FFFFFF',
        primary: '#3D6B34',
        primaryForeground: '#F7FBF5',
        secondary: '#E3EBDA',
        accent: '#A9552A',
        border: '#D4CDB6',
        ring: '#3D6B34',
        success: '#276749',
        warning: '#7A5210',
        error: '#9B2C2C',
      },
      typography: {
        heading: 'Lora',
        body: 'Work Sans',
        headingWeight: 600,
        headingMinRem: 2.1,
        headingMaxRem: 4,
        lineHeightTight: 1.14,
        lineHeightBody: 1.68,
      },
      shape: { radius: 18, shadow: SHADOW_SOFT, container: 1160 },
      button: {
        gradient: 'linear-gradient(120deg,#3D6B34,#548646)',
        highlight: 'rgba(255,255,255,.22)',
      },
    },
  },
];
