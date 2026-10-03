/**
 * Normalizacao e identidade de leads.
 *
 * Estas funcoes decidem o que e duplicata. Um erro aqui cria dois cards da
 * mesma empresa ou funde duas unidades legitimas.
 */
import { describe, expect, it } from 'vitest';

import {
  domainKey,
  nameAddressKey,
  normalizeAddress,
  normalizeCompanyName,
  normalizeEmail,
  normalizeHost,
  normalizeInstagram,
  normalizePhone,
  normalizeText,
  normalizeUrl,
  phoneKey,
  placeIdKey,
  similarity,
} from '@server/domain/normalize';

describe('texto', () => {
  it('remove acentos, pontuacao e caixa', () => {
    expect(normalizeText('Padaria São João Ltda.')).toBe('padaria sao joao ltda');
    expect(normalizeText('  ESPAÇO   extra  ')).toBe('espaco extra');
    expect(normalizeText(null)).toBe('');
  });

  it('remove sufixos societarios do nome da empresa', () => {
    expect(normalizeCompanyName('Padaria São João Ltda')).toBe('padaria sao joao');
    expect(normalizeCompanyName('Clinica Vida ME')).toBe('clinica vida');
    // Nome que so tem stopwords nao vira string vazia.
    expect(normalizeCompanyName('Ltda')).toBe('ltda');
  });

  it('unifica abreviacoes de logradouro', () => {
    expect(normalizeAddress('Avenida Paulista, 1000')).toBe('av paulista 1000');
    expect(normalizeAddress('Av. Paulista 1000')).toBe('av paulista 1000');
    expect(normalizeAddress('Rua das Flores, 25 - Apto 3')).toBe('r das flores 25 ap 3');
  });
});

describe('telefone', () => {
  it('normaliza celular brasileiro para E.164', () => {
    const phone = normalizePhone('(11) 98888-7777');
    expect(phone.isValid).toBe(true);
    expect(phone.e164).toBe('+5511988887777');
    expect(phone.country).toBe('BR');
  });

  it('reconhece o mesmo numero escrito de formas diferentes', () => {
    const a = normalizePhone('11988887777');
    const b = normalizePhone('+55 11 98888-7777');
    const c = normalizePhone('(11) 9 8888 7777');
    expect(a.e164).toBe(b.e164);
    expect(b.e164).toBe(c.e164);
  });

  it('normaliza telefone fixo', () => {
    const phone = normalizePhone('(11) 3333-4444');
    expect(phone.isValid).toBe(true);
    expect(phone.e164).toBe('+551133334444');
  });

  it('aceita numero internacional', () => {
    const phone = normalizePhone('+1 415 555 2671');
    expect(phone.isValid).toBe(true);
    expect(phone.country).toBe('US');
  });

  it('marca numero invalido sem descartar o valor digitado', () => {
    const phone = normalizePhone('123');
    expect(phone.isValid).toBe(false);
    expect(phone.e164).toBeNull();
    expect(phone.digits).toBe('123');
  });

  it('trata vazio sem quebrar', () => {
    expect(normalizePhone('').isValid).toBe(false);
    expect(normalizePhone(null).e164).toBeNull();
  });
});

describe('dominio e URL', () => {
  it('remove protocolo, www e porta', () => {
    expect(normalizeHost('https://www.exemplo.com.br/contato')).toBe('exemplo.com.br');
    expect(normalizeHost('exemplo.com.br')).toBe('exemplo.com.br');
    expect(normalizeHost('http://EXEMPLO.com.br')).toBe('exemplo.com.br');
  });

  it('recusa protocolo nao http', () => {
    expect(normalizeHost('ftp://exemplo.com')).toBeNull();
    expect(normalizeHost('javascript:alert(1)')).toBeNull();
  });

  it('canoniza URL removendo rastreadores e barra final', () => {
    expect(normalizeUrl('https://www.exemplo.com.br/?utm_source=google&id=7')).toBe(
      'https://exemplo.com.br/?id=7',
    );
    expect(normalizeUrl('https://exemplo.com.br/')).toBe('https://exemplo.com.br');
  });

  it('normaliza e-mail', () => {
    expect(normalizeEmail('  Contato@Exemplo.com ')).toBe('contato@exemplo.com');
    expect(normalizeEmail('invalido')).toBeNull();
  });

  it('normaliza Instagram por handle ou link', () => {
    expect(normalizeInstagram('@Minha.Empresa')).toBe('https://instagram.com/minha.empresa');
    expect(normalizeInstagram('https://www.instagram.com/MinhaEmpresa/')).toBe(
      'https://instagram.com/minhaempresa',
    );
    expect(normalizeInstagram('https://facebook.com/empresa')).toBeNull();
  });
});

describe('chaves de identidade', () => {
  it('gera a mesma chave para o mesmo place_id', () => {
    expect(placeIdKey('ChIJ123').keyHash).toBe(placeIdKey('ChIJ123').keyHash);
    expect(placeIdKey('ChIJ123').keyHash).not.toBe(placeIdKey('ChIJ456').keyHash);
  });

  it('gera a mesma chave para telefones equivalentes', () => {
    const a = normalizePhone('(11) 98888-7777').e164!;
    const b = normalizePhone('+5511988887777').e164!;
    expect(phoneKey(a).keyHash).toBe(phoneKey(b).keyHash);
  });

  it('gera a mesma chave para hosts equivalentes', () => {
    const a = normalizeHost('https://www.exemplo.com.br')!;
    const b = normalizeHost('exemplo.com.br/pagina')!;
    expect(domainKey(a).keyHash).toBe(domainKey(b).keyHash);
  });

  it('nome+endereco so vira chave quando ambos existem', () => {
    expect(nameAddressKey('Padaria Sao Joao', 'Av. Paulista, 1000')).not.toBeNull();
    // Nome sozinho NUNCA deduplica: franquias sao leads legitimos distintos.
    expect(nameAddressKey('Padaria Sao Joao', null)).toBeNull();
    expect(nameAddressKey(null, 'Av. Paulista, 1000')).toBeNull();
    expect(nameAddressKey('AB', 'Av. Paulista, 1000')).toBeNull();
  });

  it('mesma empresa escrita de formas diferentes gera a mesma chave', () => {
    const a = nameAddressKey('Padaria São João Ltda.', 'Avenida Paulista, 1000');
    const b = nameAddressKey('padaria sao joao', 'Av. Paulista 1000');
    expect(a?.keyHash).toBe(b?.keyHash);
  });

  it('unidades em enderecos diferentes geram chaves diferentes', () => {
    const centro = nameAddressKey('Padaria Sao Joao', 'Av. Paulista, 1000');
    const bairro = nameAddressKey('Padaria Sao Joao', 'Rua das Flores, 25');
    expect(centro?.keyHash).not.toBe(bairro?.keyHash);
  });
});

describe('similaridade', () => {
  it('reconhece nomes praticamente identicos', () => {
    expect(similarity('Padaria Sao Joao', 'Padaria São João')).toBeGreaterThan(0.95);
  });

  it('separa nomes realmente diferentes', () => {
    expect(similarity('Padaria Sao Joao', 'Farmacia Central')).toBeLessThan(0.4);
  });

  it('trata entradas vazias', () => {
    expect(similarity('', 'algo')).toBe(0);
  });
});
