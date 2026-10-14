import { describe, expect, it } from 'vitest';
import { ATELIER_NORTE_CSS, ATELIER_NORTE_RUNTIME } from './atelier-norte-render';

describe('Atelier Norte (template 003)', () => {
  it('keeps the supplied typography and responsive layout rules', () => {
    expect(ATELIER_NORTE_CSS).toContain('Instrument Serif');
    expect(ATELIER_NORTE_CSS).toContain('Work Sans');
    expect(ATELIER_NORTE_CSS).toContain('oklch(.965 .012 80)');
    expect(ATELIER_NORTE_CSS).toContain('@media(max-width:767px)');
  });

  it('ships a syntactically valid and fully local four-page router', () => {
    expect(ATELIER_NORTE_RUNTIME).toContain('hashchange');
    expect(ATELIER_NORTE_RUNTIME).toContain('["inicio","sobre","servicos","contato"]');
    expect(() => new Function(ATELIER_NORTE_RUNTIME)).not.toThrow();
  });

  it('opens the actual email or WhatsApp provider, without fake success messages', () => {
    expect(ATELIER_NORTE_RUNTIME).toContain('mailto:');
    expect(ATELIER_NORTE_RUNTIME).toContain('https://wa.me/');
    expect(ATELIER_NORTE_RUNTIME).not.toContain('Mensagem enviada!');
  });
});
