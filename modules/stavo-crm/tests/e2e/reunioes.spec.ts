/**
 * Jornadas de reuniao, ponta a ponta.
 *
 * Requer a aplicacao rodando contra um banco de teste e o administrador
 * criado. Configure E2E_EMAIL e E2E_PASSWORD. Veja docs/testing.md.
 *
 * Nenhuma sala real e criada: o link do Meet e digitado, exatamente como o
 * usuario fara. A validacao e de formato, e o servidor nunca acessa a URL.
 */
import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? 'stavodigital123@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

const LINK_VALIDO = 'https://meet.google.com/abc-defg-hij';
const LINK_FALSO = 'https://meet.google.com.evil.example/abc';

const carimbo = () => Date.now().toString().slice(-6);

test.skip(!PASSWORD, 'Defina E2E_PASSWORD para rodar os testes E2E.');

async function entrar(page: Page): Promise<void> {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

/** Cria um lead pelo CRM e devolve o nome usado. */
async function criarLead(page: Page): Promise<string> {
  const nome = `Cliente Reuniao ${carimbo()}`;
  await page.goto('/crm');
  await page.getByRole('button', { name: 'Novo lead' }).click();
  await page.getByLabel('Nome interno').fill(nome);
  await page.getByLabel(/telefone/i).first().fill('(11) 98888-7777');
  await page.getByRole('button', { name: /salvar|criar/i }).click();
  await expect(page.getByText(nome)).toBeVisible();
  return nome;
}

/** Data de amanha no formato do campo (AAAA-MM-DD). */
const amanha = (): string => {
  const data = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return data.toISOString().slice(0, 10);
};

test.describe('agenda de reunioes', () => {
  test('a aba existe apenas para quem entrou', async ({ page }) => {
    await page.goto('/reunioes');
    await expect(page).toHaveURL(/\/entrar/);

    await entrar(page);
    await page.getByRole('link', { name: 'Reunioes' }).click();
    await expect(page.getByRole('heading', { name: 'Agenda de reunioes' })).toBeVisible();
  });

  // --- Jornada 2: link obrigatorio ---------------------------------------
  test('nao agenda sem link, recusa dominio falso e aceita o oficial', async ({ page }) => {
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();

    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('14:00');

    // Sem link, o botao continua bloqueado.
    await expect(page.getByRole('button', { name: 'Agendar reuniao' })).toBeDisabled();

    // Dominio que apenas comeca com o oficial e recusado e explicado.
    await page.getByLabel(/link do google meet/i).fill(LINK_FALSO);
    await expect(page.getByText(/nao e do Google Meet/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agendar reuniao' })).toBeDisabled();

    // Link oficial libera o envio.
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await expect(page.getByRole('button', { name: 'Agendar reuniao' })).toBeEnabled();
  });

  // --- Jornada 1 e 3: agendar e persistir --------------------------------
  test('agenda pelo calendario, aparece no card e sobrevive ao reload', async ({ page }) => {
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();
    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('14:00');
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();

    await expect(page.getByText('Reuniao agendada')).toBeVisible();
    // Aparece na lista de proximas, com o horario escolhido.
    await expect(page.getByText(new RegExp(`${nome}`))).toBeVisible();

    // Persistencia real: recarrega e continua la.
    await page.reload();
    await expect(page.getByText(new RegExp(nome))).toBeVisible();

    // E chega ao card do CRM.
    await page.goto('/crm');
    await expect(page.getByText(/amanha, 14:00/i)).toBeVisible();
  });

  // --- Jornada 5: conflito -----------------------------------------------
  test('bloqueia horario sobreposto e aceita o adjacente', async ({ page }) => {
    await entrar(page);
    const primeiro = await criarLead(page);
    const segundo = await criarLead(page);

    const agendar = async (nome: string, hora: string) => {
      await page.goto('/reunioes');
      await page.getByRole('button', { name: 'Nova reuniao' }).click();
      await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
      await page.getByRole('option', { name: new RegExp(nome) }).click();
      await page.getByLabel('Data').fill(amanha());
      await page.getByLabel('Horario').fill(hora);
      await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
      await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    };

    await agendar(primeiro, '10:00');
    await expect(page.getByText('Reuniao agendada')).toBeVisible();

    // 10:30 cai dentro da primeira, que dura 60 minutos.
    await agendar(segundo, '10:30');
    await expect(page.getByText(/ja existe uma reuniao/i)).toBeVisible();

    // 11:00 encosta sem sobrepor: permitido.
    await page.getByLabel('Horario').fill('11:00');
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    await expect(page.getByText('Reuniao agendada')).toBeVisible();
  });

  // --- Jornada 4: reagendar ----------------------------------------------
  test('reagendar move a MESMA reuniao, sem deixar evento fantasma', async ({ page }) => {
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();
    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('09:00');
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    await expect(page.getByText('Reuniao agendada')).toBeVisible();

    // Abre o detalhe pela lista de proximas e reagenda.
    await page.getByText(new RegExp(nome)).first().click();
    await page.getByRole('button', { name: /editar \/ reagendar/i }).click();
    await page.getByLabel('Horario').fill('16:00');
    await page.getByRole('button', { name: /salvar alteracoes/i }).click();
    await expect(page.getByText('Reuniao reagendada')).toBeVisible();

    // O card mostra o horario novo, e apenas ele.
    await page.goto('/crm');
    await expect(page.getByText(/amanha, 16:00/i)).toBeVisible();
    await expect(page.getByText(/amanha, 09:00/i)).toHaveCount(0);
  });

  // --- Jornada 6 e 7: desfechos ------------------------------------------
  test('cancelar exige motivo e preserva o registro', async ({ page }) => {
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();
    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('15:00');
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    await expect(page.getByText('Reuniao agendada')).toBeVisible();

    await page.getByText(new RegExp(nome)).first().click();
    await page.getByRole('button', { name: /cancelar reuniao/i }).click();

    // Sem motivo o botao continua bloqueado.
    await expect(page.getByRole('button', { name: 'Confirmar' })).toBeDisabled();
    await page.getByLabel(/motivo do cancelamento/i).fill('Cliente pediu para remarcar');
    await page.getByRole('button', { name: 'Confirmar' }).click();

    await expect(page.getByText('Reuniao cancelada')).toBeVisible();

    // Nao foi apagada: aparece no filtro de canceladas.
    await page.getByLabel('Situacao').click();
    await page.getByRole('option', { name: 'Cancelada' }).click();
    await expect(page.getByText(new RegExp(nome))).toBeVisible();
  });

  test('concluir preserva historico e nao move a etapa do CRM', async ({ page }) => {
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/crm');
    const etapaAntes = await page.getByText(nome).locator('xpath=ancestor::*[3]').innerText();

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();
    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('08:00');
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    await expect(page.getByText('Reuniao agendada')).toBeVisible();

    await page.getByText(new RegExp(nome)).first().click();
    await page.getByRole('button', { name: 'Concluida' }).click();
    await page.getByLabel(/resultado da reuniao/i).fill('Cliente aprovou o escopo');
    await page.getByRole('button', { name: 'Confirmar' }).click();
    await expect(page.getByText('Reuniao concluida')).toBeVisible();

    // O card continua na mesma etapa: concluir reuniao nao e vender.
    await page.goto('/crm');
    const etapaDepois = await page.getByText(nome).locator('xpath=ancestor::*[3]').innerText();
    expect(etapaDepois).toBe(etapaAntes);
  });

  // --- Jornada 8: celular -------------------------------------------------
  test('funciona em largura de celular, sem depender de arrastar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await entrar(page);
    const nome = await criarLead(page);

    await page.goto('/reunioes');
    await page.getByRole('button', { name: 'Nova reuniao' }).click();
    await page.getByPlaceholder('Buscar cliente no CRM...').fill(nome.slice(0, 12));
    await page.getByRole('option', { name: new RegExp(nome) }).click();
    await page.getByLabel('Data').fill(amanha());
    await page.getByLabel('Horario').fill('13:00');
    await page.getByLabel(/link do google meet/i).fill(LINK_VALIDO);
    await page.getByRole('button', { name: 'Agendar reuniao' }).click();
    await expect(page.getByText('Reuniao agendada')).toBeVisible();

    // A pagina nao pode rolar na horizontal.
    const larguraDocumento = await page.evaluate(() => document.documentElement.scrollWidth);
    const larguraJanela = await page.evaluate(() => window.innerWidth);
    expect(larguraDocumento).toBeLessThanOrEqual(larguraJanela + 1);
  });
});
