/**
 * Cargos e permissoes.
 *
 * Este arquivo e o nucleo de seguranca da equipe: se ele afrouxar sem alguem
 * perceber, um funcionario passa a ver o faturamento da empresa e o suporte
 * comeca a gastar cota paga do Google.
 *
 * Os testes descrevem as decisoes tomadas, nao apenas o codigo atual. Mudar
 * uma regra aqui deve exigir mudar um teste de proposito.
 */
import { describe, expect, it } from 'vitest';

import {
  CAPABILITIES,
  USER_ROLES,
  can,
  canEditLead,
  canNoteLead,
  canViewLead,
  capabilitiesOf,
  leadVisibilityOwnerFilter,
  metricsOwnerFilter,
  USER_ROLE_LABELS,
  type Capability,
} from '@shared/roles';

const GUSTAVO = 'user00000000000000000001';
const LUCAS = 'user00000000000000000002';

describe('cargos', () => {
  it('todo cargo tem rotulo em portugues', () => {
    for (const cargo of USER_ROLES) {
      expect(USER_ROLE_LABELS[cargo], cargo).toBeTruthy();
    }
  });

  it('o dono da conta pode tudo', () => {
    for (const capacidade of CAPABILITIES) {
      expect(can('OWNER', capacidade), capacidade).toBe(true);
    }
    expect(capabilitiesOf('OWNER')).toHaveLength(CAPABILITIES.length);
  });

  it('so o dono da conta gerencia a equipe e transfere leads', () => {
    for (const cargo of USER_ROLES) {
      const esperado = cargo === 'OWNER';
      expect(can(cargo, 'TEAM_MANAGE'), cargo).toBe(esperado);
      expect(can(cargo, 'LEAD_TRANSFER'), cargo).toBe(esperado);
      expect(can(cargo, 'SETTINGS_MANAGE'), cargo).toBe(esperado);
      // Mexer em lead alheio e o mesmo privilegio de destravar.
      expect(can(cargo, 'LEAD_EDIT_ANY'), cargo).toBe(esperado);
    }
  });

  it('o suporte nao gasta cota paga do Google', () => {
    expect(can('SUPPORT', 'GOOGLE_SEARCH')).toBe(false);
    expect(can('SUPPORT', 'LEAD_CREATE')).toBe(false);
    expect(can('SUPPORT', 'LEAD_IMPORT')).toBe(false);
  });

  it('o suporte nao ve nem mexe no financeiro', () => {
    expect(can('SUPPORT', 'FINANCE_VIEW_ALL')).toBe(false);
    expect(can('SUPPORT', 'FINANCE_MANAGE')).toBe(false);
  });

  it('o funcionario agora se chama Vendedor na tela', () => {
    expect(USER_ROLE_LABELS.EMPLOYEE).toBe('Vendedor');
  });

  it('o vendedor pesquisa, mas nao mexe na equipe nem define metas', () => {
    expect(can('EMPLOYEE', 'GOOGLE_SEARCH')).toBe(true);
    expect(can('EMPLOYEE', 'TEAM_MANAGE')).toBe(false);
    expect(can('EMPLOYEE', 'GOALS_MANAGE')).toBe(false);
    expect(can('EMPLOYEE', 'LEAD_VIEW_ANY')).toBe(false);
  });

  it('o funcionario prospecta, mas nao ve o caixa da empresa', () => {
    expect(can('EMPLOYEE', 'GOOGLE_SEARCH')).toBe(true);
    expect(can('EMPLOYEE', 'LEAD_CREATE')).toBe(true);
    expect(can('EMPLOYEE', 'FINANCE_VIEW_ALL')).toBe(false);
    expect(can('EMPLOYEE', 'FINANCE_MANAGE')).toBe(false);
    expect(can('EMPLOYEE', 'EXPORT_DATA')).toBe(false);
  });

  it('o socio ve o financeiro da empresa inteira', () => {
    expect(can('PARTNER', 'FINANCE_VIEW_ALL')).toBe(true);
    expect(can('PARTNER', 'FINANCE_MANAGE')).toBe(true);
    expect(can('PARTNER', 'GOOGLE_SEARCH')).toBe(true);
    expect(can('PARTNER', 'LEAD_DELETE')).toBe(true);
  });

  it('ninguem alem do dono ganha permissao por engano', () => {
    // Trava contra a lista crescer sem revisao: se alguem adicionar uma
    // permissao nova a um cargo, este teste obriga a atualizar o numero.
    // 10 desde que LEAD_VIEW_ANY entrou: socio e suporte enxergam a carteira
    // toda; o vendedor so a propria.
    expect(capabilitiesOf('PARTNER')).toHaveLength(10);
    expect(capabilitiesOf('EMPLOYEE')).toHaveLength(2);
    expect(capabilitiesOf('SUPPORT')).toHaveLength(2);
  });

  it('so o dono e o socio podem mexer em sites com IA', () => {
    expect(can('OWNER', 'SITE_AI_MANAGE')).toBe(true);
    expect(can('PARTNER', 'SITE_AI_MANAGE')).toBe(true);
    // Gerar um site consome credito pago da API: nao basta estar logado.
    expect(can('EMPLOYEE', 'SITE_AI_MANAGE')).toBe(false);
    expect(can('SUPPORT', 'SITE_AI_MANAGE')).toBe(false);
  });

  it('nenhum cargo lista permissao que nao existe', () => {
    const conhecidas = new Set<Capability>(CAPABILITIES);
    for (const cargo of USER_ROLES) {
      for (const capacidade of capabilitiesOf(cargo)) {
        expect(conhecidas.has(capacidade), `${cargo}: ${capacidade}`).toBe(true);
      }
    }
  });
});

describe('quem pode mexer no lead', () => {
  it('o dono do lead mexe no proprio', () => {
    expect(canEditLead('EMPLOYEE', LUCAS, LUCAS)).toBe(true);
    expect(canEditLead('PARTNER', LUCAS, LUCAS)).toBe(true);
  });

  it('um socio NAO mexe no lead do outro socio', () => {
    // A regra central pedida: o lead do Lucas e do Lucas.
    expect(canEditLead('PARTNER', GUSTAVO, LUCAS)).toBe(false);
    expect(canEditLead('EMPLOYEE', GUSTAVO, LUCAS)).toBe(false);
    expect(canEditLead('SUPPORT', GUSTAVO, LUCAS)).toBe(false);
  });

  it('o dono da conta destrava qualquer lead', () => {
    // Sem esta excecao, o lead de quem sai da empresa ficaria preso para
    // sempre. Foi decisao explicita de projeto.
    expect(canEditLead('OWNER', GUSTAVO, LUCAS)).toBe(true);
  });

  it('lead sem dono fica livre para quem cria lead e ve a carteira toda', () => {
    expect(canEditLead('PARTNER', GUSTAVO, null)).toBe(true);
    // O vendedor so trabalha o que ele mesmo prospectou.
    expect(canEditLead('EMPLOYEE', GUSTAVO, null)).toBe(false);
    // O suporte nao cria lead, entao tambem nao assume um lead solto.
    expect(canEditLead('SUPPORT', GUSTAVO, null)).toBe(false);
  });
});

describe('quem pode ver o lead', () => {
  it('o vendedor ve apenas os proprios leads', () => {
    expect(canViewLead('EMPLOYEE', LUCAS, LUCAS)).toBe(true);
    expect(canViewLead('EMPLOYEE', LUCAS, GUSTAVO)).toBe(false);
    expect(canViewLead('EMPLOYEE', LUCAS, null)).toBe(false);
    expect(leadVisibilityOwnerFilter('EMPLOYEE', LUCAS)).toBe(LUCAS);
  });

  it('dono, socio e suporte veem a carteira toda', () => {
    for (const cargo of ['OWNER', 'PARTNER', 'SUPPORT'] as const) {
      expect(canViewLead(cargo, GUSTAVO, LUCAS), cargo).toBe(true);
      expect(canViewLead(cargo, GUSTAVO, null), cargo).toBe(true);
      expect(leadVisibilityOwnerFilter(cargo, GUSTAVO), cargo).toBeNull();
    }
  });
});

describe('quem pode anotar no lead', () => {
  it('o suporte anota em lead de qualquer pessoa', () => {
    // E o trabalho dele: registrar atendimento em cliente ja fechado.
    expect(canNoteLead('SUPPORT', GUSTAVO, LUCAS)).toBe(true);
    // Mas continua sem poder mover nem editar.
    expect(canEditLead('SUPPORT', GUSTAVO, LUCAS)).toBe(false);
  });

  it('anotar segue proibido para quem so poderia editar o proprio', () => {
    expect(canNoteLead('PARTNER', GUSTAVO, LUCAS)).toBe(false);
    expect(canNoteLead('EMPLOYEE', GUSTAVO, LUCAS)).toBe(false);
  });
});

describe('recorte do painel', () => {
  it('dono e socio veem a empresa inteira', () => {
    expect(metricsOwnerFilter('OWNER', GUSTAVO)).toBeNull();
    expect(metricsOwnerFilter('PARTNER', GUSTAVO)).toBeNull();
  });

  it('funcionario e suporte veem apenas o proprio trabalho', () => {
    expect(metricsOwnerFilter('EMPLOYEE', LUCAS)).toBe(LUCAS);
    expect(metricsOwnerFilter('SUPPORT', LUCAS)).toBe(LUCAS);
  });
});
