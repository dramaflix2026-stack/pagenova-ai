/**
 * Validacao do cadastro de colaborador.
 *
 * Estas mensagens aparecem embaixo do campo, para quem esta preenchendo. O
 * padrao do Zod e em ingles ("String must contain at least 12 character(s)"),
 * entao cada regra precisa de texto proprio -- foi exatamente o que faltava
 * quando adicionar uma pessoa falhava com um generico "alguns campos precisam
 * ser corrigidos".
 */
import { describe, expect, it } from 'vitest';

import { createTeamMemberSchema, resetTeamMemberPasswordSchema } from '@shared/schemas';

const valido = {
  name: 'Lucas Andrade',
  email: 'lucas@empresa.com.br',
  role: 'PARTNER' as const,
  password: 'senha-inicial-forte-2026',
};

/** Primeira mensagem de erro de um campo. */
function erroDe(entrada: unknown, campo: string): string | undefined {
  const resultado = createTeamMemberSchema.safeParse(entrada);
  if (resultado.success) return undefined;
  return resultado.error.issues.find((problema) => problema.path[0] === campo)?.message;
}

describe('cadastro de colaborador', () => {
  it('aceita um cadastro completo', () => {
    expect(createTeamMemberSchema.safeParse(valido).success).toBe(true);
  });

  it('recusa senha com menos de 12 caracteres, em portugues', () => {
    // "Lucas2026#" tem 10 -- foi o caso real que quebrou.
    const mensagem = erroDe({ ...valido, password: 'Lucas2026#' }, 'password');
    expect(mensagem).toBe('A senha deve ter pelo menos 12 caracteres.');
  });

  it('a mensagem nao volta em ingles', () => {
    const mensagem = erroDe({ ...valido, password: 'curta' }, 'password');
    expect(mensagem).not.toContain('String must contain');
    expect(mensagem).not.toContain('character(s)');
  });

  it('explica e-mail invalido', () => {
    expect(erroDe({ ...valido, email: 'lucas' }, 'email')).toBe('Informe um e-mail valido.');
  });

  it('explica nome vazio', () => {
    expect(erroDe({ ...valido, name: '' }, 'name')).toBe('Informe o nome da pessoa.');
  });

  it('recusa cargo inexistente', () => {
    expect(createTeamMemberSchema.safeParse({ ...valido, role: 'CHEFE' }).success).toBe(false);
  });

  it('o e-mail entra sem espaco sobrando', () => {
    const resultado = createTeamMemberSchema.safeParse({ ...valido, email: '  lucas@x.com  ' });
    expect(resultado.success && resultado.data.email).toBe('lucas@x.com');
  });

  it('a redefinicao de senha usa a mesma regra', () => {
    const resultado = resetTeamMemberPasswordSchema.safeParse({ password: 'Lucas2026#' });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0]?.message).toBe('A senha deve ter pelo menos 12 caracteres.');
    }
  });
});
