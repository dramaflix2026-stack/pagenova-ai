/**
 * @vitest-environment jsdom
 *
 * Formulario de reuniao: as regras que o usuario percebe.
 *
 * Cobre a jornada do link obrigatorio -- a exigencia mais rigida do modulo.
 * A tela precisa explicar o problema ANTES do envio; deixar o servidor
 * recusar depois seria uma experiencia pior e mais lenta.
 *
 * O objetivo aqui nao e testar o Radix nem o React, e sim garantir que o
 * botao de salvar so libera quando o cadastro esta realmente valido.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MeetingFormDialog } from '@client/components/meetings/MeetingFormDialog';
import { ToastProvider } from '@client/components/ui/Toast';

/** jsdom nao implementa estes; o Radix os usa ao abrir o dialogo. */
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
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderForm(props: Partial<Parameters<typeof MeetingFormDialog>[0]> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MeetingFormDialog
          open
          onOpenChange={() => {}}
          fixedLead={{ id: 'lead00000000000000000001', internalName: 'Padaria Sao Joao' }}
          {...props}
        />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const botaoSalvar = () => screen.getByRole('button', { name: /agendar reuniao/i });
const campoLink = () => screen.getByLabelText(/link do google meet/i);

describe('formulario de reuniao', () => {
  it('preenche o lead e sugere o titulo quando vem do card', () => {
    renderForm();
    expect(screen.getByText('Padaria Sao Joao')).toBeTruthy();
    const titulo = screen.getByLabelText(/titulo da reuniao/i) as HTMLInputElement;
    expect(titulo.value).toBe('Reuniao com Padaria Sao Joao');
  });

  it('nao deixa salvar sem o link do Meet', () => {
    renderForm();
    // Todos os demais campos ja vem preenchidos por padrao.
    expect((botaoSalvar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('explica o erro de um dominio falso, sem esperar o servidor', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(campoLink(), 'https://meet.google.com.evil.example/abc');

    await waitFor(() => {
      expect(screen.getByText(/nao e do Google Meet/i)).toBeTruthy();
    });
    expect((botaoSalvar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('recusa http e explica que precisa de https', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(campoLink(), 'http://meet.google.com/abc-defg-hij');

    await waitFor(() => {
      expect(screen.getByText(/precisa comecar com https/i)).toBeTruthy();
    });
    expect((botaoSalvar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('recusa o dominio sem a sala', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(campoLink(), 'https://meet.google.com/');

    await waitFor(() => {
      expect(screen.getByText(/falta o codigo da sala/i)).toBeTruthy();
    });
  });

  it('libera o botao com um link oficial valido', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(campoLink(), 'https://meet.google.com/abc-defg-hij');

    await waitFor(() => {
      expect((botaoSalvar() as HTMLButtonElement).disabled).toBe(false);
    });
    // O atalho de teste do link so aparece quando ele e valido.
    expect(screen.getByText(/testar o link agora/i)).toBeTruthy();
  });

  it('o link externo abre com os atributos de seguranca', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(campoLink(), 'https://meet.google.com/abc-defg-hij');

    await waitFor(() => {
      const link = screen.getByText(/testar o link agora/i).closest('a');
      expect(link?.getAttribute('target')).toBe('_blank');
      // Sem noopener, a aba aberta ganharia acesso a esta janela.
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('avisa quando o horario escolhido ja passou', async () => {
    const user = userEvent.setup();
    renderForm();

    const data = screen.getByLabelText(/^data/i);
    await user.clear(data);
    await user.type(data, '2020-01-01');

    await waitFor(() => {
      expect(screen.getByText(/nao e possivel agendar uma reuniao no passado/i)).toBeTruthy();
    });
    expect((botaoSalvar() as HTMLButtonElement).disabled).toBe(true);
  });

  it('mostra o horario de termino calculado', () => {
    renderForm();
    // O fuso aparece no cabecalho e ao lado do termino; aqui interessa o
    // calculo do fim, que confirma a conversao de duracao.
    expect(screen.getByText(/termina as/i)).toBeTruthy();
  });
});
