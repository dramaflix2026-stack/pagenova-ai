import { describe,expect,it } from 'vitest';
import { countryCodeForName, countryOptions, citySuggestions } from '@shared/country-options';
import { resolvePlacesLocale } from '@server/modules/google/country-locale';

describe('seletor internacional Google Places',()=>{
 it('lista paises reconheciveis e sem duplicacao',()=>{
  expect(countryOptions.length).toBeGreaterThan(190);
  expect(new Set(countryOptions.map(x=>x.code)).size).toBe(countryOptions.length);
  expect(countryOptions.find(x=>x.code==='BR')?.name).toBe('Brasil');
  expect(countryOptions.find(x=>x.code==='US')).toBeDefined();
  expect(countryOptions.find(x=>x.code==='PT')).toBeDefined();
 });
 it('converte corretamente paises da lista para uma regiao Google',()=>{
  expect(countryCodeForName('Brasil')).toBe('BR');
  expect(countryCodeForName('Estados Unidos')).toBe('US');
  expect(countryCodeForName('Portugal')).toBe('PT');
  const germany=countryOptions.find(x=>x.code==='DE');
  expect(germany).toBeDefined();
  expect(countryCodeForName(germany!.name)).toBe('DE');
  expect(resolvePlacesLocale(germany!.name).regionCode).toBe('DE');
 });
 it('nao aplica indevidamente um viés brasileiro a outro pais',()=>{
  expect(resolvePlacesLocale('Portugal')).toEqual({regionCode:'PT',languageCode:'pt-PT'});
  expect(resolvePlacesLocale('Estados Unidos')).toEqual({regionCode:'US',languageCode:'en'});
  expect(resolvePlacesLocale('País ainda não identificado').regionCode).toBeUndefined();
 });
 it('permite sugestoes locais sem bloquear qualquer cidade digitada',()=>{
  expect(citySuggestions('Estados Unidos')).toContain('Miami');
  expect(citySuggestions('Portugal')).toContain('Lisboa');
  expect(citySuggestions('Alemanha')).toContain('Berlim');
  expect(citySuggestions('Brasil')).toHaveLength(0);
 });
});
