/**
 * Periodo padrao do painel.
 *
 * O painel abre no DIA. Semana, mes e periodo livre continuam disponiveis no
 * seletor, mas a pergunta de quem entra pela manha e "como esta hoje".
 *
 * O padrao existe em dois lugares -- o estado inicial da tela e o valor
 * assumido pela API quando nenhum periodo e informado. Se os dois divergirem,
 * a primeira carga mostra um intervalo e o seletor exibe outro.
 */
import { describe, expect, it } from 'vitest';

import {
  dashboardFiltersSchema,
  periodQuerySchema,
  PERIOD_PRESET_LABELS,
  PERIOD_PRESETS,
} from '@shared/schemas';

describe('periodo padrao do painel', () => {
  it('a API assume o dia quando nada e informado', () => {
    const resultado = dashboardFiltersSchema.parse({});
    expect(resultado.preset).toBe('TODAY');
  });

  it('as demais opcoes continuam aceitas', () => {
    for (const preset of PERIOD_PRESETS) {
      if (preset === 'CUSTOM') continue;
      expect(dashboardFiltersSchema.parse({ preset }).preset, preset).toBe(preset);
    }
  });

  it('a consulta por periodo tambem assume o dia', () => {
    // Os dois contratos precisam concordar: divergir faria a primeira carga
    // mostrar um intervalo e o seletor exibir outro.
    expect(periodQuerySchema.parse({}).preset).toBe('TODAY');
  });

  it('periodo livre exige as duas datas', () => {
    expect(periodQuerySchema.safeParse({ preset: 'CUSTOM' }).success).toBe(false);
    expect(
      periodQuerySchema.safeParse({ preset: 'CUSTOM', from: '2026-08-01', to: '2026-08-31' })
        .success,
    ).toBe(true);
  });

  it('periodo livre recusa data final anterior a inicial', () => {
    expect(
      periodQuerySchema.safeParse({ preset: 'CUSTOM', from: '2026-08-31', to: '2026-08-01' })
        .success,
    ).toBe(false);
  });

  it('todo periodo tem rotulo em portugues', () => {
    for (const preset of PERIOD_PRESETS) {
      expect(PERIOD_PRESET_LABELS[preset], preset).toBeTruthy();
    }
    expect(PERIOD_PRESET_LABELS.TODAY).toBe('Hoje');
  });
});
