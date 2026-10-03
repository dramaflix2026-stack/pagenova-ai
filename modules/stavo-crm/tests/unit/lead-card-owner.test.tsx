/**
 * @vitest-environment jsdom
 *
 * Card do CRM: de quem e o lead.
 *
 * O dono da conta pode alterar qualquer lead, mas precisa enxergar que o
 * contato esta sendo trabalhado por outra pessoa -- pelo NOME dela, nunca
 * pelo cargo. Antes, por poder alterar, ele via "Com voce" no lead do
 * vendedor.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LeadCard, type BoardCardData } from '@client/components/crm/LeadCard';

const DONO_DA_CONTA = 'user00000000000000000001';
const LUCAS = 'user00000000000000000002';

vi.mock('@client/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: usuarioLogado.id } }),
}));
const usuarioLogado = { id: DONO_DA_CONTA };

afterEach(() => cleanup());

function card(parcial: Partial<BoardCardData>): BoardCardData {
  return {
    id: 'lead1',
    internalName: 'Padaria Central',
    originType: 'GOOGLE_PLACE',
    sourceName: null,
    stageId: 'stage1',
    incompleteLevel: 'OK',
    stageEnteredAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    archivedAt: null,
    city: 'Campinas',
    niche: null,
    serviceSummary: [],
    proposedTotal: '0.00',
    billingTypes: [],
    nextFollowUpAt: null,
    followUpStatus: 'NONE',
    pendingAmount: '0.00',
    overdueAmount: '0.00',
    paidAmount: '0.00',
    hasActiveSubscription: false,
    attemptCount: 0,
    hasReplied: false,
    hasSale: false,
    owner: null,
    canEdit: true,
    nextMeeting: null,
    ...parcial,
  };
}

const renderizar = (dados: BoardCardData) =>
  render(<LeadCard card={dados} onOpen={() => {}} onRequestMove={() => {}} draggable={false} />);

describe('quem esta trabalhando o lead', () => {
  it('o dono da conta ve o nome do vendedor, mesmo podendo alterar', () => {
    usuarioLogado.id = DONO_DA_CONTA;
    renderizar(card({ owner: { id: LUCAS, name: 'Lucas Andrade' }, canEdit: true }));

    expect(screen.getByText('Lucas Andrade')).toBeTruthy();
    expect(screen.getByText(/esta trabalhando/)).toBeTruthy();
    expect(screen.queryByText('Com voce')).toBeNull();
    // Nome da pessoa, nunca o cargo.
    expect(screen.queryByText(/Vendedor/)).toBeNull();
  });

  it('quem nao pode alterar tambem ve o nome', () => {
    usuarioLogado.id = DONO_DA_CONTA;
    renderizar(card({ owner: { id: LUCAS, name: 'Lucas Andrade' }, canEdit: false }));
    expect(screen.getByText('Lucas Andrade')).toBeTruthy();
  });

  it('no proprio lead aparece "Com voce"', () => {
    usuarioLogado.id = LUCAS;
    renderizar(card({ owner: { id: LUCAS, name: 'Lucas Andrade' }, canEdit: true }));
    expect(screen.getByText('Com voce')).toBeTruthy();
    expect(screen.queryByText(/esta trabalhando/)).toBeNull();
  });

  it('lead sem responsavel nao mostra aviso', () => {
    usuarioLogado.id = DONO_DA_CONTA;
    renderizar(card({ owner: null }));
    expect(screen.queryByText(/esta trabalhando/)).toBeNull();
    expect(screen.queryByText('Com voce')).toBeNull();
  });
});
