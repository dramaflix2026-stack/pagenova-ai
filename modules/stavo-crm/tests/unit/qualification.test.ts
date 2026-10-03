/**
 * Pontuacao de leads, completude de dados e protecao SSRF.
 */
import { describe, expect, it } from 'vitest';

import { evaluateCompleteness } from '@server/domain/completeness';
import { normalizePhone } from '@server/domain/normalize';
import { scoreLead } from '@server/domain/scoring';
import { isBlockedAddress } from '@server/modules/google/instagram';

const mobile = normalizePhone('(11) 98888-7777');
const landline = normalizePhone('(11) 3333-4444');

describe('pontuacao de leads', () => {
  it('valoriza empresa operacional com telefone e sem site proprio', () => {
    const ideal = scoreLead({
      phone: mobile,
      classification: 'NONE',
      businessStatus: 'OPERATIONAL',
      rating: 4.6,
      userRatingCount: 120,
    });
    const oposto = scoreLead({
      phone: null,
      classification: 'OWN_WEBSITE',
      businessStatus: 'CLOSED_TEMPORARILY',
      rating: 2.1,
      userRatingCount: 80,
    });

    expect(ideal.score).toBeGreaterThan(oposto.score);
    expect(ideal.score).toBeLessThanOrEqual(100);
    expect(oposto.score).toBeGreaterThanOrEqual(0);
  });

  it('e deterministica: mesma entrada, mesma saida', () => {
    const input = {
      phone: mobile,
      classification: 'INSTAGRAM' as const,
      businessStatus: 'OPERATIONAL' as const,
      rating: 4.2,
      userRatingCount: 30,
    };
    expect(scoreLead(input).score).toBe(scoreLead(input).score);
  });

  it('sempre explica os motivos', () => {
    const result = scoreLead({
      phone: mobile,
      classification: 'INSTAGRAM',
      businessStatus: 'OPERATIONAL',
      rating: null,
      userRatingCount: null,
    });
    const labels = result.reasons.map((reason) => reason.label);
    expect(labels).toContain('Telefone disponivel');
    expect(labels.some((label) => label.includes('Instagram'))).toBe(true);
  });

  it('nao classifica qualidade comercial apenas pela nota', () => {
    const notaAlta = scoreLead({
      phone: null,
      classification: 'OWN_WEBSITE',
      businessStatus: 'OPERATIONAL',
      rating: 5,
      userRatingCount: 500,
    });
    const notaBaixaSemSite = scoreLead({
      phone: mobile,
      classification: 'NONE',
      businessStatus: 'OPERATIONAL',
      rating: 3.2,
      userRatingCount: 10,
    });
    // Sem site e com telefone vale mais do que nota alta com site pronto.
    expect(notaBaixaSemSite.score).toBeGreaterThan(notaAlta.score);
  });

  it('telefone fixo nao recebe bonus de movel', () => {
    const fixo = scoreLead({
      phone: landline,
      classification: 'NONE',
      businessStatus: 'OPERATIONAL',
      rating: null,
      userRatingCount: null,
    });
    const celular = scoreLead({
      phone: mobile,
      classification: 'NONE',
      businessStatus: 'OPERATIONAL',
      rating: null,
      userRatingCount: null,
    });
    expect(celular.score).toBeGreaterThanOrEqual(fixo.score);
  });
});

describe('completude de dados', () => {
  it('lead importado sem telefone e critico', () => {
    const result = evaluateCompleteness({
      internalName: 'Padaria Sao Joao',
      contacts: [],
      links: [],
      city: 'Sao Paulo',
      hasService: false,
      hasPlaceId: false,
    });
    expect(result.level).toBe('CRITICAL');
    expect(result.criticalIssues).toContain('Telefone ausente');
  });

  it('nome interno ausente e critico', () => {
    const result = evaluateCompleteness({
      internalName: '',
      contacts: [{ type: 'PHONE', isValid: true }],
      links: [],
      city: 'Sao Paulo',
      hasService: true,
      hasPlaceId: false,
    });
    expect(result.level).toBe('CRITICAL');
    expect(result.criticalIssues).toContain('Nome interno ausente');
  });

  it('lead do Google sem contato salvo e apenas alerta, nao critico', () => {
    const result = evaluateCompleteness({
      internalName: 'Padaria Sao Joao',
      contacts: [],
      links: [],
      city: 'Sao Paulo',
      hasService: true,
      hasPlaceId: true,
    });
    expect(result.level).toBe('WARNING');
    expect(result.criticalIssues).toHaveLength(0);
  });

  it('contato invalido tambem e critico', () => {
    const result = evaluateCompleteness({
      internalName: 'Empresa',
      contacts: [{ type: 'PHONE', isValid: false }],
      links: [],
      city: 'Sao Paulo',
      hasService: true,
      hasPlaceId: false,
    });
    expect(result.level).toBe('CRITICAL');
  });

  it('faltar Instagram ou cidade e apenas aviso, nunca bloqueia', () => {
    const result = evaluateCompleteness({
      internalName: 'Empresa',
      contacts: [{ type: 'PHONE', isValid: true }],
      links: [],
      city: null,
      hasService: false,
      hasPlaceId: false,
    });
    expect(result.level).toBe('WARNING');
    expect(result.warnings).toContain('Instagram ausente');
    expect(result.warnings).toContain('Cidade ausente');
    expect(result.warnings).toContain('Servico nao associado');
  });

  it('lead completo nao gera aviso', () => {
    const result = evaluateCompleteness({
      internalName: 'Empresa',
      contacts: [{ type: 'PHONE', isValid: true }],
      links: [{ type: 'INSTAGRAM' }, { type: 'WEBSITE' }, { type: 'MAPS' }],
      city: 'Sao Paulo',
      hasService: true,
      hasPlaceId: false,
    });
    expect(result.level).toBe('NONE');
  });
});

describe('protecao SSRF', () => {
  it('bloqueia loopback', () => {
    expect(isBlockedAddress('127.0.0.1')).toBe(true);
    expect(isBlockedAddress('127.5.5.5')).toBe(true);
    expect(isBlockedAddress('::1')).toBe(true);
  });

  it('bloqueia redes privadas', () => {
    expect(isBlockedAddress('10.0.0.1')).toBe(true);
    expect(isBlockedAddress('172.16.0.1')).toBe(true);
    expect(isBlockedAddress('172.31.255.254')).toBe(true);
    expect(isBlockedAddress('192.168.1.1')).toBe(true);
  });

  it('bloqueia o endpoint de metadados da nuvem', () => {
    expect(isBlockedAddress('169.254.169.254')).toBe(true);
  });

  it('bloqueia IPv6 privado e link-local', () => {
    expect(isBlockedAddress('fd00::1')).toBe(true);
    expect(isBlockedAddress('fe80::1')).toBe(true);
    expect(isBlockedAddress('::ffff:127.0.0.1')).toBe(true);
  });

  it('bloqueia CGNAT e multicast', () => {
    expect(isBlockedAddress('100.64.0.1')).toBe(true);
    expect(isBlockedAddress('224.0.0.1')).toBe(true);
    expect(isBlockedAddress('0.0.0.0')).toBe(true);
  });

  it('permite enderecos publicos legitimos', () => {
    expect(isBlockedAddress('8.8.8.8')).toBe(false);
    expect(isBlockedAddress('172.15.0.1')).toBe(false);
    expect(isBlockedAddress('172.32.0.1')).toBe(false);
    expect(isBlockedAddress('2001:4860:4860::8888')).toBe(false);
  });
});
