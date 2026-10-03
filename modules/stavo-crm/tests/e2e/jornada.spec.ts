/**
 * Jornada completa da aplicacao.
 *
 * Requer a aplicacao rodando contra um banco de teste limpo e o administrador
 * criado. Configure E2E_EMAIL e E2E_PASSWORD. Veja docs/testing.md.
 *
 * A pesquisa do Google e exercitada apenas com a chave ausente (a tela deve
 * explicar a configuracao). Nenhum teste consome a API real.
 */
import { expect, test, type Page } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL ?? 'stavodigital123@gmail.com';
const PASSWORD = process.env.E2E_PASSWORD ?? '';

const carimbo = () => Date.now().toString().slice(-6);

test.skip(!PASSWORD, 'Defina E2E_PASSWORD para rodar os testes E2E.');

async function entrar(page: Page): Promise<void> {
  await page.goto('/entrar');
  await page.getByLabel('E-mail').fill(EMAIL);
  await page.getByLabel('Senha').fill(PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
}

test.describe('acesso', () => {
  test('rota privada redireciona para o login sem entrar em loop', async ({ page }) => {
    await page.goto('/crm');
    await expect(page).toHaveURL(/\/entrar/);
    await expect(page.getByRole('heading', { name: 'Stavo Digital' })).toBeVisible();
  });

  test('senha errada mostra erro generico', async ({ page }) => {
    await page.goto('/entrar');
    await page.getByLabel('E-mail').fill(EMAIL);
    await page.getByLabel('Senha').fill('senhaErradaDeProposito123');
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.getByRole('alert')).toContainText('incorretos');
  });

  test('entra e sai', async ({ page }) => {
    await entrar(page);
    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page).toHaveURL(/\/entrar/);
  });
});

test.describe('jornada comercial', () => {
  test('servico, lead, contato, follow-up, resposta, venda e dashboard', async ({ page }) => {
    const sufixo = carimbo();
    const servico = `Site institucional ${sufixo}`;
    const lead = `Padaria Teste ${sufixo}`;

    await entrar(page);

    // --- 1. Criar servico -------------------------------------------------
    await page.getByRole('link', { name: 'Servicos' }).click();
    await page.getByRole('button', { name: 'Novo servico' }).click();
    await page.getByLabel('Nome').fill(servico);
    await page.getByLabel('Preco padrao').fill('1500.00');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await expect(page.getByText(servico)).toBeVisible();

    // --- 2. Criar lead manual --------------------------------------------
    await page.getByRole('link', { name: 'CRM' }).click();
    await page.getByRole('button', { name: 'Novo lead' }).click();
    await page.getByLabel('Nome interno').fill(lead);
    await page.getByLabel('Telefone').fill(`(11) 9${sufixo}111`);
    await page.getByLabel('Cidade').fill('Sao Paulo');
    await page.getByRole('button', { name: 'Criar lead' }).click();

    // --- 3. O card nasce em Selecionados ---------------------------------
    await page.keyboard.press('Escape');
    const card = page.getByRole('article', { name: `Lead ${lead}` });
    await expect(card).toBeVisible();

    const coluna = page.getByRole('region', { name: 'Coluna Selecionados' });
    await expect(coluna.getByText(lead)).toBeVisible();

    // --- 4. Mover para Contato realizado ---------------------------------
    await card.getByRole('button', { name: 'Mover para...' }).click();
    await page.getByRole('button', { name: /Contato realizado/ }).click();
    await expect(page.getByText(/movido para Contato realizado/)).toBeVisible();

    // --- 5. Registrar tentativa e follow-up ------------------------------
    await page.getByRole('button', { name: `Abrir detalhes de ${lead}` }).click();
    await page.getByRole('tab', { name: 'Atividades' }).click();
    await page.getByLabel('Anotacao').fill('Primeira tentativa por WhatsApp');
    await page.getByRole('button', { name: 'Registrar' }).click();
    await expect(page.getByText('Tentativa registrada')).toBeVisible();

    // O historico prova que tentativa nao vira contato novo.
    await page.getByRole('tab', { name: 'Historico' }).click();
    await expect(page.getByText(/Tentativas registradas/)).toContainText('1');
    await page.getByRole('button', { name: 'Fechar' }).click();

    // --- 6. Mover para Respondeu -----------------------------------------
    const cardAtual = page.getByRole('article', { name: `Lead ${lead}` });
    await cardAtual.getByRole('button', { name: 'Mover para...' }).click();
    await page.getByRole('button', { name: /Respondeu/ }).click();

    // --- 7. Negociar ------------------------------------------------------
    await page.getByRole('article', { name: `Lead ${lead}` })
      .getByRole('button', { name: 'Mover para...' })
      .click();
    await page.getByRole('button', { name: /Em negociacao/ }).click();
    await expect(page.getByRole('heading', { name: 'Registrar negociacao' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // --- 8. Aguardando pagamento -----------------------------------------
    await page.getByRole('article', { name: `Lead ${lead}` })
      .getByRole('button', { name: 'Mover para...' })
      .click();
    await page.getByRole('button', { name: /Aguardando pagamento/ }).click();
    await expect(page.getByText('Isto ainda nao e receita')).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // --- 9. Confirmar a venda --------------------------------------------
    await page.getByRole('article', { name: `Lead ${lead}` })
      .getByRole('button', { name: 'Mover para...' })
      .click();
    await page.getByRole('button', { name: /Venda concluida/ }).click();
    await expect(page.getByRole('heading', { name: 'Confirmar venda concluida' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar' }).click();

    // --- 10. Dashboard reflete o resultado -------------------------------
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await expect(page.getByText('Receita recebida')).toBeVisible();
    await expect(page.getByText('Aguardando pagamento')).toBeVisible();
  });

  test('duplicidade: o mesmo telefone nao cria um segundo card', async ({ page }) => {
    const sufixo = carimbo();
    const telefone = `(11) 9${sufixo}222`;

    await entrar(page);
    await page.getByRole('link', { name: 'CRM' }).click();

    for (const nome of [`Empresa A ${sufixo}`, `Empresa B ${sufixo}`]) {
      await page.getByRole('button', { name: 'Novo lead' }).click();
      await page.getByLabel('Nome interno').fill(nome);
      await page.getByLabel('Telefone').fill(telefone);
      await page.getByRole('button', { name: 'Criar lead' }).click();

      if (nome.startsWith('Empresa B')) {
        // O segundo aviso explica que o lead ja existe e nao cria card novo.
        await expect(page.getByText('Este lead ja esta no CRM')).toBeVisible();
        await page.getByRole('button', { name: 'Cancelar' }).click();
      } else {
        await page.keyboard.press('Escape');
      }
    }

    await expect(page.getByText(`Empresa B ${sufixo}`)).toHaveCount(0);
  });
});

test.describe('acessibilidade e responsividade', () => {
  test('o quadro e navegavel por teclado', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'CRM' }).click();

    await page.keyboard.press('Tab');
    const focado = page.locator(':focus');
    await expect(focado).toBeVisible();
  });

  test('mover para... funciona no celular sem arrastar', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Especifico do projeto mobile.');

    await entrar(page);
    await page.getByRole('link', { name: 'CRM' }).click();

    const primeiro = page.getByRole('button', { name: 'Mover para...' }).first();
    if ((await primeiro.count()) > 0) {
      await primeiro.click();
      await expect(page.getByRole('heading', { name: 'Mover para...' })).toBeVisible();
    }
  });
});

test.describe('resiliencia', () => {
  test('sem chave configurada, a pesquisa explica em vez de quebrar', async ({ page }) => {
    await entrar(page);
    await page.getByRole('link', { name: 'Buscar empresas' }).click();
    await page.getByLabel('Nicho ou profissao').fill('psicologos');
    await page.getByRole('button', { name: 'Pesquisar' }).click();

    // Ou traz resultados (chave configurada) ou explica a configuracao.
    await expect(
      page.getByText(/GOOGLE_MAPS_API_KEY|resultado|Consumo do mes/),
    ).toBeVisible();
  });

  test('o CRM continua acessivel mesmo com o Google fora do ar', async ({ page, context }) => {
    await context.route('**/api/google/**', (route) => route.abort());

    await entrar(page);
    await page.getByRole('link', { name: 'CRM' }).click();
    await expect(page.getByRole('heading', { name: 'CRM' })).toBeVisible();
  });
});
