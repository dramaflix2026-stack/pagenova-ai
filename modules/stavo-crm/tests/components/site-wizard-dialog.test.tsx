/**
 * @vitest-environment jsdom
 *
 * Assistente de criacao de site: a navegacao entre os 3 passos e as travas
 * que impedem avancar sem o minimo exigido pela secao 7.5 da especificacao.
 *
 * Nao testa a submissao contra rede real -- isso e responsabilidade dos
 * testes de integracao do modulo. Aqui o alvo e o comportamento que o
 * administrador ve na tela.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SiteWizardDialog } from '@client/components/site-ai/SiteWizardDialog';
import { ToastProvider } from '@client/components/ui/Toast';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderWizard(props: Partial<Parameters<typeof SiteWizardDialog>[0]> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SiteWizardDialog open onOpenChange={() => {}} onCreated={() => {}} {...props} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const botaoContinuar = () => screen.getByRole('button', { name: /continuar/i });

describe('assistente de criacao de site', () => {
  it('nao deixa avancar do passo 1 sem o nome do negocio', () => {
    renderWizard();
    expect((botaoContinuar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('libera o passo 2 assim que o nome e digitado', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByPlaceholderText(/clinica aurora/i), 'Estudio Bella');
    expect((botaoContinuar() as HTMLButtonElement).disabled).toBe(false);

    await user.click(botaoContinuar());
    expect(screen.getByText('Tipo de site')).toBeTruthy();
  });

  it('pre-preenche os campos quando vem de um lead', () => {
    renderWizard({
      leadId: 'lead00000000000000000001',
      initialBusinessName: 'Padaria Sao Joao',
      initialPhone: '+5519998877665',
    });

    expect((screen.getByPlaceholderText(/clinica aurora/i) as HTMLInputElement).value).toBe('Padaria Sao Joao');
  });

  it('limita a selecao de estilo a 4 palavras', async () => {
    const user = userEvent.setup();
    renderWizard({ initialBusinessName: 'Estudio Bella' });

    await user.click(botaoContinuar()); // passo 2

    const palavras = ['moderno', 'elegante', 'premium', 'acolhedor', 'minimalista'];
    for (const palavra of palavras) {
      await user.click(screen.getByRole('button', { name: palavra }));
    }

    // As 4 primeiras ficam marcadas (fundo destacado); a 5a nao afeta a selecao.
    const minimalista = screen.getByRole('button', { name: 'minimalista' });
    expect(minimalista.className).not.toContain('border-primary');
  });

  it('o botao "Voltar" retorna ao passo anterior sem perder o que foi digitado', async () => {
    const user = userEvent.setup();
    renderWizard();

    await user.type(screen.getByPlaceholderText(/clinica aurora/i), 'Estudio Bella');
    await user.click(botaoContinuar());
    expect(screen.getByText('Tipo de site')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /voltar/i }));
    expect((screen.getByPlaceholderText(/clinica aurora/i) as HTMLInputElement).value).toBe('Estudio Bella');
  });

  it('so mostra o resumo e o botao "Criar site" no ultimo passo', async () => {
    const user = userEvent.setup();
    renderWizard({ initialBusinessName: 'Estudio Bella' });

    expect(screen.queryByRole('button', { name: /^criar site$/i })).toBeNull();

    await user.click(botaoContinuar()); // passo 2
    await user.click(botaoContinuar()); // passo 3

    expect(screen.getByRole('button', { name: /^criar site$/i })).toBeTruthy();
    expect(screen.getByText('Antes de gerar')).toBeTruthy();
  });
});
